/**
 * API Route: My Enrollments
 * GET /api/learning/my-enrollments - Get current user's enrollments with payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/learning/my-enrollments
 * Get current user's enrollments with payment status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch user's enrollments with related data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrollment_type,
        enrollment_id,
        purchase_id,
        enrolled_at,
        expires_at,
        status,
        completion_credits_awarded,
        credits_awarded_at
      `)
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false });
    
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }
    
    // Batch fetch content details by type to avoid N+1 queries
    const allEnrollments = enrollments || [];

    const moduleIds = allEnrollments.filter(e => e.enrollment_type === 'module').map(e => e.enrollment_id);
    const courseIds = allEnrollments.filter(e => e.enrollment_type === 'course').map(e => e.enrollment_id);
    const programIds = allEnrollments.filter(e => e.enrollment_type === 'program').map(e => e.enrollment_id);
    const purchaseIds = allEnrollments.map(e => e.purchase_id).filter(Boolean) as string[];

    // Fetch all content and purchases in parallel batches
    const [modulesResult, coursesResult, programsResult, purchasesResult] = await Promise.all([
      moduleIds.length > 0
        ? supabase.from('modules').select('id, title, description, price, is_free').in('id', moduleIds)
        : Promise.resolve({ data: [] }),
      courseIds.length > 0
        ? supabase.from('courses').select('id, title, description, price, is_free').in('id', courseIds)
        : Promise.resolve({ data: [] }),
      programIds.length > 0
        ? supabase.from('programs').select('id, title, description, price, is_free').in('id', programIds)
        : Promise.resolve({ data: [] }),
      purchaseIds.length > 0
        ? supabase.from('purchases').select('id, payment_method, payment_status, amount_credits, amount_cash, purchased_at').in('id', purchaseIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Build lookup maps for O(1) access
    const contentMap = new Map<string, any>();
    for (const m of modulesResult.data || []) contentMap.set(m.id, m);
    for (const c of coursesResult.data || []) contentMap.set(c.id, c);
    for (const p of programsResult.data || []) contentMap.set(p.id, p);

    const purchaseMap = new Map<string, any>();
    for (const p of purchasesResult.data || []) purchaseMap.set(p.id, p);

    // Batch fetch bank transfer submissions for relevant purchases
    const bankTransferPurchaseIds = (purchasesResult.data || [])
      .filter(p => p.payment_method === 'bank_transfer' || p.payment_method === 'hybrid')
      .map(p => p.id);

    let submissionMap = new Map<string, any>();
    if (bankTransferPurchaseIds.length > 0) {
      const { data: submissions } = await supabase
        .from('bank_transfer_submissions')
        .select('id, status, submitted_at, reviewed_at, admin_notes, purchase_id')
        .in('purchase_id', bankTransferPurchaseIds);
      for (const s of submissions || []) {
        if (s.purchase_id) submissionMap.set(s.purchase_id, s);
      }
    }

    // Assemble results without any additional queries
    const enrollmentsWithDetails = allEnrollments.map((enrollment) => {
      const contentDetails = contentMap.get(enrollment.enrollment_id) || null;
      const purchaseDetails = enrollment.purchase_id ? purchaseMap.get(enrollment.purchase_id) || null : null;
      const paymentSubmission = purchaseDetails ? submissionMap.get(purchaseDetails.id) || null : null;

      return {
        ...enrollment,
        content: contentDetails,
        purchase: purchaseDetails,
        payment_submission: paymentSubmission,
      };
    });
    
    return NextResponse.json({
      enrollments: enrollmentsWithDetails,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/my-enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

