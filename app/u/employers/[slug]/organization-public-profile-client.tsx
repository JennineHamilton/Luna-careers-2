'use client';

import Link from 'next/link';
import {
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  Users,
  Briefcase,
  Award,
  Lightbulb,
  Banknote,
  Clock,
  FileQuestion,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaCard } from '@/components/luna/card';
import { LunaEmptyState } from '@/components/luna/empty-state';
import { LunaSectionLabel } from '@/components/luna/section-label';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationSkill = Database['public']['Tables']['organization_skills']['Row'] & {
  skills: Database['public']['Tables']['skills']['Row'];
};
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];

interface OrganizationPublicProfileClientProps {
  organization: Organization;
  skills: OrganizationSkill[];
  benefits: OrganizationBenefit[];
  vacancies: Vacancy[];
}

export function OrganizationPublicProfileClient({
  organization,
  skills,
  benefits,
  vacancies,
}: OrganizationPublicProfileClientProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLocation = () => {
    const parts = [organization.city, organization.state, organization.country].filter(Boolean);
    return parts.join(', ') || 'Location not set';
  };

  const getIndustryLabel = (industry: string | null) => {
    if (!industry) return 'Industry not set';
    return industry.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getOrganizationSizeLabel = (size: string | null) => {
    if (!size) return 'Size not set';
    const sizeMap: Record<string, string> = {
      startup: '1-10 Employees',
      small: '11-50 Employees',
      medium: '51-200 Employees',
      large: '201-1000 Employees',
      enterprise: '1000+ Employees',
    };
    return sizeMap[size] || size;
  };

  const formatSalary = (vacancy: Vacancy) => {
    if (!vacancy.salary_range_min && !vacancy.salary_range_max) return null;
    const currency = vacancy.salary_currency || 'USD';
    const min = vacancy.salary_range_min;
    const max = vacancy.salary_range_max;
    const period = vacancy.salary_period || 'monthly';
    const periodLabel = period === 'hourly' ? 'hr' : period === 'yearly' ? 'Yr' : 'Mth';
    const suffix = currency === 'USD' ? periodLabel : currency;
    if (min && max) {
      return `$${min.toLocaleString()}-${max.toLocaleString()}/${suffix}`;
    }
    if (min) return `$${min.toLocaleString()}+/${suffix}`;
    return null;
  };

  const getRequirementCounts = (vacancy: Vacancy) => {
    const assessments = Array.isArray(vacancy.prerequisite_assessments) ? vacancy.prerequisite_assessments.length : 0;
    const modules = Array.isArray(vacancy.prerequisite_learning_content) ? vacancy.prerequisite_learning_content.length : 0;
    return { assessments, modules };
  };

  const activeVacancies = vacancies.filter(v => v.is_active);

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-luna-bg-secondary min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* ═══════════ HEADER CONTENT CARD (Banner + Logo + Info) — read-only ═══════════ */}
        <LunaCard
          padding="none"
          className="border border-luna-border-light rounded-lg rounded-b-none overflow-hidden border-b-[#E4E7EC] mb-6"
        >
          {/* Banner — no edit button */}
          <div className="relative w-full h-64 bg-luna-bg-primary pt-[10px] px-[10px] pb-0">
            {organization.cover_image_url ? (
              <div className="relative w-full h-full rounded-md overflow-hidden bg-white">
                <img
                  src={organization.cover_image_url}
                  alt="Company banner"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-md flex min-h-0 bg-luna-gray-100" />
            )}

            {/* Logo — no click, no pencil overlay */}
            <div className="absolute left-[49px] bottom-0 translate-y-[40%]">
              <div className="flex items-center justify-center w-[138px] h-[138px] rounded-full bg-white p-[5px] shadow-lg border border-luna-border-default">
                <LunaAvatar
                  src={organization.logo_url || undefined}
                  alt={organization.name}
                  fallback={getInitials(organization.name)}
                  size="xl"
                  className="w-32 h-32 shrink-0 rounded-full overflow-hidden border border-luna-border-default bg-white"
                />
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 pt-20 pb-6">
            <div className="flex flex-wrap items-center gap-6 md:gap-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                </div>
                <div>
                  <p className="text-xs text-luna-gray-500 font-medium">Industry</p>
                  <p className="text-sm font-medium text-luna-gray-900">
                    {getIndustryLabel(organization.industry)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                </div>
                <div>
                  <p className="text-xs text-luna-gray-500 font-medium">Company Size</p>
                  <p className="text-sm font-medium text-luna-gray-900">
                    {getOrganizationSizeLabel(organization.organization_size)}
                  </p>
                </div>
              </div>

              {organization.founded_year && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-500 font-medium">Founded</p>
                    <p className="text-sm font-medium text-luna-gray-900">{organization.founded_year}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-luna-border-default my-6" />

            <div>
              <h2 className="text-xl font-semibold text-luna-gray-900">{organization.name}</h2>
            </div>

            {organization.bio || organization.description ? (
              <p className="text-sm text-luna-gray-700 leading-[1.4] mt-2">
                {organization.bio || organization.description}
              </p>
            ) : (
              <p className="text-sm text-luna-gray-400 italic mt-2 leading-[1.4]">No company description added yet.</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              {organization.contact_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-500 font-medium">Phone</p>
                    <a
                      href={`tel:${organization.contact_phone}`}
                      className="text-sm font-medium text-luna-gray-900 hover:text-luna-blue transition-colors"
                    >
                      {organization.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {organization.contact_email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-500 font-medium">Email</p>
                    <a
                      href={`mailto:${organization.contact_email}`}
                      className="text-sm font-medium text-luna-gray-900 hover:text-luna-blue transition-colors"
                    >
                      {organization.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {organization.website_url && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-500 font-medium">Website</p>
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-luna-gray-900 hover:text-luna-blue transition-colors"
                    >
                      {organization.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                </div>
                <div>
                  <p className="text-xs text-luna-gray-500 font-medium">Location</p>
                  <p className="text-sm font-medium text-luna-gray-900">{formatLocation()}</p>
                </div>
              </div>
            </div>
          </div>
        </LunaCard>

        {/* ═══════════ SKILLS SECTION — read-only, no Add/Edit ═══════════ */}
        <LunaCard padding="none" className="mb-6">
          <div className="p-6">
            <LunaSectionLabel label="Skills" className="mb-2" />
            <p className="text-sm text-luna-gray-600 mb-4">
              Add the list of skills required to work for your company
            </p>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((orgSkill) => (
                  <span
                    key={orgSkill.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-luna-gray-700 bg-blue-50"
                  >
                    {orgSkill.skills.name}
                  </span>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Lightbulb}
                iconBackground="blue"
                showBackground
                title="No skills listed"
                description="This employer has not added skills yet"
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ COMPANY BENEFITS SECTION — read-only pills, no Add/delete ═══════════ */}
        <LunaCard padding="none" className="mb-6">
          <div className="p-6">
            <LunaSectionLabel label="Company Benefits" className="mb-2" />
            <p className="text-sm text-luna-gray-600 mb-4">
              Add the list of benefits your company offers employees
            </p>
            {benefits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <span
                    key={benefit.id}
                    className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full text-sm text-luna-gray-700 bg-blue-50"
                  >
                    {benefit.benefit_name}
                  </span>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Award}
                iconBackground="blue"
                showBackground
                title="No benefits listed"
                description="This employer has not added benefits yet"
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ AVAILABLE JOBS SECTION — clickable cards with View button and stats ═══════════ */}
        <LunaCard padding="none">
          <div className="p-6">
            <h3 className="text-base font-semibold text-luna-gray-900 mb-4">Available Jobs</h3>
            {activeVacancies.length > 0 ? (
              <div>
                {activeVacancies.map((vacancy, index) => {
                  const salary = formatSalary(vacancy);
                  const location = vacancy.is_remote
                    ? 'Remote'
                    : vacancy.work_location || formatLocation();
                  const employmentType = vacancy.employment_type
                    ? vacancy.employment_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : 'Full Time';
                  const { assessments, modules } = getRequirementCounts(vacancy);
                  const hasRequirements = assessments > 0 || modules > 0;

                  return (
                    <div key={vacancy.id}>
                      <Link
                        href={`/u/jobs/${vacancy.id}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-luna-border-light rounded-lg hover:border-luna-blue/50 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-luna-gray-100 flex items-center justify-center shrink-0">
                          <Briefcase className="w-6 h-6 text-luna-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-luna-gray-900 mb-2 group-hover:text-luna-blue transition-colors">
                            {vacancy.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-luna-gray-600 mb-2">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-luna-gray-400 shrink-0" />
                              {location}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-luna-gray-400 shrink-0" />
                              {employmentType}
                            </span>
                            {salary && (
                              <span className="inline-flex items-center gap-1.5 font-medium text-luna-gray-900">
                                <Banknote className="w-4 h-4 text-luna-gray-500 shrink-0" />
                                {salary}
                              </span>
                            )}
                          </div>
                          {hasRequirements && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {assessments > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200/80">
                                  <FileQuestion className="w-3.5 h-3.5 shrink-0" />
                                  {assessments} Assessment{assessments !== 1 ? 's' : ''}
                                </span>
                              )}
                              {modules > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200/80">
                                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                  {modules} Module{modules !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 self-start sm:self-center inline-flex items-center gap-2 h-8 px-3 text-sm font-medium rounded-md border border-luna-border-default bg-white text-luna-gray-700 group-hover:bg-luna-gray-50 transition-colors">
                          View
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                      {index < activeVacancies.length - 1 && (
                        <div className="h-px bg-luna-border-default" aria-hidden />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <LunaEmptyState
                icon={Briefcase}
                iconBackground="blue"
                showBackground
                title="No active jobs"
                description="There are no open positions at the moment"
                size="sm"
              />
            )}
          </div>
        </LunaCard>
      </div>
    </div>
  );
}
