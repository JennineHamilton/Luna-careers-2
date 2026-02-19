/**
 * API Route: Payment Settings
 * GET /api/payments/settings - Get all payment settings
 * PUT /api/payments/settings - Update payment settings (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

/**
 * GET /api/payments/settings
 * Get all active payment settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Fetch all active payment settings
    const { data: settings, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('is_active', true)
      .order('setting_key');
    
    if (error) {
      console.error('Error fetching payment settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment settings' },
        { status: 500 }
      );
    }
    
    // Transform array to object for easier access
    const settingsObject = settings.reduce((acc: any, setting) => {
      let value: any = setting.setting_value;

      // Parse value based on type
      if (setting.setting_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(setting.setting_value || '0');
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(setting.setting_value || '{}');
        } catch (e) {
          value = setting.setting_value;
        }
      }

      acc[setting.setting_key || ''] = value;
      return acc;
    }, {});
    
    return NextResponse.json({ settings: settingsObject }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/payments/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/settings
 * Update payment settings (platform admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    // Use admin client for data operations to bypass RLS
    const supabase = createAdminClient();
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings object' },
        { status: 400 }
      );
    }
    
    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      let stringValue: string;
      let settingType: string;
      
      // Determine type and convert to string
      if (typeof value === 'boolean') {
        stringValue = value.toString();
        settingType = 'boolean';
      } else if (typeof value === 'number') {
        stringValue = value.toString();
        settingType = 'number';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
        settingType = 'json';
      } else {
        stringValue = String(value);
        settingType = 'text';
      }
      
      // Upsert setting
      return supabase
        .from('payment_settings')
        .upsert({
          setting_key: key,
          setting_value: stringValue,
          setting_type: settingType,
          is_active: true,
        }, {
          onConflict: 'setting_key'
        });
    });
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error updating payment settings:', errors);
      return NextResponse.json(
        { error: 'Failed to update some settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Payment settings updated successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/payments/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

