'use client';

import { useState } from 'react';
import { Building2, MapPin, Globe, Mail, Phone, Calendar, Users, Briefcase, Award, Plus, Pencil, Trash2 } from 'lucide-react';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationSkill = Database['public']['Tables']['organization_skills']['Row'] & {
  skills: Database['public']['Tables']['skills']['Row'];
};
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

interface OrganizationProfileClientProps {
  organization: Organization;
  initialSkills: OrganizationSkill[];
  initialBenefits: OrganizationBenefit[];
  slug: string;
}

export function OrganizationProfileClient({
  organization,
  initialSkills,
  initialBenefits,
  slug,
}: OrganizationProfileClientProps) {
  const [skills, setSkills] = useState<OrganizationSkill[]>(initialSkills);
  const [benefits, setBenefits] = useState<OrganizationBenefit[]>(initialBenefits);

  // Modal states
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [uploadLogoModalOpen, setUploadLogoModalOpen] = useState(false);
  const [uploadBannerModalOpen, setUploadBannerModalOpen] = useState(false);
  const [editBioModalOpen, setEditBioModalOpen] = useState(false);
  const [manageSkillsModalOpen, setManageSkillsModalOpen] = useState(false);
  const [addBenefitModalOpen, setAddBenefitModalOpen] = useState(false);

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
      startup: '1-10 employees',
      small: '11-50 employees',
      medium: '51-200 employees',
      large: '201-1000 employees',
      enterprise: '1000+ employees',
    };
    return sizeMap[size] || size;
  };

  return (
    <div className="space-y-6">
      {/* Profile Banner */}
      <div className="relative h-48 bg-gradient-to-r from-purple-500 to-blue-500 -mx-4 md:-mx-6">
        {organization.cover_image_url && (
          <img
            src={organization.cover_image_url}
            alt="Company banner"
            className="w-full h-full object-cover"
          />
        )}
        <button
          onClick={() => setUploadBannerModalOpen(true)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit Banner
        </button>
      </div>

      {/* Profile Header */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex items-start gap-6 -mt-16">
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
                className="w-32 h-32 border-4 border-white shadow-lg bg-white"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                <Pencil className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="flex-1 mt-16">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-lg text-gray-600 mt-1">{getIndustryLabel(organization.industry)}</p>
              </div>
              <LunaButton
                onClick={() => setEditProfileModalOpen(true)}
                variant="outline"
                icon={<Pencil className="w-4 h-4" />}
              >
                Edit Profile
              </LunaButton>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{formatLocation()}</span>
              </div>
              {organization.founded_year && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Founded {organization.founded_year}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{getOrganizationSizeLabel(organization.organization_size)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-6 space-y-8">
        {/* About Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">About</h2>
            <LunaButton
              onClick={() => setEditBioModalOpen(true)}
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
            >
              Edit
            </LunaButton>
          </div>
          {organization.bio ? (
            <p className="text-gray-700 leading-relaxed">{organization.bio}</p>
          ) : (
            <p className="text-gray-400 italic">No company bio added yet.</p>
          )}
        </div>

        {/* Company Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Website */}
            {organization.website_url && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <a
                    href={organization.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {organization.website_url}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {organization.contact_email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a href={`mailto:${organization.contact_email}`} className="text-blue-600 hover:underline">
                    {organization.contact_email}
                  </a>
                </div>
              </div>
            )}

            {/* Phone */}
            {organization.contact_phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <a href={`tel:${organization.contact_phone}`} className="text-blue-600 hover:underline">
                    {organization.contact_phone}
                  </a>
                </div>
              </div>
            )}

            {/* Industry */}
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Industry</p>
                <p className="text-gray-900">{getIndustryLabel(organization.industry)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Required Skills</h2>
            <LunaButton
              onClick={() => setManageSkillsModalOpen(true)}
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Manage Skills
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
            <p className="text-gray-400 italic">No required skills added yet.</p>
          )}
        </div>

        {/* Company Benefits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Company Benefits</h2>
            <LunaButton
              onClick={() => setAddBenefitModalOpen(true)}
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Benefit
            </LunaButton>
          </div>
          {benefits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">{benefit.benefit_name}</h3>
                        {benefit.description && (
                          <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Implement delete benefit
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No company benefits added yet.</p>
          )}
        </div>
      </div>

      {/* TODO: Add modals */}
    </div>
  );
}

