import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';
import Link from 'next/link';
import { Calendar, Building2, MapPin, Briefcase } from 'lucide-react';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

type ShortlistedApplication = JobApplication & {
  vacancies: (Vacancy & {
    organizations: Organization;
  }) | null;
};

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  // Fetch applications that are shortlisted (interview stage)
  const { data: applicationsData, error: appsError } = await supabase
    .from('job_applications')
    .select(`
      *,
      vacancies (
        *,
        organizations (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'shortlisted')
    .order('updated_at', { ascending: false });

  if (appsError) {
    console.error('Error fetching shortlisted applications:', appsError);
  }

  const applications = (applicationsData as unknown as ShortlistedApplication[]) || [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900">Interviews</h1>
        <p className="text-sm text-luna-gray-500 mt-1">
          Applications that have been shortlisted for interviews
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-md p-8 shadow-luna-sm border border-luna-border-default text-center">
          <Calendar className="w-10 h-10 text-luna-gray-300 mx-auto mb-3" />
          <p className="text-luna-gray-600 font-medium mb-1">No interviews yet</p>
          <p className="text-sm text-luna-gray-400 max-w-md mx-auto">
            When your job applications are shortlisted for interviews, they will appear here. Keep applying to increase your chances!
          </p>
          <Link
            href="/u/jobs"
            className="inline-block mt-4 text-sm font-medium text-luna-blue hover:underline"
          >
            Browse open positions →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const vacancy = app.vacancies;
            const org = vacancy?.organizations;

            return (
              <div
                key={app.id}
                className="bg-white rounded-md p-6 shadow-luna-sm border border-luna-border-default hover:border-luna-blue/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-luna-gray-900 truncate">
                      {vacancy?.title ?? 'Unknown Position'}
                    </h3>
                    {org && (
                      <div className="flex items-center gap-1.5 text-sm text-luna-gray-600 mt-1">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{org.name}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-luna-gray-400">
                      {vacancy?.location_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vacancy.location_city}{vacancy.location_country ? `, ${vacancy.location_country}` : ''}
                        </span>
                      )}
                      {vacancy?.employment_type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {vacancy.employment_type.replace('-', ' ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Shortlisted {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    Shortlisted
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

