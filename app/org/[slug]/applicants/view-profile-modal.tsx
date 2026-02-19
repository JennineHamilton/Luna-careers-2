'use client';

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogBody,
  LunaDialogFooter,
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardContent,
  LunaAvatar,
  LunaBadge,
  LunaTabs,
  LunaTabsList,
  LunaTabsTrigger,
  LunaTabsContent,
  LunaEmptyState,
  LunaButton,
  LunaVideoPlayer,
} from '@/components/luna';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Award,
  Briefcase,
  GraduationCap,
  Languages,
  CheckCircle,
  Calendar,
  FileText,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { getInitials } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import Link from 'next/link';

type Profile = Database['public']['Tables']['users']['Row'];
type ProfessionalExperience = Database['public']['Tables']['professional_experience']['Row'];
type Education = Database['public']['Tables']['education']['Row'];
type Certification = Database['public']['Tables']['certifications']['Row'];
type UserLanguage = Database['public']['Tables']['user_languages']['Row'];

interface ViewProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  applicationId: string;
  currentStatus: string;
  onStatusUpdate?: () => void;
}

export function ViewProfileModal({
  open,
  onOpenChange,
  userId,
  applicationId,
  currentStatus,
  onStatusUpdate
}: ViewProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<UserLanguage[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchProfileData();
    }
  }, [open, userId]);

  const handleStatusUpdate = async (newStatus: 'shortlisted' | 'rejected') => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/org/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to update status');

      onOpenChange(false);
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch professional experience (only verified)
      const { data: experiencesData } = await supabase
        .from('professional_experience')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .order('start_date', { ascending: false });

      // Fetch education (only verified)
      const { data: educationData } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .order('start_date', { ascending: false });

      // Fetch certifications (only verified)
      const { data: certificationsData } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .order('issue_date', { ascending: false });

      // Fetch languages
      const { data: languagesData } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select(`
          id,
          skill_id,
          skills (
            id,
            name,
            category
          )
        `)
        .eq('user_id', userId);

      const { data: verifiedSkills } = await supabase
        .from('user_verified_skills')
        .select(`
          id,
          skill_id,
          skills (
            id,
            name,
            category
          )
        `)
        .eq('user_id', userId);

      // Combine and deduplicate skills
      const allSkills = new Map();
      userSkills?.forEach(us => {
        if (us.skills) {
          allSkills.set(us.skills.id, { ...us.skills, verified: false });
        }
      });
      verifiedSkills?.forEach(vs => {
        if (vs.skills) {
          allSkills.set(vs.skills.id, { ...vs.skills, verified: true });
        }
      });

      setProfile(profileData);
      setExperiences(experiencesData || []);
      setEducation(educationData || []);
      setCertifications(certificationsData || []);
      setLanguages(languagesData || []);
      setSkills(Array.from(allSkills.values()));
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-5xl max-h-[90vh]">
        <LunaDialogHeader className="border-b border-luna-border-default bg-gradient-to-r from-luna-primary/5 to-luna-blue/5">
          <div className="flex items-start gap-4">
            <LunaAvatar
              src={profile?.avatar_url || undefined}
              alt={fullName}
              fallback={getInitials(fullName)}
              size="lg"
              className="ring-2 ring-luna-primary/20"
            />
            <div className="flex-1">
              <LunaDialogTitle className="text-xl">{fullName}</LunaDialogTitle>
              {profile?.profession && (
                <p className="text-sm text-luna-primary font-medium mt-1">{profile.profession}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                {profile?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-luna-primary" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
              {(profile?.linkedin_url || profile?.portfolio_url) && (
                <div className="flex gap-3 mt-2">
                  {profile.linkedin_url && (
                    <Link
                      href={profile.linkedin_url}
                      target="_blank"
                      className="text-sm text-luna-primary hover:text-luna-blue flex items-center gap-1.5 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Link>
                  )}
                  {profile.portfolio_url && (
                    <Link
                      href={profile.portfolio_url}
                      target="_blank"
                      className="text-sm text-luna-primary hover:text-luna-blue flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </LunaDialogHeader>
        <LunaDialogBody className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-luna-primary" />
            </div>
          ) : (
            <div className="space-y-4">

              {/* Tabs Section */}
              <LunaTabs defaultValue="overview" className="space-y-4">
                <LunaTabsList>
                  <LunaTabsTrigger value="overview">Overview</LunaTabsTrigger>
                  <LunaTabsTrigger value="experience">Experience</LunaTabsTrigger>
                  <LunaTabsTrigger value="education">Education</LunaTabsTrigger>
                  <LunaTabsTrigger value="certifications">Certifications</LunaTabsTrigger>
                </LunaTabsList>

                {/* Overview Tab */}
                <LunaTabsContent value="overview" className="space-y-4">
                  {/* Introduction Video */}
                  {profile.intro_video_url && (
                    <LunaCard className="border-luna-primary/20 bg-gradient-to-br from-luna-primary/5 to-transparent">
                      <LunaCardHeader>
                        <LunaCardTitle className="flex items-center gap-2 text-luna-primary">
                          <FileText className="w-5 h-5" />
                          Introduction Video
                        </LunaCardTitle>
                      </LunaCardHeader>
                      <LunaCardContent>
                        <LunaVideoPlayer
                          src={profile.intro_video_url}
                          title="Introduction Video"
                        />
                      </LunaCardContent>
                    </LunaCard>
                  )}

                  {/* About */}
                  <LunaCard className="border-luna-border-default">
                    <LunaCardHeader className="bg-luna-background-subtle">
                      <LunaCardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-luna-primary" />
                        About
                      </LunaCardTitle>
                    </LunaCardHeader>
                    <LunaCardContent>
                      {profile.bio ? (
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                      ) : (
                        <LunaEmptyState
                          icon={FileText}
                          title="No bio available"
                          description="This user hasn't added a bio yet."
                          size="sm"
                        />
                      )}
                    </LunaCardContent>
                  </LunaCard>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <LunaCard className="border-luna-border-default">
                      <LunaCardHeader className="bg-luna-background-subtle">
                        <LunaCardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-luna-primary" />
                          Skills
                        </LunaCardTitle>
                      </LunaCardHeader>
                      <LunaCardContent>
                        <div className="space-y-4">
                          {['technical', 'soft', 'language', 'other'].map((category) => {
                            const categorySkills = skills.filter((s) => s.category === category);
                            if (categorySkills.length === 0) return null;

                            return (
                              <div key={category}>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                                  {category} Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {categorySkills.map((skill) => (
                                    <LunaBadge
                                      key={skill.id}
                                      variant={skill.verified ? 'success' : 'default'}
                                      className={skill.verified ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                    >
                                      {skill.name}
                                      {skill.verified && (
                                        <CheckCircle className="w-3 h-3 ml-1 inline" />
                                      )}
                                    </LunaBadge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </LunaCardContent>
                    </LunaCard>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <LunaCard className="border-luna-border-default">
                      <LunaCardHeader className="bg-luna-background-subtle">
                        <LunaCardTitle className="flex items-center gap-2">
                          <Languages className="w-5 h-5 text-luna-primary" />
                          Languages
                        </LunaCardTitle>
                      </LunaCardHeader>
                      <LunaCardContent>
                        <div className="flex flex-wrap gap-2">
                          {languages.map((lang) => (
                            <LunaBadge key={lang.id} variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
                              {lang.language_name} - {lang.proficiency_level}
                            </LunaBadge>
                          ))}
                        </div>
                      </LunaCardContent>
                    </LunaCard>
                  )}
                </LunaTabsContent>

                {/* Experience Tab */}
                <LunaTabsContent value="experience" className="space-y-3">
                  {experiences.length > 0 ? (
                    <>
                      {experiences.map((exp) => (
                        <LunaCard key={exp.id} className="border-luna-border-default hover:border-luna-primary/30 transition-colors">
                          <LunaCardHeader className="bg-luna-background-subtle">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <LunaCardTitle className="flex items-center gap-2">
                                  <Briefcase className="w-5 h-5 text-luna-primary" />
                                  {exp.job_title}
                                </LunaCardTitle>
                                <p className="text-sm text-gray-600 mt-1 font-medium">{exp.company}</p>
                              </div>
                              <LunaBadge variant="success" dot className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </LunaBadge>
                            </div>
                          </LunaCardHeader>
                          <LunaCardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="w-4 h-4 text-luna-primary" />
                              <span>
                                {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {' - '}
                                {exp.currently_working
                                  ? 'Present'
                                  : exp.end_date
                                  ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : 'N/A'}
                              </span>
                              {exp.location_country && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <MapPin className="w-4 h-4 text-luna-primary" />
                                  <span>{exp.location_country}</span>
                                </>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{exp.description}</p>
                            )}
                          </LunaCardContent>
                        </LunaCard>
                      ))}
                    </>
                  ) : (
                    <LunaEmptyState
                      icon={Briefcase}
                      title="No work experience"
                      description="This user hasn't added any verified work experience yet."
                      size="sm"
                    />
                  )}
                </LunaTabsContent>

                {/* Education Tab */}
                <LunaTabsContent value="education" className="space-y-3">
                  {education.length > 0 ? (
                    <>
                      {education.map((edu) => (
                        <LunaCard key={edu.id} className="border-luna-border-default hover:border-luna-primary/30 transition-colors">
                          <LunaCardHeader className="bg-luna-background-subtle">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <LunaCardTitle className="flex items-center gap-2">
                                  <GraduationCap className="w-5 h-5 text-luna-primary" />
                                  {edu.field_of_study}
                                </LunaCardTitle>
                                <p className="text-sm text-gray-600 mt-1 font-medium">
                                  {edu.institution} • {edu.education_level}
                                </p>
                              </div>
                              <LunaBadge variant="success" dot className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </LunaBadge>
                            </div>
                          </LunaCardHeader>
                          <LunaCardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-luna-primary" />
                              <span>
                                {new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {' - '}
                                {edu.currently_enrolled
                                  ? 'Present'
                                  : edu.end_date
                                  ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : 'N/A'}
                              </span>
                            </div>
                          </LunaCardContent>
                        </LunaCard>
                      ))}
                    </>
                  ) : (
                    <LunaEmptyState
                      icon={GraduationCap}
                      title="No education"
                      description="This user hasn't added any verified education yet."
                      size="sm"
                    />
                  )}
                </LunaTabsContent>

                {/* Certifications Tab */}
                <LunaTabsContent value="certifications" className="space-y-3">
                  {certifications.length > 0 ? (
                    <>
                      {certifications.map((cert) => (
                        <LunaCard key={cert.id} className="border-luna-border-default hover:border-luna-primary/30 transition-colors">
                          <LunaCardHeader className="bg-luna-background-subtle">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <LunaCardTitle className="flex items-center gap-2">
                                  <Award className="w-5 h-5 text-luna-primary" />
                                  {cert.certification_title}
                                </LunaCardTitle>
                                <p className="text-sm text-gray-600 mt-1 font-medium">{cert.issuing_organization}</p>
                              </div>
                              <LunaBadge variant="success" dot className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </LunaBadge>
                            </div>
                          </LunaCardHeader>
                          <LunaCardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-luna-primary" />
                              <span>
                                Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {cert.does_not_expire
                                  ? ' • No Expiration'
                                  : cert.expiry_date
                                  ? ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                  : ''}
                              </span>
                            </div>
                            {cert.certificate_id && (
                              <p className="text-sm text-gray-600 mt-2">
                                Certificate ID: {cert.certificate_id}
                              </p>
                            )}
                          </LunaCardContent>
                        </LunaCard>
                      ))}
                    </>
                  ) : (
                    <LunaEmptyState
                      icon={Award}
                      title="No certifications"
                      description="This user hasn't added any verified certifications yet."
                      size="sm"
                    />
                  )}
                </LunaTabsContent>


              </LunaTabs>
            </div>
          )}
        </LunaDialogBody>
        <LunaDialogFooter>
          <div className="flex items-center justify-between w-full">
            <LunaButton
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Close
            </LunaButton>
            <div className="flex gap-2">
              <LunaButton
                variant="outline"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating || currentStatus === 'rejected'}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserX className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Reject'}
              </LunaButton>
              <LunaButton
                variant="primary"
                onClick={() => handleStatusUpdate('shortlisted')}
                disabled={isUpdating || currentStatus === 'shortlisted'}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Shortlist'}
              </LunaButton>
            </div>
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}
