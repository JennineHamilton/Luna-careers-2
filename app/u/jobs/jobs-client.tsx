'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, Search, ChevronDown, Calendar } from 'lucide-react';
import Image from 'next/image';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { LunaCard, LunaCardContent, LunaButton } from '@/components/luna';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type JobCategory = Database['public']['Tables']['job_categories']['Row'];

type VacancyWithOrganization = Vacancy & {
  organizations: Organization | null;
  job_categories: (Pick<JobCategory, 'id' | 'name'> & { [key: string]: unknown }) | null;
  has_applied?: boolean;
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

/* Match /u/screening category badge palette: soft bg-*-50 + text-*-700, no border */
const EMPLOYMENT_TYPE_BADGE_CLASSES: Record<string, string> = {
  'full-time': 'bg-blue-50 text-blue-700',
  'part-time': 'bg-teal-50 text-teal-700',
  contract: 'bg-violet-50 text-violet-700',
  internship: 'bg-amber-50 text-amber-700',
  temporary: 'bg-slate-100 text-slate-700',
};

interface JobsPageClientProps {
  vacancies: VacancyWithOrganization[];
  jobCategories: Pick<JobCategory, 'id' | 'name'>[];
  userId: string;
}

export function JobsPageClient({ vacancies, jobCategories, userId }: JobsPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Dynamic location options from vacancies: Remote + unique Country/State pairs
  const locationOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: '', label: 'Any location' }];
    options.push({ value: 'remote', label: 'Remote' });
    const seen = new Set<string>();
    vacancies.forEach((v) => {
      if (v.is_remote) return;
      const country = v.location_country || 'Unknown';
      const state = v.location_state || '';
      const key = state ? `${country}|${state}` : country;
      if (seen.has(key)) return;
      seen.add(key);
      const label = state ? `${state}, ${country}` : country;
      options.push({ value: key, label });
    });
    return options;
  }, [vacancies]);

  const formatLocation = (vacancy: Vacancy) => {
    if (vacancy.is_remote) return 'Remote';
    const parts = [vacancy.location_city, vacancy.location_state, vacancy.location_country].filter(Boolean);
    return parts.join(', ') || 'Not specified';
  };

  const currencySymbol: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'CHF', BZD: 'BZ$',
  };

  const formatSalary = (vacancy: Vacancy) => {
    if (!vacancy.salary_range_min && !vacancy.salary_range_max) return null;
    const code = vacancy.salary_currency || 'USD';
    const symbol = currencySymbol[code] ?? code + ' ';
    const period = vacancy.salary_period || 'monthly';
    const periodLabel = period === 'hourly' ? '/hr' : period === 'yearly' ? '/yr' : '/mo';
    if (vacancy.salary_range_min && vacancy.salary_range_max) {
      return `${symbol}${vacancy.salary_range_min.toLocaleString()}-${vacancy.salary_range_max.toLocaleString()}${periodLabel}`;
    }
    if (vacancy.salary_range_min) {
      return `${symbol}${vacancy.salary_range_min.toLocaleString()}+${periodLabel}`;
    }
    return `Up to ${symbol}${vacancy.salary_range_max?.toLocaleString()}${periodLabel}`;
  };

  const filteredVacancies = useMemo(() => {
    return vacancies.filter((vacancy) => {
      const matchesSearch =
        searchQuery === '' ||
        vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vacancy.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vacancy.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        selectedLocation === '' ||
        (selectedLocation === 'remote' && vacancy.is_remote) ||
        (selectedLocation !== 'remote' &&
          !vacancy.is_remote &&
          (() => {
            const [country, state] = selectedLocation.includes('|') ? selectedLocation.split('|') : [selectedLocation, ''];
            return (
              (vacancy.location_country || '') === country &&
              (state === '' || (vacancy.location_state || '') === state)
            );
          })());

      const matchesCategory =
        !selectedCategoryId || (vacancy.job_category_id && vacancy.job_category_id === selectedCategoryId);

      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [vacancies, searchQuery, selectedLocation, selectedCategoryId]);

  const handleViewDetails = (vacancyId: string) => {
    router.push(`/u/jobs/${vacancyId}`);
  };

  const selectedLocationLabel = locationOptions.find((o) => o.value === selectedLocation)?.label ?? 'Location';

  return (
    <div className="min-h-screen">
      {/* Hero: full-bleed dark Luna blue (match module details) */}
      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-gradient-to-br from-[#00185f] via-[#001a70] to-[#002080] text-white py-6 md:py-8" style={{ marginTop: '-1.5rem' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-[900px] mx-auto flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Find your next job.</h1>

            {/* Search bar: keyword + location + search */}
            <div className="w-full flex items-center gap-2 rounded-full bg-luna-bg-primary pl-5 pr-2 py-2 shadow-luna-sm text-luna-gray-900">
              <Search className="w-5 h-5 text-luna-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search jobs, keywords, companies"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 py-1.5 text-sm border-0 bg-transparent placeholder:text-luna-gray-400 focus:outline-none focus:ring-0 text-luna-gray-900"
              />
              <div className="h-6 w-px bg-luna-gray-200 shrink-0" />
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 py-1.5 pl-2 pr-3 text-sm text-luna-gray-600 hover:text-luna-gray-900 min-w-[140px]"
                >
                  <MapPin className="w-4 h-4 text-luna-gray-400" />
                  <span className="truncate">{selectedLocationLabel}</span>
                  <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {locationDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setLocationDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-auto rounded-lg bg-luna-bg-primary shadow-luna-md border border-luna-border-default py-1 z-20">
                      {locationOptions.map((opt) => (
                        <button
                          key={opt.value || 'any'}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(opt.value);
                            setLocationDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-luna-gray-100 ${
                            selectedLocation === opt.value ? 'bg-luna-bg-tertiary text-luna-gray-800 font-medium' : 'text-luna-gray-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-luna-navy text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Job category pills – Luna green accent */}
            <div className="w-full mt-4">
              <p className="text-xs font-medium text-white/80 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('')}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !selectedCategoryId
                      ? 'bg-luna-success/25 border-luna-success/50 text-white'
                      : 'bg-white/10 border-luna-success/20 text-white hover:bg-luna-success/15'
                  }`}
                >
                  All
                </button>
                {jobCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? '' : cat.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-luna-success/25 border-luna-success/50 text-white'
                        : 'bg-white/10 border-luna-success/20 text-white hover:bg-luna-success/15'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacancy list: filters section + single card */}
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[900px] space-y-4">
          {/* Other filters (above the list) */}
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-luna-border-default bg-luna-bg-secondary px-4 py-3">
            <span className="text-sm font-medium text-luna-gray-700">Filters</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-luna-gray-500">Location:</span>
              <span className="text-sm text-luna-gray-800">{selectedLocationLabel}</span>
              {selectedCategoryId && (
                <>
                  <span className="text-luna-gray-300">|</span>
                  <span className="text-xs text-luna-gray-500">Category:</span>
                  <span className="text-sm text-luna-gray-800">
                    {jobCategories.find((c) => c.id === selectedCategoryId)?.name ?? '—'}
                  </span>
                </>
              )}
            </div>
          </div>

          {filteredVacancies.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-luna-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-luna-gray-900 mb-1">No jobs found</h3>
              <p className="text-sm text-luna-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <LunaCard padding="none">
              <LunaCardContent className="p-0">
                {filteredVacancies.map((vacancy, index) => (
                  <div
                    key={vacancy.id}
                    className={`flex items-start gap-4 p-4 ${index > 0 ? 'border-t border-luna-border-default' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-md bg-luna-gray-100 border border-luna-border-default flex items-center justify-center shrink-0 overflow-hidden">
                      {vacancy.organizations?.logo_url ? (
                        <Image
                          src={vacancy.organizations.logo_url}
                          alt=""
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Briefcase className="w-6 h-6 text-luna-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-luna-gray-900">{vacancy.title}</h3>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            EMPLOYMENT_TYPE_BADGE_CLASSES[vacancy.employment_type] ??
                              'bg-slate-100 text-slate-700'
                          )}
                        >
                          {EMPLOYMENT_TYPE_LABELS[vacancy.employment_type] ?? vacancy.employment_type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-luna-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {formatLocation(vacancy)}
                        </span>
                        {formatSalary(vacancy) && (
                          <span className="font-medium text-luna-gray-700">{formatSalary(vacancy)}</span>
                        )}
                        {vacancy.application_deadline && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            Apply by {formatDateTime(vacancy.application_deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <LunaButton
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(vacancy.id);
                      }}
                    >
                      View details
                    </LunaButton>
                  </div>
                ))}
              </LunaCardContent>
            </LunaCard>
          )}
        </div>
      </div>
    </div>
  );
}
