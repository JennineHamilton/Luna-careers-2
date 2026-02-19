/**
 * API Route: Public Signup
 * POST /api/auth/signup
 * 
 * Handles public user signup with custom email confirmation via MailGun
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { sendEmail } from '@/lib/email/send';
import { signupWelcomeEmail } from '@/lib/email/templates';
import { withRateLimit } from '@/lib/middleware/with-rate-limit';
import { RateLimitPresets } from '@/lib/middleware/rate-limit';
import { validateBody } from '@/lib/validation/validate';
import { signupSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, handleSupabaseError } from '@/lib/utils/error-response';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function signupHandler(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, signupSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email, password, firstName, lastName } = validation.data;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Create user with email confirmation disabled (we'll send our own)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll send our own confirmation email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        account_type: 'personal',
        user_role: 'candidate',
      },
    });
    
    if (authError || !authData.user) {
      return handleSupabaseError(authError, 'signup - create user');
    }

    // Generate email confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store confirmation token in database
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: authData.user.id,
        token: confirmationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      return handleSupabaseError(tokenError, 'signup - store confirmation token');
      // Continue anyway - user can request a new confirmation email
    }
    
    // Generate confirmation link
    const confirmationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm-email?token=${confirmationToken}`;
    
    // Send welcome email with confirmation link
    const emailTemplate = signupWelcomeEmail({
      firstName,
      recipientName: `${firstName} ${lastName}`,
      confirmationLink,
    });
    
    const emailResult = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
    
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the signup - user can request a new confirmation email
    }
    
    return createSuccessResponse({
      success: true,
      message: 'Account created successfully. Please check your email to confirm your account.',
    });
  } catch (error) {
    return createErrorResponse(error, 'signup');
  }
}

// Apply rate limiting: 5 signups per 15 minutes per IP
export const POST = withRateLimit(signupHandler, RateLimitPresets.AUTH);

