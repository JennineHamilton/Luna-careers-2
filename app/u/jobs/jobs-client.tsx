'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardContent } from '@/components/luna';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaInput } from '@/components/luna/input';
import { LunaCombobox } from '@/components/luna/combobox';
import { Briefcase, MapPin, Building2, DollarSign, Clock, Search, Filter, CheckCircle } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import Image from 'next/image';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

type VacancyWithOrganization = Vacancy & {
  organizations: Organization | null;
  has_applied?: boolean;
};

interface JobsPageClientProps {
  vacancies: VacancyWithOrganization[];
  userId: string;
}

export function JobsPageClient({ vacancies, userId }: JobsPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string[]>([]);
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string[]>([]);

  // Format employment type
  const formatEmploymentType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Format experience level
  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Format location
  const formatLocation = (vacancy: Vacancy) => {
    if (vacancy.is_remote) return 'Remote';
    const parts = [vacancy.location_city, vacancy.location_state, vacancy.location_country].filter(Boolean);
    return parts.join(', ') || 'Not specified';
  };

  // Format salary
  const formatSalary = (vacancy: Vacancy) => {
    if (!vacancy.salary_range_min && !vacancy.salary_range_max) return null;
    const currency = vacancy.salary_currency || 'USD';
    if (vacancy.salary_range_min && vacancy.salary_range_max) {
      return `${currency} ${vacancy.salary_range_min.toLocaleString()} - ${vacancy.salary_range_max.toLocaleString()}`;
    }
    if (vacancy.salary_range_min) {
      return `${currency} ${vacancy.salary_range_min.toLocaleString()}+`;
    }
    return `Up to ${currency} ${vacancy.salary_range_max?.toLocaleString()}`;
  };

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(vacancies.map(v => formatLocation(v)))).map(loc => ({
    label: loc,
    value: loc,
  }));

  // Filter vacancies
  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = searchQuery === '' ||
      vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacancy.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacancy.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter.length === 0 ||
      locationFilter.includes(formatLocation(vacancy));
    
    const matchesEmploymentType = employmentTypeFilter.length === 0 ||
      employmentTypeFilter.includes(vacancy.employment_type);
    
    const matchesExperienceLevel = experienceLevelFilter.length === 0 ||
      experienceLevelFilter.includes(vacancy.experience_level);
    
    return matchesSearch && matchesLocation && matchesEmploymentType && matchesExperienceLevel;
  });

  const handleViewDetails = (vacancyId: string) => {
    router.push(`/u/jobs/${vacancyId}`);
  };

  return (
    <div>
      {/* Hero — full-bleed (breaks out of MainContent padding) */}
      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-gradient-to-r from-luna-primary to-luna-blue text-white px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Next Opportunity</h1>
          <p className="text-base md:text-lg opacity-90">Browse {filteredVacancies.length} active job openings</p>
        </div>
      </div>

      {/* Content — standard padding from MainContent */}
      <div className="pt-6 md:pt-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <LunaInput
              type="text"
              placeholder="Search by job title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <LunaCombobox
              options={uniqueLocations}
              value={locationFilter}
              onChange={setLocationFilter}
              placeholder="Location"
              searchPlaceholder="Search locations..."
              className="w-full sm:w-auto sm:min-w-[200px]"
            />
            <LunaCombobox
              options={[
                { label: 'Full Time', value: 'full-time' },
                { label: 'Part Time', value: 'part-time' },
                { label: 'Contract', value: 'contract' },
                { label: 'Internship', value: 'internship' },
                { label: 'Temporary', value: 'temporary' },
              ]}
              value={employmentTypeFilter}
              onChange={setEmploymentTypeFilter}
              placeholder="Employment Type"
              searchPlaceholder="Search types..."
              className="w-full sm:w-auto sm:min-w-[200px]"
            />
            <LunaCombobox
              options={[
                { label: 'Entry', value: 'entry' },
                { label: 'Mid', value: 'mid' },
                { label: 'Senior', value: 'senior' },
                { label: 'Lead', value: 'lead' },
                { label: 'Executive', value: 'executive' },
              ]}
              value={experienceLevelFilter}
              onChange={setExperienceLevelFilter}
              placeholder="Experience Level"
              searchPlaceholder="Search levels..."
              className="w-full sm:w-auto sm:min-w-[200px]"
            />
          </div>
        </div>

        {/* Job Listings */}
        {filteredVacancies.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVacancies.map((vacancy) => (
              <LunaCard key={vacancy.id} className="hover:shadow-lg transition-shadow">
                <LunaCardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Company Logo and Job Info */}
                    <div className="flex gap-4 flex-1">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        {vacancy.organizations?.logo_url ? (
                          <Image
                            src={vacancy.organizations.logo_url}
                            alt={vacancy.organizations.name || 'Company'}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1 hover:text-luna-primary cursor-pointer"
                            onClick={() => handleViewDetails(vacancy.id)}>
                          {vacancy.title}
                        </h3>
                        <p className="text-base text-gray-700 mb-3">{vacancy.organizations?.name || 'Company'}</p>

                        {/* Meta Information */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {formatLocation(vacancy)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            {formatEmploymentType(vacancy.employment_type)}
                          </div>
                          {formatSalary(vacancy) && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4" />
                              {formatSalary(vacancy)}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Posted {formatDateTime(vacancy.created_at || '')}
                          </div>
                        </div>

                        {/* Description Preview */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {vacancy.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <LunaBadge variant="default">
                            {formatExperienceLevel(vacancy.experience_level)}
                          </LunaBadge>
                          {vacancy.is_remote && (
                            <LunaBadge variant="primary">Remote</LunaBadge>
                          )}
                          {vacancy.has_applied && (
                            <LunaBadge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </LunaBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex-shrink-0">
                      <LunaButton
                        onClick={() => handleViewDetails(vacancy.id)}
                        variant={vacancy.has_applied ? 'outline' : 'primary'}
                      >
                        {vacancy.has_applied ? 'View Application' : 'View Details'}
                      </LunaButton>
                    </div>
                  </div>
                </LunaCardContent>
              </LunaCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

