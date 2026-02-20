/**
 * GET /api/job-categories
 * Returns all job categories for vacancy create/edit dropdowns.
 * Uses server Supabase so categories load even if client RLS differs.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('job_categories')
      .select('id, name')
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching job categories:', error);
      return NextResponse.json(
        { error: 'Failed to load job categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data ?? [] });
  } catch (err) {
    console.error('Error in job-categories API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
