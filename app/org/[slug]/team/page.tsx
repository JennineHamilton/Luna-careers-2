import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TeamPageClient } from './team-client';
import type { Database } from '@/types/database.types';

type User = Database['public']['Tables']['users']['Row'];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const organizationId = user.user_metadata?.organization_id;

  if (!organizationId) {
    redirect('/u/dashboard');
  }

  // Verify user has access to this organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .eq('id', organizationId)
    .single();

  if (!organization) {
    redirect('/u/dashboard');
  }

  // Fetch team members for this organization
  const { data: teamMembers, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team members:', error);
  }

  return (
    <TeamPageClient
      teamMembers={teamMembers || []}
      organizationId={organizationId}
      organizationName={organization.name}
      slug={slug}
    />
  );
}

