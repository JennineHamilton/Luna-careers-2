import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { passwordResetEmail } from '@/lib/email/templates';
import { withRateLimit } from '@/lib/middleware/with-rate-limit';
import { RateLimitPresets } from '@/lib/middleware/rate-limit';
import { validateBody } from '@/lib/validation/validate';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, handleSupabaseError } from '@/lib/utils/error-response';
import crypto from 'crypto';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends email via MailGun
 */
async function forgotPasswordHandler(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, forgotPasswordSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email } = validation.data;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    const user = authUser.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      // Don't reveal error details - return success message
      return createSuccessResponse({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send password reset email via MailGun
    const emailTemplate = passwordResetEmail({
      recipientEmail: email,
      resetLink,
    });

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return createSuccessResponse({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    return createErrorResponse(error, 'forgot-password');
  }
}

// Apply rate limiting: 5 password reset requests per 15 minutes per IP
export const POST = withRateLimit(forgotPasswordHandler, RateLimitPresets.AUTH);

