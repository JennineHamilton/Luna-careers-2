/**
 * API Route: Review Scholarship Application
 * PATCH /api/learning/scholarships/applications/[id]/review - Approve or reject application
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '@/app/api/learning/_helpers/auth';
import { sendEmail } from '@/lib/email/send';
import {
  scholarshipApprovedFullEmail,
  scholarshipApprovedPartialEmail,
  scholarshipRejectedEmail
} from '@/lib/email/templates';
import type { Database } from '@/types/database.types';

type ScholarshipApplicationUpdate = Database['public']['Tables']['scholarship_applications']['Update'];
type AwardedScholarshipInsert = Database['public']['Tables']['awarded_scholarships']['Insert'];

/**
 * PATCH /api/learning/scholarships/applications/[id]/review
 * Approve or reject a scholarship application (platform admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;
    const userId = authResult.user!.id;
    
    // Parse request body
    const body = await request.json();
    const { status, review_notes, expires_at } = body;

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the application
    const { data: application, error: appError } = await supabase
      .from('scholarship_applications')
      .select(`
        *,
        scholarships (
          id,
          name,
          type,
          discount_percentage,
          slots_remaining
        )
      `)
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 400 }
      );
    }

    // Update application status
    const updateData: ScholarshipApplicationUpdate = {
      status,
      review_notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    };

    const { data: updatedApp, error: updateError } = await supabase
      .from('scholarship_applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        scholarships (
          id,
          name,
          type,
          discount_percentage
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application', details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch user data separately since user_id references auth.users, not public.users
    const { data: userData } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', updatedApp.user_id)
      .single();

    const updatedApplication = {
      ...updatedApp,
      users: userData || null,
    };

    // Get content details for notifications
    const contentType = application.content_type;
    const contentId = application.content_id;
    const tableName = contentType === 'module' ? 'modules' :
                     contentType === 'course' ? 'courses' : 'programs';

    const { data: contentData, error: contentError } = await supabase
      .from(tableName)
      .select('title, price')
      .eq('id', contentId)
      .single();

    if (contentError) {
      console.error('Error fetching content data:', contentError);
    }

    const contentTitle = contentData?.title || 'Learning Content';
    const contentPrice = contentData?.price || 0;

    // If approved, create awarded scholarship
    let awardedScholarship = null;
    if (status === 'approved') {
      const scholarship = application.scholarships as any;
      const discountPercentage = scholarship?.discount_percentage || 100;
      const discountedPrice = contentPrice * (1 - discountPercentage / 100);

      const awardedData: AwardedScholarshipInsert = {
        application_id: application.id,
        user_id: application.user_id,
        scholarship_id: application.scholarship_id,
        content_type: application.content_type,
        content_id: application.content_id,
        discount_percentage: discountPercentage,
        original_price: contentPrice,
        discounted_price: discountedPrice,
        expires_at: expires_at || null,
      };

      const { data: awarded, error: awardError } = await supabase
        .from('awarded_scholarships')
        .insert(awardedData)
        .select()
        .single();

      if (awardError) {
        console.error('Error creating awarded scholarship:', awardError);
        // Don't fail the whole request, just log the error
      } else {
        awardedScholarship = awarded;

        // Decrement slots_remaining if applicable
        if (scholarship?.slots_remaining !== null && scholarship?.slots_remaining > 0) {
          await supabase
            .from('scholarships')
            .update({ slots_remaining: scholarship.slots_remaining - 1 })
            .eq('id', application.scholarship_id);
        }

        // Auto-enroll for full scholarships (100% discount)
        if (discountPercentage === 100) {
          try {
            // Check if already enrolled
            const { data: existingEnrollment } = await supabase
              .from('enrollments')
              .select('id')
              .eq('user_id', application.user_id)
              .eq('enrollment_type', contentType)
              .eq('enrollment_id', contentId)
              .single();

            if (!existingEnrollment) {
              // Create enrollment
              await supabase
                .from('enrollments')
                .insert({
                  user_id: application.user_id,
                  enrollment_type: contentType,
                  enrollment_id: contentId,
                  status: 'active',
                });

              // Mark scholarship as used
              await supabase
                .from('awarded_scholarships')
                .update({ used: true })
                .eq('id', awarded.id);
            }
          } catch (enrollError) {
            console.error('Error auto-enrolling user:', enrollError);
          }
        }

        // Send approval notification
        const userName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'there';
        const userEmail = userData?.email || '';
        const scholarshipName = scholarship?.name || 'Scholarship';

        // Determine enrollment link based on content type
        // URL structure: /u/learning/[moduleId] for modules, /u/learning/courses/[courseId] for courses, etc.
        let enrollmentLink = '';
        if (contentType === 'module') {
          enrollmentLink = discountPercentage === 100
            ? `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/${contentId}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/${contentId}?enroll=true&scholarship=${awarded.id}`;
        } else if (contentType === 'course') {
          enrollmentLink = discountPercentage === 100
            ? `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/courses/${contentId}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/courses/${contentId}?enroll=true&scholarship=${awarded.id}`;
        } else if (contentType === 'program') {
          enrollmentLink = discountPercentage === 100
            ? `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/programs/${contentId}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/u/learning/programs/${contentId}?enroll=true&scholarship=${awarded.id}`;
        }

        // Send email
        if (userEmail) {
          const emailTemplate = discountPercentage === 100
            ? scholarshipApprovedFullEmail({
                recipientName: userName,
                scholarshipName,
                contentTitle,
                contentType,
                discountPercentage,
                originalPrice: contentPrice,
                discountedPrice,
                enrollmentLink,
                expiresAt: expires_at,
              })
            : scholarshipApprovedPartialEmail({
                recipientName: userName,
                scholarshipName,
                contentTitle,
                contentType,
                discountPercentage,
                originalPrice: contentPrice,
                discountedPrice,
                enrollmentLink,
                expiresAt: expires_at,
              });

          await sendEmail({
            to: userEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }

        // Create in-app notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: application.user_id,
            type: 'scholarship_approved',
            title: `🎉 Scholarship Approved!`,
            message: discountPercentage === 100
              ? `Your ${scholarshipName} application has been approved! You've been automatically enrolled in ${contentTitle}.`
              : `Your ${scholarshipName} application has been approved! Complete your enrollment to get ${discountPercentage}% off.`,
            action_url: enrollmentLink,
            action_label: discountPercentage === 100 ? 'Start Learning' : 'Complete Enrollment',
            metadata: {
              scholarship_id: application.scholarship_id,
              scholarship_name: scholarshipName,
              content_type: contentType,
              content_id: contentId,
              content_title: contentTitle,
              discount_percentage: discountPercentage,
              original_price: contentPrice,
              discounted_price: discountedPrice,
            },
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        } else {

        }
      }
    } else if (status === 'rejected') {
      // Send rejection notification
      const userName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'there';
      const userEmail = userData?.email || '';
      const scholarship = application.scholarships as any;
      const scholarshipName = scholarship?.name || 'Scholarship';

      // Send email
      if (userEmail) {
        const emailTemplate = scholarshipRejectedEmail({
          recipientName: userName,
          scholarshipName,
          contentTitle,
          contentType,
          reviewNotes: review_notes,
        });

        await sendEmail({
          to: userEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }

      // Create in-app notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'scholarship_rejected',
          title: 'Scholarship Application Update',
          message: `Your ${scholarshipName} application for ${contentTitle} was not approved at this time.`,
          action_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/scholarships`,
          action_label: 'View Other Scholarships',
          metadata: {
            scholarship_id: application.scholarship_id,
            scholarship_name: scholarshipName,
            content_type: contentType,
            content_id: contentId,
            content_title: contentTitle,
            review_notes: review_notes || '',
          },
        });

      if (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      } else {

      }
    }

    return NextResponse.json({
      application: updatedApplication,
      awarded_scholarship: awardedScholarship,
      message: `Application ${status} successfully`,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/scholarships/applications/[id]/review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

