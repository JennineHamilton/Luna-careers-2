/**
 * API Route: Progress Management
 * GET /api/learning/progress - Get user's progress (own progress or admin can see all)
 * PATCH /api/learning/progress - Update progress (mark lesson/module/course complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '../_helpers/auth';
import { validateBody } from '@/lib/validation/validate';
import { progressUpdateSchema } from '@/lib/validation/schemas';

/**
 * GET /api/learning/progress
 * Get user's learning progress
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const content_type = searchParams.get('content_type');
    const content_id = searchParams.get('content_id');
    const user_id = searchParams.get('user_id');
    
    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', authResult.user!.id)
      .single();
    
    const isAdmin = userData?.account_type === 'platformAdmin';
    const targetUserId = isAdmin && user_id ? user_id : authResult.user!.id;
    
    // Get progress based on content type
    if (content_type === 'lesson') {
      const query = supabase
        .from('lesson_progress')
        .select('*, lessons(id, title)')
        .eq('user_id', targetUserId);
      
      if (content_id) {
        query.eq('lesson_id', content_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch progress', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ progress: data }, { status: 200 });
    }
    
    if (content_type === 'module') {
      const query = supabase
        .from('module_progress')
        .select('*, modules(id, title)')
        .eq('user_id', targetUserId);
      
      if (content_id) {
        query.eq('module_id', content_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch progress', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ progress: data }, { status: 200 });
    }
    
    if (content_type === 'course') {
      const query = supabase
        .from('course_progress')
        .select('*, courses(id, title)')
        .eq('user_id', targetUserId);
      
      if (content_id) {
        query.eq('course_id', content_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch progress', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ progress: data }, { status: 200 });
    }
    
    if (content_type === 'program') {
      const query = supabase
        .from('program_progress')
        .select('*, programs(id, title)')
        .eq('user_id', targetUserId);
      
      if (content_id) {
        query.eq('program_id', content_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch progress', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ progress: data }, { status: 200 });
    }
    
    // If no content_type specified, return all progress
    const [lessonProgress, moduleProgress, courseProgress, programProgress] = await Promise.all([
      supabase.from('lesson_progress').select('*, lessons(id, title)').eq('user_id', targetUserId),
      supabase.from('module_progress').select('*, modules(id, title)').eq('user_id', targetUserId),
      supabase.from('course_progress').select('*, courses(id, title)').eq('user_id', targetUserId),
      supabase.from('program_progress').select('*, programs(id, title)').eq('user_id', targetUserId),
    ]);
    
    return NextResponse.json({
      progress: {
        lessons: lessonProgress.data || [],
        modules: moduleProgress.data || [],
        courses: courseProgress.data || [],
        programs: programProgress.data || [],
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in GET /api/learning/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/progress
 * Update progress (mark lesson/module/course complete)
 */
export async function POST(request: NextRequest) {
  return handleProgressUpdate(request);
}

/**
 * PATCH /api/learning/progress
 * Update progress (mark lesson/module/course complete)
 */
export async function PATCH(request: NextRequest) {
  return handleProgressUpdate(request);
}

async function handleProgressUpdate(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const userId = authResult.user!.id;

    // Validate request body
    const validation = await validateBody(request, progressUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      content_type,
      content_id,
      lesson_id,
      module_id,
      completed,
      score,
      score_min,
      score_max,
      passing_score,
      success_status,
      scorm_cmi_data,
      progress_percentage,
      time_spent_seconds
    } = validation.data;

    // Support both old format (content_type/content_id) and new format (lesson_id/module_id)
    const lessonId = lesson_id || (content_type === 'lesson' ? content_id : null);
    const moduleIdValue = module_id;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required field: lesson_id' },
        { status: 400 }
      );
    }

    // Determine status based on success_status or completed flag
    let lessonStatus = 'in_progress';
    if (completed) {
      if (success_status === 'passed') {
        lessonStatus = 'passed';
      } else if (success_status === 'failed') {
        lessonStatus = 'failed';
      } else {
        lessonStatus = 'completed';
      }
    }

    // Update lesson progress
    const progressData: any = {
      user_id: userId,
      lesson_id: lessonId,
      status: lessonStatus,
      completion_percentage: progress_percentage || (completed ? 100 : 0),
      time_spent_minutes: time_spent_seconds ? Math.round(time_spent_seconds / 60) : 0,
      score_raw: score || null,
      score_min: score_min || null,
      score_max: score_max || null,
      passing_score: passing_score || null,
      scorm_cmi_data: scorm_cmi_data || null,
      last_accessed: new Date().toISOString(),
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    // Set passed_at if status is 'passed'
    if (lessonStatus === 'passed') {
      progressData.passed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(progressData, {
        onConflict: 'user_id,lesson_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[Progress API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update progress', details: error.message },
        { status: 500 }
      );
    }

    // Update module progress if module_id provided
    if (moduleIdValue) {
      await updateModuleProgress(supabase, userId, moduleIdValue);
    }

    return NextResponse.json({ progress: data }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in progress update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update module progress based on completed lessons
 */
async function updateModuleProgress(supabase: any, userId: string, moduleId: string) {
  try {
    // Get all lessons in the module
    const { data: moduleLessons } = await supabase
      .from('module_lessons')
      .select('lesson_id, is_required')
      .eq('module_id', moduleId);

    if (!moduleLessons || moduleLessons.length === 0) {
      return;
    }

    const lessonIds = moduleLessons.map((ml: any) => ml.lesson_id);

    // Get user's progress for these lessons
    const { data: lessonsProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    const completedLessons = lessonsProgress?.filter((lp: any) => lp.status === 'completed' || lp.status === 'passed') || [];
    const totalLessons = moduleLessons.length;
    const completedCount = completedLessons.length;
    const completionPercentage = Math.round((completedCount / totalLessons) * 100);
    const isModuleCompleted = completionPercentage === 100;

    // Upsert module progress
    await supabase
      .from('module_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        status: isModuleCompleted ? 'completed' : (completionPercentage > 0 ? 'in_progress' : 'not_started'),
        completion_percentage: completionPercentage,
        started_at: completionPercentage > 0 ? new Date().toISOString() : null,
        completed_at: isModuleCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,module_id',
      });

    // Award completion credits if module just completed
    if (isModuleCompleted) {
      await awardCompletionCredits(supabase, userId, moduleId);
    }

  } catch (error) {
    console.error('Error updating module progress:', error);
  }
}

/**
 * Award completion credits when module is completed
 */
async function awardCompletionCredits(supabase: any, userId: string, moduleId: string) {
  try {
    // Get module details
    const { data: module } = await supabase
      .from('modules')
      .select('title, completion_credits')
      .eq('id', moduleId)
      .single();

    if (!module || !module.completion_credits || module.completion_credits <= 0) {
      return;
    }

    // Check if credits already awarded
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('completion_credits_awarded')
      .eq('user_id', userId)
      .eq('enrollment_type', 'module')
      .eq('enrollment_id', moduleId)
      .single();

    if (enrollment?.completion_credits_awarded) {
      return; // Already awarded
    }

    // Award credits using RPC function
    const { error: earnError } = await supabase.rpc('earn_credits', {
      p_user_id: userId,
      p_amount: module.completion_credits,
      p_description: `Completed module: ${module.title}`,
      p_reference_type: 'module_completion',
      p_reference_id: moduleId
    } as any);

    if (earnError) {
      console.error('Error awarding credits:', earnError);
      return;
    }

    // Update enrollment to mark credits as awarded
    await supabase
      .from('enrollments')
      .update({
        completion_credits_awarded: module.completion_credits,
        credits_awarded_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('enrollment_type', 'module')
      .eq('enrollment_id', moduleId);

  } catch (error) {
    console.error('Error awarding completion credits:', error);
  }
}

