import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/lib/middleware/with-rate-limit';
import { RateLimitPresets } from '@/lib/middleware/rate-limit';
import { validateBody } from '@/lib/validation/validate';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, createValidationError, handleSupabaseError } from '@/lib/utils/error-response';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/auth/reset-password
 * Validate token and update password
 */
async function resetPasswordHandler(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, resetPasswordSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { token, newPassword } = validation.data;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return createValidationError('Invalid or expired reset token');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return createValidationError('Reset token has expired');
    }

    // Get user's email to check if new password matches current password
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(
      tokenData.user_id
    );

    if (getUserError || !userData?.user?.email) {
      return createValidationError('Unable to verify user account');
    }

    // Check if new password is the same as the current password
    const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: userData.user.email,
      password: newPassword,
    });

    if (!signInError) {
      // Sign-in succeeded → new password matches the current one
      return createValidationError('New password must be different from your current password');
    }

    // Update user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      return handleSupabaseError(updateError, 'reset-password - update password');
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return createSuccessResponse({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return createErrorResponse(error, 'reset-password');
  }
}

// Apply rate limiting: 5 password reset attempts per 15 minutes per IP
export const POST = withRateLimit(resetPasswordHandler, RateLimitPresets.AUTH);

