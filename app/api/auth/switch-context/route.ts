import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserContext } from '@/types/auth.types';

interface SwitchContextRequest {
  context: UserContext;
}

/**
 * POST /api/auth/switch-context
 * Switches the current context for hybrid users between 'personal' and 'organization'
 */
export async function POST(request: NextRequest) {
  try {
    const body: SwitchContextRequest = await request.json();
    const { context } = body;

    // Validate context value
    if (!context || !['personal', 'organization'].includes(context)) {
      return NextResponse.json(
        { error: 'Invalid context. Must be "personal" or "organization"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a hybrid user
    const accountType = user.user_metadata?.account_type;
    if (accountType !== 'hybrid') {
      return NextResponse.json(
        { error: 'Only hybrid users can switch context' },
        { status: 403 }
      );
    }

    // Update user metadata with new context
    const { error: updateError } = await supabase.auth.updateUser({
      data: { current_context: context },
    });

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update context' },
        { status: 500 }
      );
    }

    // Update the users table using admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('users')
      .update({ current_context: context })
      .eq('id', user.id);

    if (dbError) {
      // Log error but don't fail - metadata is the source of truth
      console.error('Failed to update users table:', dbError);
    }

    // Get redirect URL based on new context
    let redirectUrl = '/u/dashboard';

    if (context === 'organization') {
      // Get organization slug for multi-tenant routing
      const organizationId = user.user_metadata?.organization_id;

      if (organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', organizationId)
          .single();

        if (org?.slug) {
          redirectUrl = `/org/${org.slug}/dashboard`;
        } else {
          // Fallback if slug not found
          redirectUrl = '/org/dashboard';
        }
      }
    }

    return NextResponse.json({
      success: true,
      context,
      redirectUrl,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

