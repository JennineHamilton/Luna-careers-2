import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScholarshipsPageClient } from './scholarships-client';
import type { Database } from '@/types/database.types';

type ScholarshipApplication = Database['public']['Tables']['scholarship_applications']['Row'];
type AwardedScholarship = Database['public']['Tables']['awarded_scholarships']['Row'];

export default async function ScholarshipsPage() {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's scholarship applications with related scholarship data
  const { data: applicationsData, error: appsError } = await supabase
    .from('scholarship_applications')
    .select(`
      *,
      scholarships (
        id,
        name,
        type,
        discount_percentage
      )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false });

  if (appsError) {
    console.error('Error fetching scholarship applications:', appsError);
  }

  // Fetch awarded scholarships
  const { data: awardedData, error: awardedError } = await supabase
    .from('awarded_scholarships')
    .select(`
      *,
      scholarships (
        id,
        name,
        type,
        discount_percentage
      ),
      scholarship_applications (
        id,
        applied_at,
        application_data
      )
    `)
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: false });

  if (awardedError) {
    console.error('Error fetching awarded scholarships:', awardedError);
  }

  const applications: ScholarshipApplication[] = applicationsData || [];
  const awardedScholarships: AwardedScholarship[] = awardedData || [];

  // Fetch content details (title, image, creator, price) for applications
  const contentDetails: Record<string, { title: string; image: string | null; creator: { name: string; logo: string | null } | null; price: number }> = {};

  for (const app of applications) {
    const { content_type, content_id } = app;

    if (content_type === 'module') {
      const { data } = await supabase
        .from('modules')
        .select('title, cover_image_url, price, creators(name, logo_url)')
        .eq('id', content_id)
        .single();
      if (data) {
        contentDetails[content_id] = {
          title: data.title,
          image: data.cover_image_url,
          creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
          price: data.price || 0,
        };
      }
    } else if (content_type === 'course') {
      const { data } = await supabase
        .from('courses')
        .select('title, cover_image_url, price, creators(name, logo_url)')
        .eq('id', content_id)
        .single();
      if (data) {
        contentDetails[content_id] = {
          title: data.title,
          image: data.cover_image_url,
          creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
          price: data.price || 0,
        };
      }
    } else if (content_type === 'program') {
      const { data } = await supabase
        .from('programs')
        .select('title, cover_image_url, price, creators(name, logo_url)')
        .eq('id', content_id)
        .single();
      if (data) {
        contentDetails[content_id] = {
          title: data.title,
          image: data.cover_image_url,
          creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
          price: data.price || 0,
        };
      }
    }
  }

  // Fetch content details for awarded scholarships
  for (const awarded of awardedScholarships) {
    const { content_type, content_id } = awarded;
    if (!contentDetails[content_id]) {
      if (content_type === 'module') {
        const { data } = await supabase
          .from('modules')
          .select('title, cover_image_url, price, creators(name, logo_url)')
          .eq('id', content_id)
          .single();
        if (data) {
          contentDetails[content_id] = {
            title: data.title,
            image: data.cover_image_url,
            creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
            price: data.price || 0,
          };
        }
      } else if (content_type === 'course') {
        const { data } = await supabase
          .from('courses')
          .select('title, cover_image_url, price, creators(name, logo_url)')
          .eq('id', content_id)
          .single();
        if (data) {
          contentDetails[content_id] = {
            title: data.title,
            image: data.cover_image_url,
            creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
            price: data.price || 0,
          };
        }
      } else if (content_type === 'program') {
        const { data } = await supabase
          .from('programs')
          .select('title, cover_image_url, price, creators(name, logo_url)')
          .eq('id', content_id)
          .single();
        if (data) {
          contentDetails[content_id] = {
            title: data.title,
            image: data.cover_image_url,
            creator: data.creators ? { name: data.creators.name, logo: data.creators.logo_url } : null,
            price: data.price || 0,
          };
        }
      }
    }
  }

  return (
    <ScholarshipsPageClient
      applications={applications}
      awardedScholarships={awardedScholarships}
      contentDetails={contentDetails}
      userId={user.id}
    />
  );
}

