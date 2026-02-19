/**
 * API Route: User Languages
 * GET /api/user/languages - List all user's languages
 * POST /api/user/languages - Add new language
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { languageCreateSchema } from '@/lib/validation/schemas';

/**
 * GET - List all user's languages
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: languages, error } = await supabase
      .from('user_languages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching languages:', error);
      return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
    }

    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Languages fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Add new language
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateBody(request, languageCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { language_name, proficiency_level } = validation.data;

    const { data: newLanguage, error } = await supabase
      .from('user_languages')
      .insert({
        user_id: user.id,
        language_name,
        proficiency_level,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding language:', error);
      return NextResponse.json({ error: 'Failed to add language' }, { status: 500 });
    }

    return NextResponse.json({ language: newLanguage }, { status: 201 });
  } catch (error) {
    console.error('Language creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete language
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing language ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_languages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting language:', error);
      return NextResponse.json({ error: 'Failed to delete language' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Language deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

