import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminSettingsForm } from './settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();

  // Fetch profile and payment settings in parallel
  const [profileResult, settingsResult] = await Promise.all([
    adminClient.from('users').select('first_name, last_name, email, phone').eq('id', user.id).single(),
    adminClient.from('payment_settings').select('*').eq('is_active', true).order('setting_key'),
  ]);

  if (!profileResult.data) {
    redirect('/login');
  }

  // Transform payment settings array to object (same as GET /api/payments/settings)
  const settingsObject = (settingsResult.data || []).reduce((acc: Record<string, any>, setting: any) => {
    let value: any = setting.setting_value;
    if (setting.setting_type === 'boolean') {
      value = setting.setting_value === 'true';
    } else if (setting.setting_type === 'number') {
      value = parseFloat(setting.setting_value || '0');
    } else if (setting.setting_type === 'json') {
      try { value = JSON.parse(setting.setting_value || '{}'); } catch (e) { value = setting.setting_value; }
    }
    acc[setting.setting_key || ''] = value;
    return acc;
  }, {});

  return (
    <AdminSettingsForm
      initialProfile={profileResult.data}
      initialPaymentSettings={settingsObject}
    />
  );
}
