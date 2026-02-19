/**
 * API Route: Set Password
 * POST /api/onboarding/set-password
 * 
 * Sets the user's permanent password and completes onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { validatePasswordStrength } from '@/lib/utils/password';
import { sendEmail } from '@/lib/email/send';
import { onboardingCompleteEmail } from '@/lib/email/templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { email, password, token } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }
    
    // Get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error getting users:', getUserError);
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      );
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user password and confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password,
        email_confirm: true, // Confirm email so user can sign in
        ban_duration: 'none', // Ensure user is not banned
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('Password updated successfully for user:', user.id);
    
    // Mark invitation token as used (if token provided)
    if (token) {
      const { error: tokenError } = await supabase.rpc(
        'mark_invitation_token_used',
        { p_token: token } as never
      );

      if (tokenError) {
        console.error('Error marking token as used:', tokenError);
        // Don't fail the request, password is already set
      }
    }

    // Mark onboarding as complete
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        invitation_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('Error updating user record:', updateUserError);
      // Don't fail the request, password is already set
    }

    // Get fresh user data from database (after trigger has synced metadata)
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('account_type, user_role, organization_id, current_context')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
    }

    // Update auth user metadata to ensure JWT has latest data
    // This is important because the user will be logged in next
    if (userData) {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            account_type: userData.account_type,
            user_role: userData.user_role,
            organization_id: userData.organization_id,
            current_context: userData.current_context,
            first_name: user.user_metadata?.first_name,
            last_name: user.user_metadata?.last_name,
          },
        }
      );

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
      }
    }

    // Determine redirect based on account type
    const accountType = userData?.account_type || user.user_metadata?.account_type || 'personal';
    const currentContext = userData?.current_context || user.user_metadata?.current_context;

    let redirectTo = '/u/dashboard';

    switch (accountType) {
      case 'platformAdmin':
        redirectTo = '/cmd/dashboard';
        break;
      case 'organization':
        redirectTo = '/org/dashboard';
        break;
      case 'hybrid':
        redirectTo = currentContext === 'organization' ? '/org/dashboard' : '/u/dashboard';
        break;
      default:
        redirectTo = '/u/dashboard';
    }

    // If redirecting to organization portal, resolve the slug
    if (redirectTo === '/org/dashboard' && userData?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', userData.organization_id)
        .single();

      if (org?.slug) {
        redirectTo = `/org/${org.slug}/dashboard`;
      }
    }

    // Send onboarding complete email
    try {
      const firstName = user.user_metadata?.first_name || email.split('@')[0];
      const fullName = user.user_metadata?.first_name && user.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : firstName;

      const complimentaryCredits = 100; // Default welcome bonus
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}`;

      const emailTemplate = onboardingCompleteEmail({
        recipientName: fullName,
        recipientEmail: email,
        complimentaryCredits,
        dashboardLink: dashboardUrl,
        accountType,
      });

      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log('Onboarding complete email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send onboarding complete email:', emailError);
      // Don't fail the request if email fails
    }

    // Create welcome in-app notification
    try {
      const firstName = user.user_metadata?.first_name || email.split('@')[0];
      const isPersonalUser = accountType === 'personal' || accountType === 'hybrid';

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'welcome',
          title: `Welcome to Luna Careers, ${firstName}! 🎉`,
          message: isPersonalUser
            ? `Your account is active! You've received 100 complimentary credits to get started with courses. Click "View Credits" below to see your welcome bonus in your transaction history.`
            : `Your account is active and ready to use. Explore the platform to get started.`,
          action_url: null, // No direct navigation - will expand inline
          action_label: isPersonalUser ? 'View Credits' : null,
          metadata: {
            complimentary_credits: isPersonalUser ? 100 : 0,
            account_type: accountType,
          },
        });

      if (notificationError) {
        console.error('Failed to create welcome notification:', notificationError);
      } else {
        console.log('Welcome notification created for user:', user.id);
      }
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      redirect_to: redirectTo,
      email: email,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

