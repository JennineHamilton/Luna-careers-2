/**
 * API Route: User Skills
 * GET /api/user/skills - List all user's skills (both user-selected and verified)
 * POST /api/user/skills - Add new skill
 * DELETE /api/user/skills - Remove skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { userSkillAddSchema } from '@/lib/validation/schemas';

/**
 * GET - List all user's skills (both user-selected and verified)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user-selected skills
    const { data: userSkills, error: userSkillsError } = await supabase
      .from('user_skills')
      .select(`
        id,
        skill_id,
        created_at,
        skills (
          id,
          skill_name,
          category
        )
      `)
      .eq('user_id', user.id);

    // Fetch verified skills
    const { data: verifiedSkills, error: verifiedSkillsError } = await supabase
      .from('user_verified_skills')
      .select(`
        id,
        skill_id,
        source_type,
        source_id,
        verified_at,
        skills (
          id,
          skill_name,
          category
        )
      `)
      .eq('user_id', user.id);

    if (userSkillsError || verifiedSkillsError) {
      console.error('Error fetching skills:', userSkillsError || verifiedSkillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    return NextResponse.json({
      userSkills: userSkills || [],
      verifiedSkills: verifiedSkills || [],
    });
  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Add new skill
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateBody(request, userSkillAddSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { skill_id } = validation.data;

    // Check if skill already exists for user
    const { data: existing } = await supabase
      .from('user_skills')
      .select('id')
      .eq('user_id', user.id)
      .eq('skill_id', skill_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Skill already added' }, { status: 400 });
    }

    const { data: newSkill, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: user.id,
        skill_id,
      })
      .select(`
        id,
        skill_id,
        created_at,
        skills (
          id,
          skill_name,
          category
        )
      `)
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
    }

    return NextResponse.json({ skill: newSkill }, { status: 201 });
  } catch (error) {
    console.error('Skill creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Remove skill
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
      return NextResponse.json({ error: 'Missing skill ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting skill:', error);
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Skill deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

