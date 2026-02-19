'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  Users,
  Briefcase,
  Award,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Camera,
} from 'lucide-react';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaCard } from '@/components/luna/card';
import { LunaSwitch } from '@/components/luna/switch';
import { LunaEmptyState } from '@/components/luna/empty-state';
import {
  UploadOrganizationLogoModal,
  UploadOrganizationBannerModal,
  EditOrganizationProfileModal,
  EditOrganizationBioModal,
  ManageOrganizationSkillsModal,
  AddBenefitModal,
} from '@/components/luna/modals';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationSkill = Database['public']['Tables']['organization_skills']['Row'] & {
  skills: Database['public']['Tables']['skills']['Row'];
};
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];

interface OrganizationProfileClientProps {
  organization: Organization;
  initialSkills: OrganizationSkill[];
  initialBenefits: OrganizationBenefit[];
  vacancies: Vacancy[];
  slug: string;
}

export function OrganizationProfileClient({
  organization: organizationProp,
  initialSkills,
  initialBenefits,
  vacancies,
  slug,
}: OrganizationProfileClientProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>(organizationProp);
  const [skills, setSkills] = useState<OrganizationSkill[]>(initialSkills);
  const [benefits, setBenefits] = useState<OrganizationBenefit[]>(initialBenefits);
  const [isProfileVisible, setIsProfileVisible] = useState(true); // TODO: Add to database

  // Sync organization from props when server data changes (e.g. after router.refresh)
  useEffect(() => {
    setOrganization(organizationProp);
  }, [organizationProp]);

  // Modal states
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [uploadLogoModalOpen, setUploadLogoModalOpen] = useState(false);
  const [uploadBannerModalOpen, setUploadBannerModalOpen] = useState(false);
  const [editBioModalOpen, setEditBioModalOpen] = useState(false);
  const [manageSkillsModalOpen, setManageSkillsModalOpen] = useState(false);
  const [addBenefitModalOpen, setAddBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<OrganizationBenefit | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleUploadLogoSuccess = (data?: { logo_url?: string | null }) => {
    if (data !== undefined) {
      setOrganization((prev) => ({ ...prev, logo_url: data.logo_url ?? null }));
    }
    router.refresh();
  };

  const handleUploadBannerSuccess = (data?: { cover_image_url?: string | null }) => {
    if (data !== undefined) {
      setOrganization((prev) => ({ ...prev, cover_image_url: data.cover_image_url ?? null }));
    }
    router.refresh();
  };

  const handleOpenAddBenefit = () => {
    setEditingBenefit(null);
    setAddBenefitModalOpen(true);
  };

  const handleEditBenefit = (benefit: OrganizationBenefit) => {
    setEditingBenefit(benefit);
    setAddBenefitModalOpen(true);
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organization_benefits')
        .delete()
        .eq('id', benefitId);

      if (error) throw error;

      setBenefits(benefits.filter(b => b.id !== benefitId));
      router.refresh();
    } catch (err) {
      console.error('Error deleting benefit:', err);
    }
  };

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
    if (min && max) {
      return `$${min.toLocaleString()}-${max.toLocaleString()}/${currency === 'USD' ? 'Mth' : currency}`;
    }
    if (min) return `$${min.toLocaleString()}+/${currency === 'USD' ? 'Mth' : currency}`;
    return null;
  };

  const activeVacancies = vacancies.filter(v => v.is_active);

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-luna-bg-secondary min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* ═══════════ COMPANY BANNER SECTION ═══════════ */}
        <div className="relative w-full h-64 bg-luna-gray-100 rounded-lg overflow-hidden mb-6">
          {organization.cover_image_url ? (
            <img
              src={organization.cover_image_url}
              alt="Company banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
              <Camera className="w-12 h-12 text-luna-gray-400 mb-2" />
              <p className="text-luna-gray-600 font-medium">Add a company banner</p>
              <p className="text-luna-gray-500 text-sm mt-1">Add a banner that reflects the personality of your company</p>
            </div>
          )}
          <button
            onClick={() => setUploadBannerModalOpen(true)}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit Banner
          </button>
        </div>

        {/* ═══════════ COMPANY LOGO AND METRICS SECTION ═══════════ */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Logo */}
            <div className="relative">
              <div
                className="cursor-pointer group relative"
                onClick={() => setUploadLogoModalOpen(true)}
                title="Click to change logo"
              >
                <LunaAvatar
                  src={organization.logo_url || undefined}
                  alt={organization.name}
                  fallback={getInitials(organization.name)}
                  size="xl"
                  className="w-32 h-32 border-4 border-white shadow-lg bg-white rounded-full"
                />
                <div className="absolute bottom-0 right-0 bg-luna-blue rounded-full p-2 shadow-md border-2 border-white">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Company Metrics */}
            <div className="flex-1 flex flex-wrap items-center gap-6 md:gap-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-luna-blue/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-luna-blue" />
                </div>
                <div>
                  <p className="text-xs text-luna-gray-500 font-medium">Industry</p>
                  <p className="text-sm font-semibold text-luna-gray-900">{getIndustryLabel(organization.industry)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-luna-blue/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-luna-blue" />
                </div>
                <div>
                  <p className="text-xs text-luna-gray-500 font-medium">Company Size</p>
                  <p className="text-sm font-semibold text-luna-gray-900">{getOrganizationSizeLabel(organization.organization_size)}</p>
                </div>
              </div>

              {organization.founded_year && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-luna-blue/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-luna-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-500 font-medium">Founded</p>
                    <p className="text-sm font-semibold text-luna-gray-900">{organization.founded_year}</p>
                  </div>
                </div>
              )}

              <div className="ml-auto">
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="p-2 hover:bg-luna-gray-100 rounded-lg transition-colors"
                  title="Edit company info"
                >
                  <Pencil className="w-4 h-4 text-luna-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ COMPANY DESCRIPTION AND CONTACT SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard className="mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-luna-gray-900">{organization.name}</h2>
              <button
                onClick={() => setEditBioModalOpen(true)}
                className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                title="Edit description"
              >
                <Pencil className="w-4 h-4 text-luna-gray-600" />
              </button>
            </div>

            {/* Description */}
            {organization.bio || organization.description ? (
              <p className="text-luna-gray-700 leading-relaxed mb-6">
                {organization.bio || organization.description}
              </p>
            ) : (
              <p className="text-luna-gray-400 italic mb-6">No company description added yet.</p>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-luna-border-light">
              {organization.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-luna-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-luna-gray-500">Phone</p>
                    <a href={`tel:${organization.contact_phone}`} className="text-sm text-luna-gray-900 hover:text-luna-blue transition-colors">
                      {organization.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {organization.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-luna-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-luna-gray-500">Email</p>
                    <a href={`mailto:${organization.contact_email}`} className="text-sm text-luna-gray-900 hover:text-luna-blue transition-colors">
                      {organization.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {organization.website_url && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-luna-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-luna-gray-500">Website</p>
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-luna-gray-900 hover:text-luna-blue transition-colors"
                    >
                      {organization.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-luna-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-luna-gray-500">Location</p>
                  <p className="text-sm text-luna-gray-900">{formatLocation()}</p>
                </div>
              </div>
            </div>
          </div>
        </LunaCard>

        {/* ═══════════ PROFILE VISIBILITY SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isProfileVisible ? (
                  <Eye className="w-5 h-5 text-luna-gray-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-luna-gray-400" />
                )}
                <div>
                  <h3 className="text-base font-semibold text-luna-gray-900">Profile Visibility</h3>
                  <p className="text-sm text-luna-gray-500 mt-0.5">
                    {isProfileVisible ? 'Visible to prospects' : 'Hidden from prospects'}
                  </p>
                </div>
              </div>
              <LunaSwitch
                checked={isProfileVisible}
                onCheckedChange={setIsProfileVisible}
              />
            </div>
          </div>
        </LunaCard>

        {/* ═══════════ SKILLS SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-luna-gray-900 mb-1">Skills</h3>
                <p className="text-sm text-luna-gray-500">Add the list of skills required to work for your company</p>
              </div>
              <LunaButton
                onClick={() => setManageSkillsModalOpen(true)}
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Add / Edit
              </LunaButton>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((orgSkill) => (
                  <LunaBadge key={orgSkill.id} variant="primary">
                    {orgSkill.skills.name}
                  </LunaBadge>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Briefcase}
                title="No skills added"
                description="Add skills to help candidates understand what you're looking for"
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ COMPANY BENEFITS SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-luna-gray-900 mb-1">Company Benefits</h3>
                <p className="text-sm text-luna-gray-500">Add the list of benefits your company offers employees</p>
              </div>
              <LunaButton
                onClick={handleOpenAddBenefit}
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Add / Edit
              </LunaButton>
            </div>
            {benefits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <LunaBadge
                    key={benefit.id}
                    variant="default"
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer hover:bg-luna-gray-200 transition-colors"
                    onClick={() => handleEditBenefit(benefit)}
                  >
                    {benefit.benefit_name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBenefit(benefit.id);
                      }}
                      className="hover:bg-luna-gray-300 rounded-sm p-0.5 transition-colors"
                      aria-label="Remove benefit"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </LunaBadge>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Award}
                title="No benefits added"
                description="Add company benefits to attract top talent"
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ AVAILABLE JOBS SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard>
          <div className="p-6">
            <h3 className="text-base font-semibold text-luna-gray-900 mb-4">Available Jobs</h3>
            {activeVacancies.length > 0 ? (
              <div className="space-y-3">
                {activeVacancies.map((vacancy) => {
                  const salary = formatSalary(vacancy);
                  const location = vacancy.is_remote
                    ? 'Remote'
                    : vacancy.work_location || formatLocation();
                  const employmentType = vacancy.employment_type
                    ? vacancy.employment_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : 'Full Time';

                  return (
                    <div
                      key={vacancy.id}
                      className="flex items-center gap-4 p-4 border border-luna-border-light rounded-lg hover:border-luna-blue/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-luna-gray-100 flex items-center justify-center shrink-0">
                        <Briefcase className="w-6 h-6 text-luna-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-luna-gray-900 mb-1">{vacancy.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-luna-gray-600">
                          <span>{location}</span>
                          <span className="text-luna-gray-300">•</span>
                          <span>{employmentType}</span>
                          {salary && (
                            <>
                              <span className="text-luna-gray-300">•</span>
                              <span className="font-medium text-luna-gray-900">{salary}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <LunaButton
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/u/jobs/${vacancy.id}`)}
                      >
                        View
                      </LunaButton>
                    </div>
                  );
                })}
              </div>
            ) : (
              <LunaEmptyState
                icon={Briefcase}
                title="No active jobs"
                description="Create job postings to attract candidates"
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* Modals */}
        <UploadOrganizationLogoModal
          open={uploadLogoModalOpen}
          onOpenChange={setUploadLogoModalOpen}
          onSuccess={handleUploadLogoSuccess}
          currentLogoUrl={organization.logo_url}
          organizationId={organization.id}
        />
        <UploadOrganizationBannerModal
          open={uploadBannerModalOpen}
          onOpenChange={setUploadBannerModalOpen}
          onSuccess={handleUploadBannerSuccess}
          currentBannerUrl={organization.cover_image_url}
          organizationId={organization.id}
        />
        <EditOrganizationProfileModal
          open={editProfileModalOpen}
          onOpenChange={setEditProfileModalOpen}
          organization={organization}
          slug={slug}
          onSuccess={handleRefresh}
        />
        <EditOrganizationBioModal
          open={editBioModalOpen}
          onOpenChange={setEditBioModalOpen}
          currentBio={organization.bio || organization.description}
          slug={slug}
          onSuccess={handleRefresh}
        />
        <ManageOrganizationSkillsModal
          open={manageSkillsModalOpen}
          onOpenChange={setManageSkillsModalOpen}
          organizationId={organization.id}
          initialSkills={skills}
          onSuccess={() => {
            handleRefresh();
            // Skills will be refreshed from server
          }}
        />
        <AddBenefitModal
          open={addBenefitModalOpen}
          onOpenChange={(open) => {
            setAddBenefitModalOpen(open);
            if (!open) setEditingBenefit(null);
          }}
          organizationId={organization.id}
          benefit={editingBenefit}
          onSuccess={() => {
            handleRefresh();
            // Benefits will be refreshed from server
          }}
        />
      </div>
    </div>
  );
}
