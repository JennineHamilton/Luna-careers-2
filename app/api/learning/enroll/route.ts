/**
 * API Route: Enrollment Management
 * POST /api/learning/enroll - Enroll in content (module, course, or program)
 * 
 * Business Logic:
 * - Check prerequisites
 * - Check/deduct credits (unless free or scholarship)
 * - Create enrollment record
 * - Auto-enroll in child content (courses in program, modules in course)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '../_helpers/auth';
import type { Database } from '@/types/database.types';
import { dollarsToCreditsServer } from '@/lib/utils/credit-settings';
import { validateBody } from '@/lib/validation/validate';
import { enrollmentCreateSchema } from '@/lib/validation/schemas';

type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert'];

/**
 * POST /api/learning/enroll
 * Enroll user in content
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();

    // Validate request body
    const validation = await validateBody(request, enrollmentCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { content_type, content_id, scholarship_id } = validation.data;
    
    const userId = authResult.user!.id;
    
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('enrollment_type', content_type)
      .eq('enrollment_id', content_id)
      .single();
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this content' },
        { status: 400 }
      );
    }
    
    // Get content details
    const tableName = content_type === 'module' ? 'modules' : 
                     content_type === 'course' ? 'courses' : 'programs';
    
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', content_id)
      .single();
    
    if (contentError || !content) {
      return NextResponse.json(
        { error: `${content_type} not found` },
        { status: 404 }
      );
    }
    
    // Check if content is published
    if (!content.is_published) {
      return NextResponse.json(
        { error: 'Content is not published' },
        { status: 400 }
      );
    }
    
    // Check prerequisites (courses have prerequisite courses that must be completed first)
    if (content_type === 'course') {
      const { data: prerequisites } = await supabase
        .from('course_prerequisites')
        .select('prerequisite_course_id, courses!course_prerequisites_prerequisite_course_id_fkey(title)')
        .eq('course_id', content_id);

      if (prerequisites && prerequisites.length > 0) {
        const prereqIds = prerequisites.map(p => p.prerequisite_course_id).filter((id): id is string => id !== null);

        // Check which prerequisites the user has completed
        const { data: completedEnrollments } = await supabase
          .from('enrollments')
          .select('enrollment_id')
          .eq('user_id', userId)
          .eq('enrollment_type', 'course')
          .eq('status', 'completed')
          .in('enrollment_id', prereqIds);

        const completedIds = new Set(completedEnrollments?.map(e => e.enrollment_id) || []);
        const unmet = prerequisites.filter(p => p.prerequisite_course_id && !completedIds.has(p.prerequisite_course_id));

        if (unmet.length > 0) {
          const unmetNames = unmet.map(p => {
            const course = p.courses as unknown as { title: string } | null;
            return course?.title || 'Unknown course';
          });
          return NextResponse.json(
            {
              error: 'Prerequisites not met',
              unmet_prerequisites: unmetNames,
            },
            { status: 400 }
          );
        }
      }
    }

    // Calculate price in dollars (considering scholarships)
    let finalPriceDollars = content.is_free ? 0 : content.price;

    if (scholarship_id && finalPriceDollars > 0) {
      // Get scholarship details
      const { data: scholarship, error: scholarshipError } = await supabase
        .from('awarded_scholarships')
        .select('*, scholarships(discount_percentage)')
        .eq('id', scholarship_id)
        .eq('user_id', userId)
        .eq('used', false)
        .single();

      if (scholarship) {
        const discount = scholarship.scholarships.discount_percentage;
        const originalPrice = finalPriceDollars;
        finalPriceDollars = finalPriceDollars * (1 - discount / 100);
      } else {
        console.warn('Scholarship not found or already used');
      }
    }

    // Check and deduct credits if needed
    if (finalPriceDollars > 0) {
      // Convert dollar amount to credits using dynamic conversion rate from settings
      const finalPriceCredits = await dollarsToCreditsServer(finalPriceDollars);

      const { data: wallet } = await supabase
        .from('credit_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (!wallet || wallet.balance < finalPriceCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits', required: finalPriceCredits, available: wallet?.balance || 0 },
          { status: 400 }
        );
      }

      // Deduct credits using RPC function
      const { error: spendError } = await supabase.rpc('spend_credits', {
        p_user_id: userId,
        p_amount: finalPriceCredits,
        p_description: `Enrollment in ${content_type}: ${content.title}`,
        p_source_type: 'enrollment',
        p_source_id: content_id
      } as never);

      if (spendError) {
        console.error('Error spending credits:', spendError);
        return NextResponse.json(
          { error: 'Failed to process payment', details: spendError.message },
          { status: 500 }
        );
      }

    }

    // Create enrollment
    const enrollmentData: EnrollmentInsert = {
      user_id: userId,
      enrollment_type: content_type,
      enrollment_id: content_id,
      purchase_id: null,
    };

    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);

      // Rollback: refund credits if they were deducted
      if (finalPriceDollars > 0) {
        const refundCredits = await dollarsToCreditsServer(finalPriceDollars);
        const { error: refundError } = await supabase.rpc('award_credits', {
          p_user_id: userId,
          p_amount: refundCredits,
          p_description: `Refund: enrollment failed for ${content_type}: ${content.title}`,
          p_source_type: 'refund',
          p_source_id: content_id
        } as never);
        if (refundError) {
          console.error('CRITICAL: Failed to refund credits after enrollment failure:', refundError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to create enrollment', details: enrollError.message },
        { status: 500 }
      );
    }

    // Mark scholarship as used if one was applied
    if (scholarship_id) {
      const { error: scholarshipError } = await supabase
        .from('awarded_scholarships')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', scholarship_id)
        .eq('user_id', userId);

      if (scholarshipError) {
        console.error('Error marking scholarship as used:', scholarshipError);
        // Don't fail the enrollment, just log the error
      }
    }

    // Auto-enroll in child content (courses in program, modules in course)
    // Child enrollments are free — the user already paid for the parent
    if (content_type === 'program') {
      // Get all courses in this program
      const { data: programCourses } = await supabase
        .from('program_courses')
        .select('course_id')
        .eq('program_id', content_id)
        .order('sort_order', { ascending: true });

      if (programCourses && programCourses.length > 0) {
        const courseIds = programCourses.map(pc => pc.course_id).filter((id): id is string => id !== null);

        // Enroll in each course (ignore duplicates)
        for (const courseId of courseIds) {
          await supabase
            .from('enrollments')
            .upsert(
              { user_id: userId, enrollment_type: 'course', enrollment_id: courseId },
              { onConflict: 'user_id,enrollment_type,enrollment_id' }
            );

          // Also enroll in all modules of this course
          const { data: courseModules } = await supabase
            .from('course_modules')
            .select('module_id')
            .eq('course_id', courseId)
            .order('sort_order', { ascending: true });

          if (courseModules && courseModules.length > 0) {
            const moduleIds = courseModules.map(cm => cm.module_id).filter((id): id is string => id !== null);
            for (const moduleId of moduleIds) {
              await supabase
                .from('enrollments')
                .upsert(
                  { user_id: userId, enrollment_type: 'module', enrollment_id: moduleId },
                  { onConflict: 'user_id,enrollment_type,enrollment_id' }
                );
            }
          }
        }
      }
    } else if (content_type === 'course') {
      // Get all modules in this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', content_id)
        .order('sort_order', { ascending: true });

      if (courseModules && courseModules.length > 0) {
        const moduleIds = courseModules.map(cm => cm.module_id).filter((id): id is string => id !== null);
        for (const moduleId of moduleIds) {
          await supabase
            .from('enrollments')
            .upsert(
              { user_id: userId, enrollment_type: 'module', enrollment_id: moduleId },
              { onConflict: 'user_id,enrollment_type,enrollment_id' }
            );
        }
      }
    }

    // Calculate credits spent for response
    const creditsSpent = finalPriceDollars > 0 ? await dollarsToCreditsServer(finalPriceDollars) : 0;

    return NextResponse.json({ enrollment, credits_spent: creditsSpent }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/enroll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

