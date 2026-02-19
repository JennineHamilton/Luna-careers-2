/**
 * Email sending utilities
 * Uses Supabase for development, MailGun for production
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email using Supabase Auth
 * This uses Supabase's built-in email service via Resend
 */
export async function sendEmailViaSupabase(params: SendEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Use Resend API (Supabase's email provider)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // Fallback: Log to console if no Resend API key
      console.log('⚠️  RESEND_API_KEY not configured. Email content logged below:');
      console.log('📧 Email Details:');
      console.log('To:', params.to);
      console.log('Subject:', params.subject);
      console.log('---');
      console.log('HTML Content:');
      console.log(params.html);
      console.log('---');
      console.log('Text Content:');
      console.log(params.text);
      console.log('---');

      return {
        success: true,
        error: 'Email logged to console (RESEND_API_KEY not configured)'
      };
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Luna Careers <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email via Resend',
      };
    }

    const data = await response.json();
    console.log('✅ Email sent successfully via Resend:', data.id);

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email using MailGun
 */
export async function sendEmailViaMailGun(params: SendEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunRegion = process.env.MAILGUN_REGION || 'US';
    const fromEmail = process.env.EMAIL_FROM || `Luna Careers <postmaster@${mailgunDomain}>`;

    if (!mailgunApiKey || !mailgunDomain) {
      console.error('⚠️  MailGun credentials not configured');
      return {
        success: false,
        error: 'MailGun credentials not configured',
      };
    }

    // Determine API endpoint based on region
    const apiEndpoint = mailgunRegion === 'EU'
      ? `https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`
      : `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

    // Create form data for MailGun API
    const formData = new URLSearchParams();
    formData.append('from', fromEmail);
    formData.append('to', params.to);
    formData.append('subject', params.subject);
    formData.append('html', params.html);
    formData.append('text', params.text);

    // Send email via MailGun API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${mailgunApiKey}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailGun API error:', errorText);
      return {
        success: false,
        error: `MailGun API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('✅ Email sent successfully via MailGun:', data.id);

    return { success: true };
  } catch (error) {
    console.error('Error sending email via MailGun:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main email sending function
 * Automatically chooses the right provider based on environment
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const useMailGun = process.env.EMAIL_PROVIDER === 'mailgun';
  
  if (useMailGun) {
    return sendEmailViaMailGun(params);
  }
  
  return sendEmailViaSupabase(params);
}

