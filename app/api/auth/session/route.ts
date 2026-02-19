/**
 * GET /api/auth/session
 * Returns the current user from server-side cookies.
 * Use this when the client cannot read HttpOnly cookies (e.g. in production).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata,
      },
    });
  } catch (err) {
    console.error('[api/auth/session] Error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
