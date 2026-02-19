/**
 * GET /auth/confirm-email
 * Handles email confirmation for public signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=Invalid confirmation link', origin)
    );
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.redirect(
        new URL('/login?error=Invalid or expired confirmation link', origin)
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(
        new URL('/login?error=Confirmation link has expired', origin)
      );
    }

    // Check if token was already used
    if (tokenData.used_at) {
      return NextResponse.redirect(
        new URL('/login?message=Email already confirmed. Please log in.', origin)
      );
    }

    // Confirm user's email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      {
        email_confirm: true,
      }
    );

    if (confirmError) {
      console.error('Error confirming email:', confirmError);
      return NextResponse.redirect(
        new URL('/login?error=Failed to confirm email', origin)
      );
    }

    // Mark token as used
    await supabase
      .from('email_confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?message=Email confirmed successfully! Please log in to continue.', origin)
    );
  } catch (error) {
    console.error('Email confirmation error:', error);
    return NextResponse.redirect(
      new URL('/login?error=An error occurred during confirmation', origin)
    );
  }
}

