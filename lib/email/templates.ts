/**
 * Email templates for user invitations
 * Luna Careers brand: Navy #00185F, Blue #1449E8, Yellow #FFDF2B
 */

interface InvitationEmailParams {
  recipientName: string;
  recipientEmail: string;
  temporaryPassword: string;
  activationLink: string;
  inviterName?: string;
  organizationName?: string;
  userRole?: string;
}

interface PasswordResetEmailParams {
  recipientEmail: string;
  resetLink: string;
}

/* ── Shared email shell ── */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lunacareers.com';
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif";

function emailShell(bodyContent: string): string {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luna Careers</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #00185F; padding: 40px 40px 36px 40px; text-align: center;">
              <img src="${APP_URL}/img/Luna_logo_light.png" alt="Luna Careers" width="160" style="display: block; margin: 0 auto; width: 160px; height: auto; border: 0;" />
              <p style="margin: 20px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.8); font-style: italic; letter-spacing: 0.01em;">Empowering your career journey</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 32px 40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #00185F; padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5;">&copy; ${currentYear} Black Amber Holdings. All rights reserved.</p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.5;">Luna Careers &mdash; Empowering your career journey</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <a href="${href}" style="display: inline-block; background-color: #1449E8; color: #ffffff; padding: 14px 48px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; text-align: center;">${label}</a>
    </td>
  </tr>
</table>`;
}

function fallbackLink(href: string): string {
  return `<p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-align: center;">Or copy and paste this link into your browser:</p>
<p style="margin: 0 0 24px 0; font-size: 12px; color: #1449E8; word-break: break-all; text-align: center; background: #f9fafb; padding: 12px 16px; border-radius: 6px;">${href}</p>`;
}

function credentialsBox(temporaryPassword: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 2px solid #00185F; border-radius: 8px; overflow: hidden;">
  <tr>
    <td style="background-color: #f9fafb; padding: 20px 24px;">
      <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #00185F;">Your Temporary Credentials</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Temporary Password:</strong></p>
      <p style="margin: 0 0 12px 0; font-size: 18px; font-family: 'Courier New', Courier, monospace; background: #ffffff; padding: 10px 16px; border-radius: 4px; border: 1px solid #e5e7eb; color: #1f2937; letter-spacing: 0.05em;">${temporaryPassword}</p>
      <p style="margin: 0; font-size: 13px; color: #dc2626;">This password will expire in 7 days</p>
    </td>
  </tr>
</table>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;"><tr><td style="border-top: 1px solid #e5e7eb;"></td></tr></table>`;
}

/**
 * Platform Admin Team Member Invitation
 */
export function platformAdminInvitationEmail(params: InvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, temporaryPassword, activationLink, inviterName } = params;

  return {
    subject: 'You\'ve been invited to join the Luna Careers Platform Team',
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        ${inviterName || 'A platform administrator'} has invited you to join the Luna Careers platform team.
      </p>
      ${credentialsBox(temporaryPassword)}
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Click below to activate your account:</p>
      ${ctaButton(activationLink, 'Activate Account')}
      ${fallbackLink(activationLink)}
      ${divider()}
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">Next Steps:</p>
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
        1. Click the activation link above<br>
        2. Enter your email and temporary password<br>
        3. Create your permanent password<br>
        4. Start managing the Luna platform
      </p>
      <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af;">If you didn't expect this invitation, please ignore this email.</p>
    `),
    text: `Welcome to Luna Careers Platform Team!

Hi ${recipientName},

${inviterName || 'A platform administrator'} has invited you to join the Luna Careers platform team.

Your Temporary Credentials:
Temporary Password: ${temporaryPassword}
This password will expire in 7 days

Activation Link: ${activationLink}

Next Steps:
1. Click the activation link above
2. Enter your email and temporary password
3. Create your permanent password
4. Start managing the Luna platform

If you didn't expect this invitation, please ignore this email.
    `,
  };
}

/**
 * Organization Admin Invitation
 */
export function organizationAdminInvitationEmail(params: InvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, temporaryPassword, activationLink, organizationName } = params;

  return {
    subject: `Welcome to Luna Careers – ${organizationName}`,
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Your organization <strong>${organizationName}</strong> has been set up on Luna Careers, and you've been designated as the administrator.
      </p>
      ${credentialsBox(temporaryPassword)}
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Click below to activate your account:</p>
      ${ctaButton(activationLink, 'Activate Account')}
      ${fallbackLink(activationLink)}
      ${divider()}
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">As an Organization Admin, you can:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Invite team members to join your organization</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Post job openings</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Manage applications</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Access candidate profiles</td></tr>
      </table>
    `),
    text: `Welcome to Luna Careers!

Hi ${recipientName},

Your organization ${organizationName} has been set up on Luna Careers, and you've been designated as the administrator.

Your Temporary Credentials:
Temporary Password: ${temporaryPassword}
This password will expire in 7 days

Activation Link: ${activationLink}

As an Organization Admin, you can:
- Invite team members to join your organization
- Post job openings
- Manage applications
- Access candidate profiles
    `,
  };
}

/**
 * Organization Team Member Invitation
 */
export function teamMemberInvitationEmail(params: InvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, temporaryPassword, activationLink, organizationName, userRole, inviterName } = params;

  return {
    subject: `You've been invited to join ${organizationName} on Luna Careers`,
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        ${inviterName || 'Your organization administrator'} has invited you to join <strong>${organizationName}</strong> on Luna Careers as a <strong>${userRole || 'team member'}</strong>.
      </p>
      ${credentialsBox(temporaryPassword)}
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Click below to activate your account:</p>
      ${ctaButton(activationLink, 'Activate Account')}
      ${fallbackLink(activationLink)}
      ${divider()}
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">Next Steps:</p>
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
        1. Click the activation link above<br>
        2. Enter your email and temporary password<br>
        3. Create your permanent password<br>
        4. Start collaborating with your team
      </p>
      <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af;">If you didn't expect this invitation, please contact your organization administrator.</p>
    `),
    text: `Welcome to ${organizationName}!

Hi ${recipientName},

${inviterName || 'Your organization administrator'} has invited you to join ${organizationName} on Luna Careers as a ${userRole || 'team member'}.

Your Temporary Credentials:
Temporary Password: ${temporaryPassword}
This password will expire in 7 days

Activation Link: ${activationLink}

Next Steps:
1. Click the activation link above
2. Enter your email and temporary password
3. Create your permanent password
4. Start collaborating with your team

If you didn't expect this invitation, please contact your organization administrator.
    `,
  };
}

/**
 * Public Signup Welcome Email (with email confirmation)
 */
export function signupWelcomeEmail(params: {
  firstName: string;
  recipientName: string;
  confirmationLink: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { firstName, recipientName, confirmationLink } = params;
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lunacareers.com';

  return {
    subject: 'Welcome to Luna Careers – Confirm Your Email',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Luna Careers</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <!-- Outer wrapper -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Inner container -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

                  <!-- Header: solid navy -->
                  <tr>
                    <td style="background-color: #00185F; padding: 40px 40px 36px 40px; text-align: center;">
                      <img src="${appUrl}/img/Luna_logo_light.png" alt="Luna Careers" width="160" style="display: block; margin: 0 auto; width: 160px; height: auto; border: 0;" />
                      <p style="margin: 20px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.8); font-style: italic; letter-spacing: 0.01em;">Empowering your career journey</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 40px 40px 32px 40px;">
                      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${firstName},</h1>
                      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                        Thank you for creating your Luna Careers account. We're looking forward to helping you connect with top employers, develop in-demand skills, and unlock your full career potential.
                      </p>

                      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">
                        Please confirm your email address to get started:
                      </p>

                      <!-- CTA Button (table-based for email clients) -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                        <tr>
                          <td align="center">
                            <a href="${confirmationLink}" style="display: inline-block; background-color: #1449E8; color: #ffffff; padding: 14px 48px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; mso-padding-alt: 0; text-align: center;">
                              <!--[if mso]><i style="mso-font-width: 200%; mso-text-raise: 24pt;">&nbsp;</i><![endif]-->
                              Confirm Email Address
                              <!--[if mso]><i style="mso-font-width: 200%;">&nbsp;</i><![endif]-->
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-align: center;">Or copy and paste this link into your browser:</p>
                      <p style="margin: 0 0 32px 0; font-size: 12px; color: #1449E8; word-break: break-all; text-align: center; background: #f9fafb; padding: 12px 16px; border-radius: 6px;">${confirmationLink}</p>

                      <!-- Divider -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                        <tr>
                          <td style="border-top: 1px solid #e5e7eb;"></td>
                        </tr>
                      </table>

                      <!-- Features -->
                      <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #00185F;">What you can do with Luna Careers:</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            <span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Build and showcase your professional profile
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            <span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Browse and apply for career opportunities
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            <span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Take skill assessments to highlight your strengths
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            <span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Enroll in courses to advance your career
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            <span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Connect with top employers in your field
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #00185F; padding: 28px 40px; text-align: center;">
                      <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5;">
                        &copy; ${currentYear} Black Amber Holdings. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.5;">
                        If you didn't create this account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Welcome to Luna Careers

Hi ${firstName},

Thank you for creating your Luna Careers account. We're looking forward to helping you connect with top employers, develop in-demand skills, and unlock your full career potential.

Please confirm your email address by visiting the link below:

${confirmationLink}

What you can do with Luna Careers:
- Build and showcase your professional profile
- Browse and apply for career opportunities
- Take skill assessments to highlight your strengths
- Enroll in courses to advance your career
- Connect with top employers in your field

---
Luna Careers — Empowering your career journey

(c) ${currentYear} Black Amber Holdings. All rights reserved.

If you didn't create this account, you can safely ignore this email.
    `,
  };
}

/**
 * Personal User Invitation
 */
export function personalUserInvitationEmail(params: InvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, temporaryPassword, activationLink } = params;

  return {
    subject: 'Welcome to Luna Careers – Your Account is Ready',
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Your Luna Careers account has been created. Get ready to explore exciting career opportunities.
      </p>
      ${credentialsBox(temporaryPassword)}
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Click below to activate your account:</p>
      ${ctaButton(activationLink, 'Activate Account')}
      ${fallbackLink(activationLink)}
      ${divider()}
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">What you can do with Luna Careers:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Complete your professional profile</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Browse job opportunities</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Take skill assessments</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">&#10003;</span> Enroll in courses to advance your career</td></tr>
      </table>
    `),
    text: `Welcome to Luna Careers!

Hi ${recipientName},

Your Luna Careers account has been created. Get ready to explore exciting career opportunities.

Your Temporary Credentials:
Temporary Password: ${temporaryPassword}
This password will expire in 7 days

Activation Link: ${activationLink}

What you can do with Luna Careers:
- Complete your professional profile
- Browse job opportunities
- Take skill assessments
- Enroll in courses to advance your career
    `,
  };
}

interface ScholarshipApprovedEmailParams {
  recipientName: string;
  scholarshipName: string;
  contentTitle: string;
  contentType: string;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  enrollmentLink: string;
  expiresAt?: string;
}

interface ScholarshipRejectedEmailParams {
  recipientName: string;
  scholarshipName: string;
  contentTitle: string;
  contentType: string;
  reviewNotes?: string;
}

/**
 * Scholarship Approved - Full Scholarship Email
 */
export function scholarshipApprovedFullEmail(params: ScholarshipApprovedEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, scholarshipName, contentTitle, contentType, enrollmentLink, expiresAt } = params;

  const expiryNote = expiresAt
    ? `<p style="margin: 16px 0 0 0; font-size: 13px; color: #dc2626;">This scholarship expires on ${new Date(expiresAt).toLocaleDateString()}. Make sure to access your content before then.</p>`
    : '';

  return {
    subject: `Congratulations – Your ${scholarshipName} Application Has Been Approved`,
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Great news! Your application for the <strong>${scholarshipName}</strong> has been approved.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 2px solid #00185F; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #f9fafb; padding: 20px 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #00185F;">Scholarship Details</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Content:</strong> ${contentTitle}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Type:</strong> ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Scholarship:</strong> ${scholarshipName} (100% Coverage)</p>
            <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #00185F; background: #f0fdf4; padding: 10px 16px; border-radius: 4px;">Cost to You: FREE</p>
            ${expiryNote}
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">You've been automatically enrolled — start learning right away:</p>
      ${ctaButton(enrollmentLink, 'Start Learning Now')}
      ${fallbackLink(enrollmentLink)}
      ${divider()}
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Congratulations on this achievement! We're excited to support your learning journey.</p>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">Best regards,<br>The Luna Careers Team</p>
    `),
    text: `Hi ${recipientName},

Great news! Your application for the ${scholarshipName} has been approved.

Scholarship Details:
Content: ${contentTitle}
Type: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}
Scholarship: ${scholarshipName} (100% Coverage)
Cost to You: FREE
${expiresAt ? `\nThis scholarship expires on ${new Date(expiresAt).toLocaleDateString()}. Make sure to access your content before then.` : ''}

You've been automatically enrolled and can start learning right away!

Start Learning: ${enrollmentLink}

Congratulations on this achievement! We're excited to support your learning journey.

Best regards,
The Luna Careers Team
    `,
  };
}

/**
 * Scholarship Approved - Partial Scholarship Email
 */
export function scholarshipApprovedPartialEmail(params: ScholarshipApprovedEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, scholarshipName, contentTitle, contentType, discountPercentage, originalPrice, discountedPrice, enrollmentLink, expiresAt } = params;

  const savings = originalPrice - discountedPrice;
  const expiryNote = expiresAt
    ? `<p style="margin: 16px 0 0 0; font-size: 13px; color: #dc2626;">This scholarship expires on ${new Date(expiresAt).toLocaleDateString()}. Complete your enrollment before then.</p>`
    : '';

  return {
    subject: `Congratulations – Your ${scholarshipName} Application Has Been Approved`,
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Great news! Your application for the <strong>${scholarshipName}</strong> has been approved.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 2px solid #00185F; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #f9fafb; padding: 20px 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #00185F;">Your Scholarship Details</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Content:</strong> ${contentTitle}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Type:</strong> ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}</p>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;"><strong>Scholarship:</strong> ${scholarshipName} (${discountPercentage}% Discount)</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 6px;">
              <tr>
                <td style="padding: 12px 16px;">
                  <p style="margin: 0 0 4px 0; font-size: 14px; text-decoration: line-through; color: #9ca3af;">Original Price: BZ$${originalPrice.toFixed(2)}</p>
                  <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #00185F;">Your Price: BZ$${discountedPrice.toFixed(2)}</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #059669;">You Save: BZ$${savings.toFixed(2)}</p>
                </td>
              </tr>
            </table>
            ${expiryNote}
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Complete your enrollment now to secure this discount:</p>
      ${ctaButton(enrollmentLink, 'Complete Enrollment')}
      ${fallbackLink(enrollmentLink)}
      ${divider()}
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Congratulations on this achievement! We're excited to support your learning journey.</p>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">Best regards,<br>The Luna Careers Team</p>
    `),
    text: `Hi ${recipientName},

Great news! Your application for the ${scholarshipName} has been approved.

Your Scholarship Details:
Content: ${contentTitle}
Type: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}
Scholarship: ${scholarshipName} (${discountPercentage}% Discount)

Original Price: BZ$${originalPrice.toFixed(2)}
Your Price: BZ$${discountedPrice.toFixed(2)}
You Save: BZ$${savings.toFixed(2)}
${expiresAt ? `\nThis scholarship expires on ${new Date(expiresAt).toLocaleDateString()}. Complete your enrollment before then.` : ''}

Complete your enrollment now to secure this discount!

Enroll Now: ${enrollmentLink}

Congratulations on this achievement! We're excited to support your learning journey.

Best regards,
The Luna Careers Team
    `,
  };
}

/**
 * Scholarship Rejected Email
 */
export function scholarshipRejectedEmail(params: ScholarshipRejectedEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, scholarshipName, contentTitle, contentType, reviewNotes } = params;

  const notesHtml = reviewNotes
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #f9fafb; padding: 16px 20px; border-left: 3px solid #9ca3af;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #6b7280;">Reviewer Notes:</p>
            <p style="margin: 0; font-size: 14px; color: #374151; font-style: italic; line-height: 1.6;">&ldquo;${reviewNotes}&rdquo;</p>
          </td>
        </tr>
      </table>`
    : '';

  return {
    subject: `Update on Your ${scholarshipName} Application`,
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Hi ${recipientName},</h1>
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Thank you for your interest in the <strong>${scholarshipName}</strong> for <strong>${contentTitle}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        After careful review, we regret to inform you that your scholarship application was not approved at this time.
      </p>
      ${notesHtml}
      ${divider()}
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">What you can do next:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #1449E8; font-weight: bold; margin-right: 8px;">&bull;</span> You can still enroll in this ${contentType} at the regular price</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #1449E8; font-weight: bold; margin-right: 8px;">&bull;</span> Check out other scholarship opportunities on our platform</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #1449E8; font-weight: bold; margin-right: 8px;">&bull;</span> Earn credits by completing free content to reduce costs</td></tr>
      </table>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">We encourage you to continue exploring learning opportunities on Luna Careers. Don't let this setback discourage you from pursuing your goals.</p>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">Best regards,<br>The Luna Careers Team</p>
    `),
    text: `Hi ${recipientName},

Thank you for your interest in the ${scholarshipName} for ${contentTitle}.

After careful review, we regret to inform you that your scholarship application was not approved at this time.
${reviewNotes ? `\nReviewer Notes: "${reviewNotes}"` : ''}

What you can do next:
- You can still enroll in this ${contentType} at the regular price
- Check out other scholarship opportunities on our platform
- Earn credits by completing free content to reduce costs

We encourage you to continue exploring learning opportunities on Luna Careers. Don't let this setback discourage you from pursuing your goals.

Best regards,
The Luna Careers Team
    `,
  };
}

/**
 * Password Reset Email
 */
export function passwordResetEmail(params: PasswordResetEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientEmail, resetLink } = params;

  return {
    subject: 'Reset Your Luna Careers Password',
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Password Reset Request</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        We received a request to reset the password for your Luna Careers account associated with <strong>${recipientEmail}</strong>.
      </p>
      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Click below to reset your password:</p>
      ${ctaButton(resetLink, 'Reset Password')}
      ${fallbackLink(resetLink)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #fef3c7; padding: 16px 20px; border-left: 3px solid #FFDF2B;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Important:</p>
            <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.8;">
              &bull; This link will expire in 1 hour<br>
              &bull; If you didn't request this reset, please ignore this email<br>
              &bull; Your password will remain unchanged until you create a new one
            </p>
          </td>
        </tr>
      </table>
      ${divider()}
      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">If you have any questions, please contact our support team.</p>
    `),
    text: `Password Reset Request

We received a request to reset the password for your Luna Careers account associated with ${recipientEmail}.

Click the link below to reset your password:
${resetLink}

Important:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

If you have any questions, please contact our support team.
    `,
  };
}

interface OnboardingCompleteEmailParams {
  recipientName: string;
  recipientEmail: string;
  complimentaryCredits: number;
  dashboardLink: string;
  accountType: string;
}

/**
 * Onboarding Complete - Welcome Email with Credits
 */
export function onboardingCompleteEmail(params: OnboardingCompleteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, complimentaryCredits, dashboardLink, accountType } = params;

  // Customize content based on account type
  const isPersonalUser = accountType === 'personal' || accountType === 'hybrid';

  return {
    subject: 'Welcome to Luna Careers – Your Account is Active!',
    html: emailShell(`
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #00185F; line-height: 1.3;">Welcome, ${recipientName}! 🎉</h1>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Your Luna Careers account is now active and ready to go. We're excited to help you on your career journey!
      </p>

      ${isPersonalUser ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 2px solid #00185F; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #f0fdf4; padding: 20px 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #00185F;">🎁 Welcome Gift</p>
            <p style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #00185F; line-height: 1;">${complimentaryCredits} Credits</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Use these credits to enroll in courses and advance your skills!</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <p style="margin: 0 0 4px 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 500;">Get started now:</p>
      ${ctaButton(dashboardLink, 'Go to Dashboard')}
      ${fallbackLink(dashboardLink)}
      ${divider()}

      ${isPersonalUser ? `
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">Next Steps to Maximize Your Success:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">1.</span> <strong>Complete your professional profile</strong> – Stand out to employers with a compelling profile</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">2.</span> <strong>Add an introduction video</strong> – Let employers see your personality and communication skills</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">3.</span> <strong>Take skill assessments</strong> – Showcase your strengths and get matched with opportunities</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">4.</span> <strong>Enroll in courses</strong> – Use your ${complimentaryCredits} credits to start learning today</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">5.</span> <strong>Browse job opportunities</strong> – Find and apply for positions that match your skills</td></tr>
      </table>
      ` : `
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #00185F;">Next Steps:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">1.</span> <strong>Explore your dashboard</strong> – Familiarize yourself with the platform features</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">2.</span> <strong>Complete your setup</strong> – Configure your account settings and preferences</td></tr>
        <tr><td style="padding: 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"><span style="color: #FFDF2B; font-weight: bold; margin-right: 8px;">3.</span> <strong>Start using the platform</strong> – Begin managing your organization and team</td></tr>
      </table>
      `}

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
        If you have any questions or need assistance, our support team is here to help.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">
        Best regards,<br>
        The Luna Careers Team
      </p>
    `),
    text: `Welcome, ${recipientName}! 🎉

Your Luna Careers account is now active and ready to go. We're excited to help you on your career journey!

${isPersonalUser ? `🎁 Welcome Gift: ${complimentaryCredits} Credits
Use these credits to enroll in courses and advance your skills!
` : ''}

Get started now: ${dashboardLink}

${isPersonalUser ? `Next Steps to Maximize Your Success:
1. Complete your professional profile – Stand out to employers with a compelling profile
2. Add an introduction video – Let employers see your personality and communication skills
3. Take skill assessments – Showcase your strengths and get matched with opportunities
4. Enroll in courses – Use your ${complimentaryCredits} credits to start learning today
5. Browse job opportunities – Find and apply for positions that match your skills
` : `Next Steps:
1. Explore your dashboard – Familiarize yourself with the platform features
2. Complete your setup – Configure your account settings and preferences
3. Start using the platform – Begin managing your organization and team
`}

If you have any questions or need assistance, our support team is here to help.

Best regards,
The Luna Careers Team
    `,
  };
}

