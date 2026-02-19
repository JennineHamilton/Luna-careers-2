/**
 * API Route: Validate Invitation Token
 * POST /api/onboarding/validate-token
 * 
 * Validates the invitation token and temporary password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// RPC parameter type for validate_invitation_token
type RpcValidateTokenParams = {
  p_token: string;
  p_temporary_password: string;
};

// RPC return type for validate_invitation_token
interface ValidateTokenResult {
  valid: boolean;
  user_id?: string;
  email?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { token, email, temporary_password } = body;
    
    if (!token || !email || !temporary_password) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate the token using the database function
    const { data, error } = await supabase
      .rpc('validate_invitation_token', {
        p_token: token,
        p_temporary_password: temporary_password,
      } as any);

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { valid: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // RPC returns an array with one row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.valid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token or temporary password' },
        { status: 400 }
      );
    }

    // Verify email matches
    if (result.email !== email) {
      return NextResponse.json(
        { valid: false, error: 'Email does not match' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      user_id: result.user_id,
      email: result.email,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

