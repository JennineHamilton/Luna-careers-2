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
  Lightbulb,
} from 'lucide-react';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaCard } from '@/components/luna/card';
import { LunaSwitch } from '@/components/luna/switch';
import { LunaEmptyState } from '@/components/luna/empty-state';
import { LunaSectionLabel } from '@/components/luna/section-label';
import {
  UploadOrganizationLogoModal,
  UploadOrganizationBannerModal,
  EditOrganizationProfileModal,
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

  // Sync skills and benefits from props when server data changes
  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  useEffect(() => {
    setBenefits(initialBenefits);
  }, [initialBenefits]);

  // Modal states
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [uploadLogoModalOpen, setUploadLogoModalOpen] = useState(false);
  const [uploadBannerModalOpen, setUploadBannerModalOpen] = useState(false);
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

  const handleSkillsUpdate = async () => {
    try {
      const supabase = createClient();
      const { data: updatedSkills, error } = await supabase
        .from('organization_skills')
        .select(`
          *,
          skills (*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (updatedSkills) {
        setSkills(updatedSkills as OrganizationSkill[]);
      }
      router.refresh();
    } catch (err) {
      console.error('Error fetching updated skills:', err);
      // Still refresh to get data eventually
      router.refresh();
    }
  };

  const handleBenefitsUpdate = async () => {
    try {
      const supabase = createClient();
      const { data: updatedBenefits, error } = await supabase
        .from('organization_benefits')
        .select('*')
        .eq('organization_id', organization.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (updatedBenefits) {
        setBenefits(updatedBenefits as OrganizationBenefit[]);
      }
      router.refresh();
    } catch (err) {
      console.error('Error fetching updated benefits:', err);
      // Still refresh to get data eventually
      router.refresh();
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
        {/* ═══════════ HEADER CONTENT CARD (Banner + Logo + Info) ═══════════ */}
        <LunaCard
          padding="none"
          className="border border-luna-border-light rounded-lg rounded-b-none overflow-hidden border-b-[#E4E7EC]"
        >
          {/* Banner */}
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
              <div className="w-full h-full rounded-md flex min-h-0">
                <LunaEmptyState
                  icon={Camera}
                  title="Add a company banner"
                  description="Add a banner that reflects the personality of your company"
                  size="sm"
                  showBackground
                  iconBackground="gray"
                  className="w-full h-full min-h-0"
                />
              </div>
            )}
            <button
              onClick={() => setUploadBannerModalOpen(true)}
              className="absolute top-6 right-6 bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit Banner
            </button>

            {/* Logo positioned 70% inside banner, 30% bleeding out */}
            <div className="absolute left-[49px] bottom-0 translate-y-[40%]">
              <div
                className="cursor-pointer group relative flex items-center justify-center w-[138px] h-[138px] rounded-full bg-white p-[5px] shadow-lg"
                onClick={() => setUploadLogoModalOpen(true)}
                title="Click to change logo"
              >
                <LunaAvatar
                  src={organization.logo_url || undefined}
                  alt={organization.name}
                  fallback={getInitials(organization.name)}
                  size="xl"
                  className="w-32 h-32 shrink-0 rounded-full overflow-hidden border border-luna-border-default bg-white"
                />
                <div className="absolute bottom-0 right-0 bg-luna-blue rounded-full p-2 shadow-md border-2 border-white">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 pt-20 pb-6">
            {/* Metrics inline row */}
            <div className="flex flex-wrap items-center gap-6 md:gap-10">
              {/* Industry */}
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

              {/* Company Size */}
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

              {/* Founded Year */}
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

              {/* Edit Button */}
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

            {/* Separator */}
            <div className="h-px bg-luna-border-default my-6" />

            {/* Organization name + description */}
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

            {/* Contact info */}
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

        {/* ═══════════ PROFILE VISIBILITY SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard padding="none" className="rounded-t-none border-t-0 mb-6">
          <div className="p-6">
            <h3 className="text-sm font-medium text-luna-gray-900 mb-2">Profile Visibility</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-luna-gray-100 flex items-center justify-center shrink-0">
                  {isProfileVisible ? (
                    <Eye className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  ) : (
                    <EyeOff className="w-4 h-4 text-luna-gray-600" strokeWidth={1} />
                  )}
                </div>
                <p className="text-xs text-luna-gray-500 font-medium">
                  {isProfileVisible ? 'Visible to Visitors' : 'Not Visible to Visitors'}
                </p>
              </div>
              <LunaSwitch
                checked={isProfileVisible}
                onCheckedChange={setIsProfileVisible}
              />
            </div>
          </div>
        </LunaCard>

        {/* ═══════════ SKILLS SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard padding="none" className="mb-6">
          <div className="p-6">
            <LunaSectionLabel
              label="Skills"
              className="mb-2"
              action={
                skills.length > 0 ? (
                  <button
                    onClick={() => setManageSkillsModalOpen(true)}
                    className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                  >
                    <Plus className="w-4 h-4 mr-1 text-luna-gray-600" />
                    <span className="text-luna-gray-600">Add / Edit</span>
                  </button>
                ) : undefined
              }
            />
            <p className="text-sm text-luna-gray-600 mb-4">
              Add the list of skills required to work for your company
            </p>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((orgSkill) => (
                  <span
                    key={orgSkill.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-luna-gray-700 bg-blue-50 hover:bg-blue-100 transition-colors"
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
                title="Add your skills"
                description="Add the list of skills required to work for your company"
                onClick={() => setManageSkillsModalOpen(true)}
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ COMPANY BENEFITS SECTION (FULL-WIDTH CARD) ═══════════ */}
        <LunaCard padding="none" className="mb-6">
          <div className="p-6">
            <LunaSectionLabel
              label="Company Benefits"
              className="mb-2"
              action={
                benefits.length > 0 ? (
                  <button
                    onClick={handleOpenAddBenefit}
                    className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                  >
                    <Plus className="w-4 h-4 mr-1 text-luna-gray-600" />
                    <span className="text-luna-gray-600">Add</span>
                  </button>
                ) : undefined
              }
            />
            <p className="text-sm text-luna-gray-600 mb-4">
              Add the list of benefits your company offers employees
            </p>
            {benefits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <span
                    key={benefit.id}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm text-luna-gray-700 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleEditBenefit(benefit)}
                  >
                    {benefit.benefit_name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBenefit(benefit.id);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label="Remove benefit"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45 text-luna-gray-500" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Award}
                iconBackground="blue"
                showBackground
                title="Add company benefits"
                description="Add the list of benefits your company offers employees"
                onClick={handleOpenAddBenefit}
                size="sm"
              />
            )}
          </div>
        </LunaCard>

        {/* ═══════════ AVAILABLE JOBS SECTION (FULL-WIDTH CARD) ═══════════ */}
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

                  return (
                    <div key={vacancy.id}>
                      <div className="flex items-center gap-4 py-4">
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
                      </div>
                      {index < activeVacancies.length - 1 && (
                        <div className="h-px bg-luna-border-default" />
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
          slug={slug}
        />
        <EditOrganizationProfileModal
          open={editProfileModalOpen}
          onOpenChange={setEditProfileModalOpen}
          organization={organization}
          slug={slug}
          onSuccess={handleRefresh}
        />
        <ManageOrganizationSkillsModal
          open={manageSkillsModalOpen}
          onOpenChange={setManageSkillsModalOpen}
          organizationId={organization.id}
          initialSkills={skills}
          onSuccess={handleSkillsUpdate}
        />
        <AddBenefitModal
          open={addBenefitModalOpen}
          onOpenChange={(open) => {
            setAddBenefitModalOpen(open);
            if (!open) setEditingBenefit(null);
          }}
          organizationId={organization.id}
          benefit={editingBenefit}
          onSuccess={handleBenefitsUpdate}
        />
      </div>
    </div>
  );
}
