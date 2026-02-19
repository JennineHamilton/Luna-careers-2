import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserSettingsForm } from './settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch profile server-side (no client-side loading spinner)
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return <UserSettingsForm initialProfile={profile} />;
}
