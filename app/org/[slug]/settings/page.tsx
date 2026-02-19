import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrgSettingsForm } from './settings-form';

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminClient = createAdminClient();

  // Verify user belongs to this organization
  const { data: userData } = await adminClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    redirect('/login');
  }

  // Fetch organization server-side
  const { data: organization } = await adminClient
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('id', userData.organization_id)
    .single();

  if (!organization) {
    redirect('/login');
  }

  return <OrgSettingsForm initialOrganization={organization} slug={slug} />;
}
