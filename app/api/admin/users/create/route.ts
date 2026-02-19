/**
 * API Route: Create User and Send Invitation
 * POST /api/admin/users/create
 * 
 * Creates a new user and sends invitation email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { generateTemporaryPassword } from '@/lib/utils/password';
import { sendEmail } from '@/lib/email/send';
import {
  platformAdminInvitationEmail,
  organizationAdminInvitationEmail,
  teamMemberInvitationEmail,
  personalUserInvitationEmail,
} from '@/lib/email/templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type AccountType = 'personal' | 'organization' | 'platformAdmin' | 'hybrid';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Get the current user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is authorized
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      account_type,
      user_role,
      organization_id,
      organization_name, // For email template
    } = body;
    
    // Validate required fields
    if (!email || !first_name || !last_name || !account_type || !user_role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate organization_id for organization/hybrid users
    if ((account_type === 'organization' || account_type === 'hybrid') && !organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required for organization/hybrid users' },
        { status: 400 }
      );
    }
    
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Create auth user with temporary password
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: false, // User must confirm via invitation link
      user_metadata: {
        account_type,
        user_role,
        organization_id: organization_id || null,
        current_context: account_type === 'hybrid' ? 'personal' : null,
        first_name,
        last_name,
      },
    });
    
    if (authCreateError || !authData.user) {
      console.error('Error creating auth user:', {
        message: authCreateError?.message,
        status: authCreateError?.status,
        name: authCreateError?.name,
      });
      return NextResponse.json(
        {
          error: 'Failed to create user',
          details: authCreateError?.message,
          status: authCreateError?.status,
        },
        { status: 500 }
      );
    }
    
    // Update public.users record (trigger already created it from auth.users)
    // We need to update it with additional fields including organization_id
    const updateData: any = {
      invitation_sent_at: new Date().toISOString(),
      invited_by: user.id,
      onboarding_completed: false,
    };

    // Add organization_id if provided (for hybrid/organization users)
    if (organization_id) {
      updateData.organization_id = organization_id;
    }

    const { error: userCreateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authData.user.id);
    
    if (userCreateError) {
      console.error('Error creating user record:', {
        message: userCreateError.message,
        details: userCreateError.details,
        hint: userCreateError.hint,
        code: userCreateError.code,
      });
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        {
          error: 'Failed to create user record',
          details: userCreateError.message,
          code: userCreateError.code,
        },
        { status: 500 }
      );
    }
    
    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'generate_invitation_token',
      {
        p_user_id: authData.user.id,
        p_temporary_password: temporaryPassword,
      } as never
    );
    
    if (tokenError || !tokenData) {
      console.error('Error generating invitation token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate invitation token' },
        { status: 500 }
      );
    }

    const token = (tokenData as any)[0]?.token || (tokenData as any).token;
    const activationLink = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/activate?token=${token}`;
    
    // Determine which email template to use
    let emailTemplate;
    const inviterName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim();
    
    if (account_type === 'platformAdmin') {
      emailTemplate = platformAdminInvitationEmail({
        recipientName: first_name,
        recipientEmail: email,
        temporaryPassword,
        activationLink,
        inviterName,
      });
    } else if (account_type === 'hybrid' && user_role === 'org_admin') {
      // Organization admin
      emailTemplate = organizationAdminInvitationEmail({
        recipientName: first_name,
        recipientEmail: email,
        temporaryPassword,
        activationLink,
        organizationName: organization_name || 'Your Organization',
      });
    } else if (account_type === 'hybrid' || account_type === 'organization') {
      // Team member
      emailTemplate = teamMemberInvitationEmail({
        recipientName: first_name,
        recipientEmail: email,
        temporaryPassword,
        activationLink,
        organizationName: organization_name || 'Your Organization',
        userRole: user_role,
        inviterName,
      });
    } else {
      // Personal user
      emailTemplate = personalUserInvitationEmail({
        recipientName: first_name,
        recipientEmail: email,
        temporaryPassword,
        activationLink,
      });
    }
    
    // Send invitation email
    const emailResult = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Return error to user so they know the email wasn't sent
      return NextResponse.json(
        {
          error: 'User created but failed to send invitation email',
          details: emailResult.error,
          user: {
            id: authData.user.id,
            email,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        account_type,
        user_role,
      },
      invitation_sent: true,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

