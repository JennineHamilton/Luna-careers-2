'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AddExperienceModal,
  AddEducationModal,
  AddCertificationModal,
  AddLanguageModal,
  EditProfileModal,
  AddVideoModal,
  AddSkillsModal,
  UploadAvatarModal,
} from '@/components/luna/modals';
import {
  Plus,
  Pen,
  Trash2,
  Video,
  Award,
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Linkedin,
  ExternalLink,
  X,
  CheckCircle2,
  Mail,
  Phone,
  Lightbulb,
  Upload,
  Camera,
} from 'lucide-react';
import type { Database } from '@/types/database.types';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';
import { PreScreeningReport } from '@/components/screening/pre-screening-report';
import { LunaSwitch } from '@/components/luna/switch';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { LunaToast, LunaToastProvider, LunaToastViewport } from '@/components/luna/toast';
import { LunaEmptyState } from '@/components/luna/empty-state';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type Profile = Database['public']['Tables']['users']['Row'];
type ProfessionalExperience = Database['public']['Tables']['professional_experience']['Row'];
type Education = Database['public']['Tables']['education']['Row'];
type Certification = Database['public']['Tables']['certifications']['Row'];
type UserLanguage = Database['public']['Tables']['user_languages']['Row'];
type VerificationStatus = Database['public']['Enums']['verification_status'];

interface ProfileClientProps {
  profile: Profile | null;
  experiences: ProfessionalExperience[];
  education: Education[];
  certifications: Certification[];
  languages: UserLanguage[];
  userSkills: any[];
  verifiedSkills: any[];
}

/* ── Removed sf() helper - now using Tailwind classes for consistent font rendering ── */

const formatEducationLevel = (level: string) => {
  const levelMap: Record<string, string> = {
    high_school: 'High School Diploma',
    associate: 'Associate Degree',
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: 'PhD / Doctorate',
  };
  return levelMap[level] || level;
};



function getStatusBadge(status: VerificationStatus) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium';
  switch (status) {
    case 'verified':
      return <span className={`${base} bg-emerald-50 text-emerald-700`}><CheckCircle className="w-3 h-3" />Verified</span>;
    case 'pending':
      return <span className={`${base} bg-amber-50 text-amber-700`}><Clock className="w-3 h-3" />Pending</span>;
    case 'rejected':
      return <span className={`${base} bg-red-50 text-red-600`}><XCircle className="w-3 h-3" />Rejected</span>;
    default:
      return null;
  }
}

export function ProfileClient({
  profile,
  experiences: initialExperiences,
  education: initialEducation,
  certifications: initialCertifications,
  languages: initialLanguages,
  userSkills: initialUserSkills,
  verifiedSkills: initialVerifiedSkills,
}: ProfileClientProps) {
  const router = useRouter();

  // Modal states
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [certificationModalOpen, setCertificationModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Edit states
  const [editingExperience, setEditingExperience] = useState<ProfessionalExperience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);

  // Loading state for destructive actions
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Accordion state for experience items
  const [expandedExperiences, setExpandedExperiences] = useState<Set<string>>(new Set());

  // Toast feedback state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastDescription, setToastDescription] = useState('');

  // Confirmation dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'experience' | 'education' | 'certification' | 'video'; id: string } | null>(null);

  // Profile visibility toggle
  const [isProfileVisible, setIsProfileVisible] = useState(true);

  const handleRefresh = () => router.refresh();

  const showToast = (variant: 'success' | 'error', title: string, description: string) => {
    setToastVariant(variant);
    setToastTitle(title);
    setToastDescription(description);
    setToastOpen(true);
  };

  const toggleExperience = (id: string) => {
    setExpandedExperiences(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');

  const handleDelete = async (type: 'experience' | 'education' | 'certification', id: string) => {
    setDeletingId(id);
    const urlMap = {
      experience: `/api/user/professional-experience/${id}`,
      education: `/api/user/education/${id}`,
      certification: `/api/user/certifications/${id}`,
    };
    try {
      const response = await fetch(urlMap[type], { method: 'DELETE' });
      if (response.ok) {
        showToast('success', 'Deleted!', `Your ${type} has been removed.`);
        handleRefresh();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      showToast('error', 'Failed to delete', `There was an error deleting this ${type}.`);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleToggleVisibility = async (type: 'experience' | 'education' | 'certification', id: string, currentlyHidden: boolean) => {
    setDeletingId(id); // Reuse this state for loading indicator
    const urlMap = {
      experience: `/api/user/professional-experience/${id}`,
      education: `/api/user/education/${id}`,
      certification: `/api/user/certifications/${id}`,
    };

    try {
      const response = await fetch(urlMap[type], {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: !currentlyHidden }),
      });

      if (response.ok) {
        showToast('success', currentlyHidden ? 'Shown!' : 'Hidden!', `Your ${type} has been ${currentlyHidden ? 'shown on' : 'hidden from'} your profile.`);
        handleRefresh();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error(`Failed to update visibility for ${type}:`, error);
      showToast('error', 'Failed to update', `There was an error updating the visibility.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteVideo = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intro_video_url: null }),
      });
      if (response.ok) {
        showToast('success', 'Video deleted!', 'Your intro video has been removed.');
        handleRefresh();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      showToast('error', 'Failed to delete', 'There was an error deleting your video.');
    } finally {
      setConfirmDelete(null);
    }
  };



  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-luna-bg-secondary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">

        {/* ═══════════ LEFT CONTENT CARD (was right) ═══════════ */}
          <div>
            <div className="border border-luna-border-light rounded-lg bg-white shadow-luna-sm">
              <div style={{ padding: 25 }}>

                {/* ── Bio / About Me Section (with Avatar, Name, Profession, Contact) ── */}
                <div className="mb-6">
                  {/* Avatar + Name + Profession + Contact Info + Edit */}
                  <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div className="shrink-0 relative">
                      <div
                        title="Click to upload/change profile image"
                        className="rounded-lg flex items-center justify-center overflow-hidden cursor-pointer group relative bg-luna-gray-100 border border-luna-border-light transition-all hover:border-luna-blue hover:bg-luna-blue/5"
                        style={{ width: 80, height: 80 }}
                        onClick={() => setAvatarModalOpen(true)}
                      >
                        {profile?.avatar_url ? (
                          <>
                            <img src={profile.avatar_url} alt={`${profile?.first_name} ${profile?.last_name}`} className="w-full h-full object-cover rounded-lg" />
                            {/* Hover overlay with camera icon */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-luna-gray-600 text-lg font-semibold">{getInitials(`${profile?.first_name} ${profile?.last_name}`)}</span>
                            {/* Edit icon overlay */}
                            <div className="absolute bottom-0 right-0 bg-luna-blue rounded-full p-1.5 shadow-md">
                              <Pen className="h-3 w-3 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                      {/* Verified badge */}
                      {profile?.email_verified && (
                        <div className="absolute rounded-full flex items-center justify-center bg-white shadow-md" style={{ width: 25, height: 25, bottom: -5, right: -5 }}>
                          <div className="rounded-full flex items-center justify-center bg-gradient-to-b from-green-500 to-green-400" style={{ width: 19, height: 20 }}>
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Name + Profession + Contact Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name row with edit button and visibility switcher */}
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                          <h1 className="text-luna-gray-900 text-2xl font-bold">{profile?.first_name} {profile?.last_name}</h1>
                          <button
                            onClick={() => setEditProfileModalOpen(true)}
                            className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                            title="Edit profile"
                          >
                            <Pen className="h-3.5 w-3.5 text-luna-gray-600" />
                          </button>
                        </div>
                        {/* Profile Visibility Switcher - Reversed order */}
                        <div className="flex items-center gap-3">
                          <SwitchPrimitives.Root
                            checked={isProfileVisible}
                            onCheckedChange={setIsProfileVisible}
                            className="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-luna-blue data-[state=unchecked]:bg-luna-gray-300"
                          >
                            <SwitchPrimitives.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
                          </SwitchPrimitives.Root>
                          <label className="text-sm font-medium text-luna-gray-900 cursor-pointer" onClick={() => setIsProfileVisible(!isProfileVisible)}>
                            Visible to employers
                          </label>
                        </div>
                      </div>
                      {profile?.profession && (
                        <p className="text-luna-gray-600 mb-2 text-base">{profile.profession}</p>
                      )}
                      {/* Contact Information - Inline with dot separators */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-luna-gray-600 text-sm">
                        {profile?.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{profile.email}</span>
                          </div>
                        )}
                        {profile?.phone && (
                          <>
                            <span className="text-luna-gray-400">•</span>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{profile.phone}</span>
                            </div>
                          </>
                        )}
                        {location && (
                          <>
                            <span className="text-luna-gray-400">•</span>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{location}</span>
                            </div>
                          </>
                        )}
                        {profile?.linkedin_url && (
                          <>
                            <span className="text-luna-gray-400">•</span>
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-luna-blue hover:underline"
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                              <span>LinkedIn</span>
                            </a>
                          </>
                        )}
                        {profile?.portfolio_url && (
                          <>
                            <span className="text-luna-gray-400">•</span>
                            <a
                              href={profile.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-luna-blue hover:underline"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span>Portfolio</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-luna-border-default mb-6" />

                  {/* Bio Text - Display Only */}
                  <p
                    className="text-luna-gray-700 whitespace-pre-wrap text-sm"
                    style={{ lineHeight: '22px' }}
                  >
                    {profile?.bio || 'No bio added yet. Click the edit button above to introduce yourself to potential employers.'}
                  </p>
                </div>

                {/* ── Experience ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Professional Experience</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                    {initialExperiences.length > 0 && (
                      <button
                        onClick={() => { setEditingExperience(null); setExperienceModalOpen(true); }}
                        className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1 text-luna-gray-600" />
                        <span className="text-luna-gray-600">Add new</span>
                      </button>
                    )}
                  </div>
                  {initialExperiences.length === 0 ? (
                    <div className="cursor-pointer" onClick={() => { setEditingExperience(null); setExperienceModalOpen(true); }}>
                      <LunaEmptyState
                        icon={Briefcase}
                        iconBackground="blue"
                        showBackground
                        title="No experience added yet"
                        description="Click to add your professional experience"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {initialExperiences.map((exp) => {
                        const isExpanded = expandedExperiences.has(exp.id);
                        return (
                          <div key={exp.id} className="pb-3 pr-4 transition-all">
                            {/* Accordion Header - Vertically Centered */}
                            <div className="flex items-center gap-3">
                              {/* Icon Avatar */}
                              <div className="shrink-0 rounded flex items-center justify-center bg-luna-blue/10" style={{ width: 40, height: 40 }}>
                                <Briefcase className="h-5 w-5 text-luna-blue" />
                              </div>

                              {/* Job Title and Metadata */}
                              <div className="flex-1 min-w-0">
                                {/* Job Title with Edit/Delete */}
                                <div className="flex items-center gap-2 mb-1">
                                  <h4
                                    className="text-luna-blue cursor-pointer hover:underline text-base font-semibold"
                                    onClick={() => toggleExperience(exp.id)}
                                  >
                                    {exp.job_title}
                                  </h4>
                                  {exp.verification_status === 'verified' ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility('experience', exp.id, exp.is_hidden || false); }}
                                      disabled={deletingId === exp.id}
                                      className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                                      title={exp.is_hidden ? 'Show on profile' : 'Hide from profile'}
                                    >
                                      {deletingId === exp.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-luna-gray-600" />
                                      ) : exp.is_hidden ? (
                                        <Eye className="h-3.5 w-3.5 text-luna-gray-600" />
                                      ) : (
                                        <EyeOff className="h-3.5 w-3.5 text-luna-gray-600" />
                                      )}
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingExperience(exp); setExperienceModalOpen(true); }}
                                        className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                                      >
                                        <Pen className="h-3.5 w-3.5 text-luna-gray-600" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'experience', id: exp.id }); }}
                                        disabled={deletingId === exp.id}
                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                      >
                                        {deletingId === exp.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Company, Period, Location - Inline */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-luna-gray-600 text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{exp.company}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDateTime(exp.start_date, false)} - {exp.currently_working ? 'Present' : formatDateTime(exp.end_date || '', false)}</span>
                                  </div>
                                  {exp.location_country && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span>{exp.location_country}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Chevron */}
                              <button
                                onClick={() => toggleExperience(exp.id)}
                                className="shrink-0 p-1 hover:bg-luna-gray-200 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-luna-gray-600" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-luna-gray-600" />
                                )}
                              </button>
                            </div>

                            {/* Expanded Content - Description with left border (outside centered section) */}
                            {isExpanded && exp.description && (
                              <div className="mt-3 pl-4 border-l-2 border-luna-gray-300" style={{ marginLeft: '52px' }}>
                                <div
                                  className="text-luna-gray-700 space-y-1 text-sm"
                                  style={{ lineHeight: '22px' }}
                                  dangerouslySetInnerHTML={{
                                    __html: exp.description
                                      .split('\n')
                                      .filter(line => line.trim())
                                      .map(line => {
                                        const trimmed = line.trim();
                                        // If line starts with bullet point or dash, keep it
                                        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                                          return `<div class="flex gap-2"><span>•</span><span>${trimmed.replace(/^[•\-*]\s*/, '')}</span></div>`;
                                        }
                                        // Otherwise add bullet point
                                        return `<div class="flex gap-2"><span>•</span><span>${trimmed}</span></div>`;
                                      })
                                      .join('')
                                  }}
                                />
                              </div>
                            )}

                            {/* Rejection Reason (outside centered section) */}
                            {exp.verification_status === 'rejected' && exp.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]" style={{ marginLeft: '52px' }}>
                                <strong>Rejection Reason:</strong> {exp.rejection_reason}
                              </div>
                            )}
                          </div>
                        );
                        })}
                    </div>
                  )}
                </div>

                {/* ── Education & Trainings ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Education & Trainings</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                    {initialEducation.length > 0 && (
                      <button
                        onClick={() => { setEditingEducation(null); setEducationModalOpen(true); }}
                        className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1 text-luna-gray-600" />
                        <span className="text-luna-gray-600">Add new</span>
                      </button>
                    )}
                  </div>
                  {initialEducation.length === 0 ? (
                    <div className="cursor-pointer" onClick={() => { setEditingEducation(null); setEducationModalOpen(true); }}>
                      <LunaEmptyState
                        icon={GraduationCap}
                        iconBackground="blue"
                        showBackground
                        title="No education added yet"
                        description="Click to add your educational background"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {initialEducation.map((edu) => (
                        <div key={edu.id} className="pb-3 pr-4 transition-colors">
                          {/* Header - Vertically Centered */}
                          <div className="flex items-center gap-3">
                            {/* Icon Avatar */}
                            <div className="shrink-0 rounded flex items-center justify-center bg-luna-blue/10" style={{ width: 40, height: 40 }}>
                              <GraduationCap className="h-5 w-5 text-luna-blue" />
                            </div>

                            {/* Institution Name and Degree */}
                            <div className="flex-1 min-w-0">
                              {/* Institution Name with Edit/Delete */}
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-luna-gray-900 text-base font-semibold">{edu.institution}</h4>
                                {edu.verification_status === 'verified' ? (
                                  <button
                                    onClick={() => handleToggleVisibility('education', edu.id, edu.is_hidden || false)}
                                    disabled={deletingId === edu.id}
                                    className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                                    title={edu.is_hidden ? 'Show on profile' : 'Hide from profile'}
                                  >
                                    {deletingId === edu.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-luna-gray-600" />
                                    ) : edu.is_hidden ? (
                                      <Eye className="h-3.5 w-3.5 text-luna-gray-600" />
                                    ) : (
                                      <EyeOff className="h-3.5 w-3.5 text-luna-gray-600" />
                                    )}
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => { setEditingEducation(edu); setEducationModalOpen(true); }}
                                      className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                                    >
                                      <Pen className="h-3.5 w-3.5 text-luna-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: 'education', id: edu.id })}
                                      disabled={deletingId === edu.id}
                                      className="p-1 hover:bg-red-50 rounded transition-colors"
                                    >
                                      {deletingId === edu.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Degree and Field of Study */}
                              <p className="text-luna-gray-700 text-sm">
                                {formatEducationLevel(edu.education_level)} • {edu.field_of_study}
                              </p>
                            </div>
                          </div>

                          {/* Period (outside centered section) */}
                          <div className="mt-2 flex items-center gap-1.5 text-luna-gray-600 text-sm" style={{ marginLeft: '52px' }}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateTime(edu.start_date, false)} - {edu.currently_enrolled ? 'Present' : formatDateTime(edu.end_date || '', false)}</span>
                          </div>

                          {/* Rejection Reason (outside centered section) */}
                          {edu.verification_status === 'rejected' && edu.rejection_reason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]" style={{ marginLeft: '52px' }}>
                              <strong>Rejection:</strong> {edu.rejection_reason}
                            </div>
                          )}
                        </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* ── Certifications ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Certifications</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                    {initialCertifications.length > 0 && (
                      <button
                        onClick={() => { setEditingCertification(null); setCertificationModalOpen(true); }}
                        className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1 text-luna-gray-600" />
                        <span className="text-luna-gray-600">Add new</span>
                      </button>
                    )}
                  </div>
                  {initialCertifications.length === 0 ? (
                    <div className="cursor-pointer" onClick={() => { setEditingCertification(null); setCertificationModalOpen(true); }}>
                      <LunaEmptyState
                        icon={Award}
                        iconBackground="blue"
                        showBackground
                        title="No certifications added yet"
                        description="Click to add your certifications"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-4">
                        {initialCertifications.map((cert) => (
                          <CarouselItem key={cert.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 min-w-0">
                            <div className="group/card max-w-[320px] mx-auto">
                              {/* Certificate Card */}
                              <div className="bg-white border border-luna-border-default rounded-lg hover:shadow-luna-md hover:-translate-y-1 transition-all duration-300 p-[5px]">
                                {/* Certificate Image */}
                                <div className="relative bg-gradient-to-br from-luna-gray-50 to-luna-gray-100 h-[160px] flex items-center justify-center overflow-hidden rounded-md">
                                  {cert.certificate_file_url ? (
                                    <img
                                      src={cert.certificate_file_url}
                                      alt={cert.certification_title}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-luna-gray-400">
                                      <Award className="h-12 w-12 mb-2" />
                                      <span className="text-xs">No certificate image</span>
                                    </div>
                                  )}

                                  {/* Hover Overlay with Actions */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                    {cert.verification_status === 'verified' ? (
                                      <button
                                        onClick={() => handleToggleVisibility('certification', cert.id, cert.is_hidden || false)}
                                        disabled={deletingId === cert.id}
                                        className="p-2 bg-white rounded-full hover:bg-luna-gray-100 transition-colors"
                                        title={cert.is_hidden ? 'Show on profile' : 'Hide from profile'}
                                      >
                                        {deletingId === cert.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-luna-gray-700" />
                                        ) : cert.is_hidden ? (
                                          <Eye className="h-4 w-4 text-luna-gray-700" />
                                        ) : (
                                          <EyeOff className="h-4 w-4 text-luna-gray-700" />
                                        )}
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => { setEditingCertification(cert); setCertificationModalOpen(true); }}
                                          className="p-2 bg-white rounded-full hover:bg-luna-gray-100 transition-colors"
                                          title="Edit"
                                        >
                                          <Pen className="h-4 w-4 text-luna-gray-700" />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDelete({ type: 'certification', id: cert.id })}
                                          disabled={deletingId === cert.id}
                                          className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                                          title="Delete"
                                        >
                                          {deletingId === cert.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                          ) : (
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Status Badge */}
                                  <div className="absolute top-2 right-2">
                                    {getStatusBadge(cert.verification_status || 'pending')}
                                  </div>
                                </div>

                                {/* Certificate Info */}
                                <div className="p-4">
                                  <h4 className="text-luna-gray-900 font-semibold text-base mb-2 line-clamp-2">
                                    {cert.certification_title}
                                  </h4>

                                  <div className="flex items-center gap-1.5 text-luna-gray-600 mb-2 text-sm">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{cert.issuing_organization}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-luna-gray-600 text-sm">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs">Issued {formatDateTime(cert.issue_date, false)}</span>
                                  </div>

                                  {cert.certificate_id && (
                                    <p className="text-luna-gray-500 text-xs mt-2 truncate">
                                      ID: {cert.certificate_id}
                                    </p>
                                  )}

                                  {cert.verification_status === 'rejected' && cert.rejection_reason && (
                                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
                                      <strong>Rejected:</strong> {cert.rejection_reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="hidden sm:flex -left-4" />
                      <CarouselNext className="hidden sm:flex -right-4" />
                    </Carousel>
                  )}
                </div>

                {/* ── Pre-screening Report ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Pre-screening Report</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                  </div>
                  <PreScreeningReport />
                </div>

              </div>{/* end padding */}
            </div>{/* end card */}
          </div>{/* end left content wrapper */}

          {/* ═══════════ RIGHT SIDEBAR (was left) ═══════════ */}
          <div>
            <div className="border border-luna-border-light rounded-lg bg-white shadow-luna-sm">
              <div style={{ padding: 25 }}>

                {/* ── Intro Video ── */}
                <div className="mb-6">
                  {profile?.intro_video_url ? (
                    <div>
                      <div className="rounded-lg overflow-hidden border border-luna-border-light mb-2 bg-black">
                        <video src={profile.intro_video_url} controls className="w-full" style={{ height: 200, objectFit: 'contain' }} preload="metadata" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setVideoModalOpen(true)} className="text-luna-gray-600 hover:text-luna-gray-900 text-xs">Replace</button>
                        <span className="text-luna-gray-300">|</span>
                        <button onClick={() => setConfirmDelete({ type: 'video', id: '' })} className="text-red-600 hover:text-red-700 text-xs">Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <LunaEmptyState
                        icon={Video}
                        iconBackground="blue"
                        showBackground
                        title="Add an introduction video"
                        description="Record or upload a 30-60 second video introducing yourself"
                        onClick={() => setVideoModalOpen(true)}
                        size="sm"
                      />
                      <div className="mt-4">
                        <p className="text-luna-gray-600 mb-2 text-xs">Tips for a great introduction:</p>
                        <ul className="text-luna-gray-600 space-y-0 pl-4 text-xs list-disc">
                          <li>Keep it brief (30-60 seconds)</li>
                          <li>Mention your name and career goals</li>
                          <li>Highlight your key skills and strengths</li>
                          <li>Speak clearly and maintain eye contact</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Languages ── */}
                <div data-section="languages" className="mb-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Languages</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                    {initialLanguages.length > 0 && (
                      <button
                        onClick={() => setLanguageModalOpen(true)}
                        className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1 text-luna-gray-600" />
                        <span className="text-luna-gray-600">Add / Edit</span>
                      </button>
                    )}
                  </div>
                  {initialLanguages.length > 0 ? (
                    <div className="space-y-3">
                      {initialLanguages.map((lang) => (
                        <div key={lang.id} className="flex items-center justify-between">
                          <p className="text-luna-gray-900 text-sm">{lang.language_name}</p>
                          <p className="text-luna-gray-600 capitalize text-xs">{lang.proficiency_level?.replace(/_/g, ' ')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <LunaEmptyState
                      icon={Globe}
                      iconBackground="blue"
                      showBackground
                      title="Add languages"
                      description="Showcase the languages you speak and your proficiency level"
                      onClick={() => setLanguageModalOpen(true)}
                      size="sm"
                    />
                  )}
                </div>

                {/* ── Skills ── */}
                <div data-section="skills" className="mb-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="text-luna-gray-900 whitespace-nowrap text-sm font-semibold">Skills</h3>
                    <div className="flex-1 h-px bg-luna-gray-200" />
                    {(initialUserSkills.length > 0 || initialVerifiedSkills.length > 0) && (
                      <button
                        onClick={() => setSkillsModalOpen(true)}
                        className="inline-flex items-center bg-white border border-luna-border-default rounded-md h-7 px-2 hover:bg-luna-gray-50 transition-colors text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1 text-luna-gray-600" />
                        <span className="text-luna-gray-600">Add / Edit</span>
                      </button>
                    )}
                  </div>
                  {(initialUserSkills.length > 0 || initialVerifiedSkills.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {initialVerifiedSkills.map((skill: any) => (
                        <span key={skill.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> {skill.skills.name}
                        </span>
                      ))}
                      {initialUserSkills.map((skill: any) => (
                        <span key={skill.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] bg-luna-blue/10 text-luna-blue border border-luna-blue/20">
                          {skill.skills.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <LunaEmptyState
                      icon={Lightbulb}
                      iconBackground="blue"
                      showBackground
                      title="Add your skills"
                      description="Showcase your technical and soft skills to stand out to employers"
                      onClick={() => setSkillsModalOpen(true)}
                      size="sm"
                    />
                  )}
                </div>

              </div>{/* end padding */}
            </div>{/* end sidebar card */}
          </div>{/* end sidebar col */}

        </div>{/* end flex row */}

      {/* Modals */}
      <AddExperienceModal
        open={experienceModalOpen}
        onOpenChange={setExperienceModalOpen}
        experience={editingExperience}
        onSuccess={handleRefresh}
      />
      <AddEducationModal
        open={educationModalOpen}
        onOpenChange={setEducationModalOpen}
        education={editingEducation}
        onSuccess={handleRefresh}
      />
      <AddCertificationModal
        open={certificationModalOpen}
        onOpenChange={setCertificationModalOpen}
        certification={editingCertification}
        onSuccess={handleRefresh}
      />
      <AddLanguageModal
        open={languageModalOpen}
        onOpenChange={setLanguageModalOpen}
        onSuccess={handleRefresh}
      />
      <EditProfileModal
        open={editProfileModalOpen}
        onOpenChange={setEditProfileModalOpen}
        profile={profile}
      />
      <AddVideoModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        onSuccess={handleRefresh}
      />
      <AddSkillsModal
        open={skillsModalOpen}
        onOpenChange={setSkillsModalOpen}
        onSuccess={handleRefresh}
      />
      <UploadAvatarModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        onSuccess={handleRefresh}
        currentAvatarUrl={profile?.avatar_url}
        userId={profile?.id || ''}
      />
      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-luna-gray-900 mb-1">Confirm Deletion</h3>
                <p className="text-sm text-luna-gray-600">
                  Are you sure you want to delete this {confirmDelete.type === 'video' ? 'video' : confirmDelete.type}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-luna-gray-700 hover:bg-luna-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'video') {
                    handleDeleteVideo();
                  } else {
                    handleDelete(confirmDelete.type, confirmDelete.id);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <LunaToastProvider>
        <LunaToast
          open={toastOpen}
          onOpenChange={setToastOpen}
          variant={toastVariant}
          title={toastTitle}
          description={toastDescription}
        />
        <LunaToastViewport />
      </LunaToastProvider>

      </div>{/* end max-w container */}
    </div>
  );
}

