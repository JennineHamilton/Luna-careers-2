'use client';

import {
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
} from 'lucide-react';
import type { Database } from '@/types/database.types';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';
import Link from 'next/link';

type Profile = Database['public']['Tables']['users']['Row'];
type ProfessionalExperience = Database['public']['Tables']['professional_experience']['Row'];
type Education = Database['public']['Tables']['education']['Row'];
type Certification = Database['public']['Tables']['certifications']['Row'];
type UserLanguage = Database['public']['Tables']['user_languages']['Row'];

interface PublicProfileClientProps {
  profile: Profile;
  experiences: ProfessionalExperience[];
  education: Education[];
  certifications: Certification[];
  languages: UserLanguage[];
  userSkills: any[];
  verifiedSkills: any[];
}

export function PublicProfileClient({
  profile,
  experiences,
  education,
  certifications,
  languages,
  userSkills,
  verifiedSkills,
}: PublicProfileClientProps) {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

  // Combine and deduplicate skills
  const allSkills = new Map();
  userSkills.forEach(us => {
    if (us.skills) {
      allSkills.set(us.skills.id, { ...us.skills, verified: false });
    }
  });
  verifiedSkills.forEach(vs => {
    if (vs.skills) {
      allSkills.set(vs.skills.id, { ...vs.skills, verified: true });
    }
  });
  const skills = Array.from(allSkills.values());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-luna-primary to-luna-blue text-white p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-6">
            <LunaAvatar
              src={profile.avatar_url || undefined}
              alt={fullName}
              fallback={getInitials(fullName)}
              size="xl"
              className="border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
              {profile.profession && (
                <p className="text-xl text-white/90 mb-3">{profile.profession}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                {profile.linkedin_url && (
                  <Link
                    href={profile.linkedin_url}
                    target="_blank"
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </Link>
                )}
                {profile.portfolio_url && (
                  <Link
                    href={profile.portfolio_url}
                    target="_blank"
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Portfolio</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <LunaTabs defaultValue="overview" className="space-y-6">
          <LunaTabsList>
            <LunaTabsTrigger value="overview">Overview</LunaTabsTrigger>
            <LunaTabsTrigger value="experience">Experience</LunaTabsTrigger>
            <LunaTabsTrigger value="education">Education</LunaTabsTrigger>
            <LunaTabsTrigger value="certifications">Certifications</LunaTabsTrigger>
            <LunaTabsTrigger value="skills">Skills</LunaTabsTrigger>
          </LunaTabsList>

          {/* Overview Tab */}
          <LunaTabsContent value="overview">
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>About</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                {profile.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <LunaEmptyState
                    icon={FileText}
                    title="No bio available"
                    description="This user hasn't added a bio yet."
                  />
                )}
              </LunaCardContent>
            </LunaCard>

            {languages.length > 0 && (
              <LunaCard className="mt-6">
                <LunaCardHeader>
                  <LunaCardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    Languages
                  </LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <LunaBadge key={lang.id} variant="default">
                        {lang.language_name} - {lang.proficiency_level}
                      </LunaBadge>
                    ))}
                  </div>
                </LunaCardContent>
              </LunaCard>
            )}
          </LunaTabsContent>

          {/* Experience Tab */}
          <LunaTabsContent value="experience">
            {experiences.length > 0 ? (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <LunaCard key={exp.id}>
                    <LunaCardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <LunaCardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            {exp.job_title}
                          </LunaCardTitle>
                          <p className="text-sm text-gray-600 mt-1">{exp.company}</p>
                        </div>
                        <LunaBadge variant="success" dot>
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </LunaBadge>
                      </div>
                    </LunaCardHeader>
                    <LunaCardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4" />
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
                            <MapPin className="w-4 h-4" />
                            <span>{exp.location_country}</span>
                          </>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </LunaCardContent>
                  </LunaCard>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Briefcase}
                title="No work experience"
                description="This user hasn't added any verified work experience yet."
              />
            )}
          </LunaTabsContent>

          {/* Education Tab */}
          <LunaTabsContent value="education">
            {education.length > 0 ? (
              <div className="space-y-4">
                {education.map((edu) => (
                  <LunaCard key={edu.id}>
                    <LunaCardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <LunaCardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            {edu.institution}
                          </LunaCardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {edu.education_level} in {edu.field_of_study}
                          </p>
                        </div>
                        <LunaBadge variant="success" dot>
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </LunaBadge>
                      </div>
                    </LunaCardHeader>
                    <LunaCardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
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
              </div>
            ) : (
              <LunaEmptyState
                icon={GraduationCap}
                title="No education"
                description="This user hasn't added any verified education yet."
              />
            )}
          </LunaTabsContent>


          {/* Certifications Tab */}
          <LunaTabsContent value="certifications">
            {certifications.length > 0 ? (
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <LunaCard key={cert.id}>
                    <LunaCardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <LunaCardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            {cert.certification_title}
                          </LunaCardTitle>
                          <p className="text-sm text-gray-600 mt-1">{cert.issuing_organization}</p>
                        </div>
                        <LunaBadge variant="success" dot>
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </LunaBadge>
                      </div>
                    </LunaCardHeader>
                    <LunaCardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {!cert.does_not_expire && cert.expiry_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Expires: {new Date(cert.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {cert.does_not_expire && (
                        <div className="text-sm text-gray-600">
                          <LunaBadge variant="default">No Expiration</LunaBadge>
                        </div>
                      )}
                      {cert.certificate_id && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Certificate ID:</span> {cert.certificate_id}
                        </div>
                      )}
                    </LunaCardContent>
                  </LunaCard>
                ))}
              </div>
            ) : (
              <LunaEmptyState
                icon={Award}
                title="No certifications"
                description="This user hasn't added any verified certifications yet."
              />
            )}
          </LunaTabsContent>

          {/* Skills Tab */}
          <LunaTabsContent value="skills">
            {skills.length > 0 ? (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle>Skills</LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <LunaBadge
                        key={skill.id}
                        variant={skill.verified ? 'success' : 'default'}
                      >
                        {skill.name}
                        {skill.verified && (
                          <CheckCircle className="w-3 h-3 ml-1 inline" />
                        )}
                      </LunaBadge>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <LunaBadge variant="success">
                        <CheckCircle className="w-3 h-3" />
                      </LunaBadge>
                      <span>Verified skills (from completed courses or certifications)</span>
                    </div>
                  </div>
                </LunaCardContent>
              </LunaCard>
            ) : (
              <LunaEmptyState
                icon={Award}
                title="No skills"
                description="This user hasn't added any skills yet."
              />
            )}
          </LunaTabsContent>
        </LunaTabs>
      </div>
    </div>
  );
}

