'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaTextarea } from '@/components/luna/textarea';
import { LunaInputLabel } from '@/components/luna/input';
import { CurrencyConverter } from '@/components/luna/currency-converter';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  ArrowLeft,
  Send,
  FileText,
  Award,
  Target,
  Heart,
  Umbrella,
  Coffee,
  GraduationCap,
  Plane,
  Shield,
  Zap,
  Gift,
  TrendingUp,
  Users
} from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

type VacancyWithOrganization = Vacancy & {
  organizations: Organization | null;
};

interface JobDetailsClientProps {
  vacancy: VacancyWithOrganization;
  existingApplication: JobApplication | null;
  userId: string;
  organizationBenefits: OrganizationBenefit[];
  requiredSkillNames: string[];
  preferredSkillNames: string[];
}

// Icon mapping for benefits
const BENEFIT_ICONS: Record<string, any> = {
  health: Heart,
  insurance: Shield,
  vacation: Plane,
  retirement: TrendingUp,
  education: GraduationCap,
  wellness: Zap,
  bonus: Gift,
  flexible: Coffee,
  remote: Umbrella,
  team: Users,
  default: Award,
};

const getBenefitIcon = (iconName?: string | null) => {
  if (!iconName) return BENEFIT_ICONS.default;
  const Icon = BENEFIT_ICONS[iconName.toLowerCase()] || BENEFIT_ICONS.default;
  return Icon;
};

export function JobDetailsClient({
  vacancy,
  existingApplication,
  userId,
  organizationBenefits,
  requiredSkillNames,
  preferredSkillNames,
}: JobDetailsClientProps) {
  const router = useRouter();
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<string>('BZD');
  const [displaySalaryMin, setDisplaySalaryMin] = useState<number>(vacancy.salary_range_min || 0);
  const [displaySalaryMax, setDisplaySalaryMax] = useState<number>(vacancy.salary_range_max || 0);
  const [prerequisitesMet, setPrerequisitesMet] = useState<boolean>(true);
  const [prerequisitesLoading, setPrerequisitesLoading] = useState<boolean>(false);
  const [missingPrerequisites, setMissingPrerequisites] = useState<string[]>([]);

  // Check prerequisites completion on mount and when vacancy/user changes
  useEffect(() => {
    checkPrerequisites();
  }, [vacancy?.id, userId]);

  const checkPrerequisites = async () => {
    setPrerequisitesLoading(true);
    const supabase = createClient();
    const missing: string[] = [];

    try {
      // If no prerequisites, user can apply
      const hasAssessmentPrereqs =
        vacancy.prerequisite_assessments &&
        Array.isArray(vacancy.prerequisite_assessments) &&
        vacancy.prerequisite_assessments.length > 0;
      const hasLearningPrereqs =
        vacancy.prerequisite_learning_content &&
        Array.isArray(vacancy.prerequisite_learning_content) &&
        vacancy.prerequisite_learning_content.length > 0;

      if (!hasAssessmentPrereqs && !hasLearningPrereqs) {
        setMissingPrerequisites([]);
        setPrerequisitesMet(true);
        return;
      }

      // Check assessment prerequisites
      if (hasAssessmentPrereqs) {
        for (const assessment of vacancy.prerequisite_assessments as any[]) {
          let completed = false;

          // Typing/transcription/multilingual: assessment_attempts
          if (assessment.type === 'typing' || assessment.type === 'transcription' || assessment.type === 'multilingual') {
            const { data } = await supabase
              .from('assessment_attempts')
              .select('id')
              .eq('user_id', userId)
              .eq('assessment_template_id', assessment.id)
              .eq('is_submitted', true)
              .limit(1);
            completed = !!data && data.length > 0;
          } else if (assessment.type === 'personality') {
            // Personality uses personality_attempts, not assessment_attempts
            const { data } = await supabase
              .from('personality_attempts')
              .select('id')
              .eq('user_id', userId)
              .eq('assessment_template_id', assessment.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          } else if (assessment.type === 'cognitive') {
            // cognitive_attempts uses status, not is_submitted
            const { data } = await supabase
              .from('cognitive_attempts')
              .select('id')
              .eq('user_id', userId)
              .eq('template_id', assessment.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          } else if (assessment.type === 'knowledge') {
            const { data } = await supabase
              .from('knowledge_attempts')
              .select('id')
              .eq('user_id', userId)
              .eq('assessment_id', assessment.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          }

          if (!completed) {
            missing.push(assessment.title);
          }
        }
      }

      // Check learning content prerequisites (completion is in progress tables, not enrollments.status)
      if (hasLearningPrereqs) {
        for (const content of vacancy.prerequisite_learning_content as any[]) {
          let completed = false;
          if (content.type === 'module') {
            const { data } = await supabase
              .from('module_progress')
              .select('id')
              .eq('user_id', userId)
              .eq('module_id', content.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          } else if (content.type === 'course') {
            const { data } = await supabase
              .from('course_progress')
              .select('id')
              .eq('user_id', userId)
              .eq('course_id', content.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          } else if (content.type === 'program') {
            const { data } = await supabase
              .from('program_progress')
              .select('id')
              .eq('user_id', userId)
              .eq('program_id', content.id)
              .eq('status', 'completed')
              .limit(1);
            completed = !!data && data.length > 0;
          }

          if (!completed) {
            missing.push(content.title);
          }
        }
      }

      setMissingPrerequisites(missing);
      setPrerequisitesMet(missing.length === 0);
    } catch (error) {
      console.error('Error checking prerequisites:', error);
      // On error, allow application but show warning
      setPrerequisitesMet(true);
    } finally {
      setPrerequisitesLoading(false);
    }
  };

  const formatEmploymentType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatExperienceLevel = (level: string) => {
    const levels: Record<string, string> = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level',
      lead: 'Lead',
      executive: 'Executive',
    };
    return levels[level] || level.charAt(0).toUpperCase() + level.slice(1);
  };

  const formatLocation = (vacancy: Vacancy) => {
    if (vacancy.is_remote) return 'Remote';
    const parts = [vacancy.location_city, vacancy.location_state, vacancy.location_country].filter(Boolean);
    return parts.join(', ') || 'Not specified';
  };

  const handleCurrencyChange = (currency: string, amount: number) => {
    setDisplayCurrency(currency);
    // Calculate both min and max based on the conversion rate
    if (vacancy.salary_range_min && vacancy.salary_range_max) {
      const rate = amount / (vacancy.salary_range_min || 1);
      setDisplaySalaryMin(vacancy.salary_range_min * rate);
      setDisplaySalaryMax(vacancy.salary_range_max * rate);
    } else if (vacancy.salary_range_min) {
      setDisplaySalaryMin(amount);
    } else if (vacancy.salary_range_max) {
      setDisplaySalaryMax(amount);
    }
  };

  const handleApply = async () => {
    if (!consentGiven) {
      setError('Please agree to share your professional profile with the employer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          user_id: userId,
          vacancy_id: vacancy.id,
          consent_given: consentGiven,
          status: 'pending',
        });

      if (insertError) {
        throw insertError;
      }

      setApplyModalOpen(false);
      setConsentGiven(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-luna-primary to-luna-blue text-white p-6">
        <div className="max-w-6xl mx-auto">
          <LunaButton
            variant="ghost"
            onClick={() => router.back()}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4 text-white hover:bg-white/10"
          >
            Back to Jobs
          </LunaButton>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{vacancy.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <LunaBadge variant="default" className="bg-white/20 text-white border-0">
                  {formatExperienceLevel(vacancy.experience_level)}
                </LunaBadge>
                <LunaBadge variant="default" className="bg-white/20 text-white border-0">
                  {formatEmploymentType(vacancy.employment_type)}
                </LunaBadge>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{formatLocation(vacancy)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Posted {formatDateTime(vacancy.created_at || '')}</span>
                </div>
              </div>
            </div>

            {!existingApplication && (
              <div className="flex flex-col items-end gap-2">
                <LunaButton
                  onClick={() => setApplyModalOpen(true)}
                  className="bg-white text-luna-primary hover:bg-white/90 shrink-0"
                  disabled={prerequisitesLoading || !prerequisitesMet}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {prerequisitesLoading ? 'Checking...' : 'Apply Now'}
                </LunaButton>
                {!prerequisitesLoading && !prerequisitesMet && (
                  <p className="text-xs text-red-400">
                    Complete prerequisites to apply
                  </p>
                )}
              </div>
            )}

            {existingApplication && (
              <div className="flex items-center gap-2 bg-green-500/20 text-white px-4 py-2 rounded-lg shrink-0">
                <CheckCircle className="h-5 w-5" />
                <span>Application Submitted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Employer Card */}
            {vacancy.organizations?.slug ? (
              <Link href={`/org/${vacancy.organizations.slug}`}>
                <LunaCard className="hover:shadow-lg transition-shadow cursor-pointer">
                  <LunaCardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {vacancy.organizations?.logo_url ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image
                            src={vacancy.organizations.logo_url}
                            alt={vacancy.organizations?.name || 'Company'}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-luna-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-8 h-8 text-luna-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{vacancy.organizations?.name || 'Company'}</h3>
                        {vacancy.organizations?.industry && (
                          <p className="text-sm text-gray-600">{vacancy.organizations.industry}</p>
                        )}
                      </div>
                    </div>
                  </LunaCardContent>
                </LunaCard>
              </Link>
            ) : (
              <LunaCard>
                <LunaCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-luna-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-8 h-8 text-luna-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">{vacancy.organizations?.name || 'Company'}</h3>
                      {vacancy.organizations?.industry && (
                        <p className="text-sm text-gray-600">{vacancy.organizations.industry}</p>
                      )}
                    </div>
                  </div>
                </LunaCardContent>
              </LunaCard>
            )}

            {/* Description */}
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>About this role</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: vacancy.description }}
                />
              </LunaCardContent>
            </LunaCard>

            {/* Responsibilities */}
            {vacancy.responsibilities && (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-luna-primary" />
                    Responsibilities
                  </LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: vacancy.responsibilities }}
                  />
                </LunaCardContent>
              </LunaCard>
            )}

            {/* Requirements */}
            {vacancy.requirements && (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-luna-primary" />
                    Requirements
                  </LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: vacancy.requirements }}
                  />
                </LunaCardContent>
              </LunaCard>
            )}

            {/* Skills */}
            {((requiredSkillNames && requiredSkillNames.length > 0) || (preferredSkillNames && preferredSkillNames.length > 0)) && (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle>Skills</LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent className="space-y-4">
                  {requiredSkillNames && requiredSkillNames.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Required</h4>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkillNames.map((skill, index) => (
                          <LunaBadge key={index} variant="primary">
                            {skill}
                          </LunaBadge>
                        ))}
                      </div>
                    </div>
                  )}
                  {preferredSkillNames && preferredSkillNames.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred</h4>
                      <div className="flex flex-wrap gap-2">
                        {preferredSkillNames.map((skill, index) => (
                          <LunaBadge key={index} variant="default">
                            {skill}
                          </LunaBadge>
                        ))}
                      </div>
                    </div>
                  )}
                </LunaCardContent>
              </LunaCard>
            )}

            {/* Prerequisites - always visible when vacancy has prerequisites; show completion status per item */}
            {((vacancy.prerequisite_assessments && Array.isArray(vacancy.prerequisite_assessments) && vacancy.prerequisite_assessments.length > 0) ||
              (vacancy.prerequisite_learning_content && Array.isArray(vacancy.prerequisite_learning_content) && vacancy.prerequisite_learning_content.length > 0)) && (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-luna-primary" />
                    Prerequisites
                  </LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent className="space-y-4">
                  {prerequisitesLoading ? (
                    <p className="text-sm text-gray-600">Checking your progress...</p>
                  ) : prerequisitesMet ? (
                    <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      You meet the requirements for this job. You can apply below.
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      You don&apos;t meet the requirements to apply yet. Complete the required items below to continue.
                    </p>
                  )}

                  {vacancy.prerequisite_assessments && Array.isArray(vacancy.prerequisite_assessments) && vacancy.prerequisite_assessments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Required Assessments</h4>
                      <div className="space-y-2">
                        {(vacancy.prerequisite_assessments as any[]).map((assessment: any, index: number) => {
                          const isCompleted = !prerequisitesLoading && !missingPrerequisites.includes(assessment.title);
                          return (
                            <Link
                              key={index}
                              href={`/u/screening?assessment=${encodeURIComponent(assessment.id)}`}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-luna-primary focus:ring-offset-1 ${isCompleted ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-gray-50'}`}
                            >
                              {prerequisitesLoading ? (
                                <Circle className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                              ) : isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                              )}
                              <span className="text-sm text-gray-700">
                                {assessment.title}
                                {assessment.category && ` (${assessment.category})`}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {vacancy.prerequisite_learning_content && Array.isArray(vacancy.prerequisite_learning_content) && vacancy.prerequisite_learning_content.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Required Learning Content</h4>
                      <div className="space-y-2">
                        {(vacancy.prerequisite_learning_content as any[]).map((content: any, index: number) => {
                          const isCompleted = !prerequisitesLoading && !missingPrerequisites.includes(content.title);
                          const learningHref =
                            content.type === 'module'
                              ? `/u/learning?module=${encodeURIComponent(content.id)}`
                              : content.type === 'course'
                                ? `/u/learning?course=${encodeURIComponent(content.id)}`
                                : `/u/learning?program=${encodeURIComponent(content.id)}`;
                          return (
                            <Link
                              key={index}
                              href={learningHref}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-luna-primary focus:ring-offset-1 ${isCompleted ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-gray-50'}`}
                            >
                              {prerequisitesLoading ? (
                                <Circle className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                              ) : isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                              )}
                              <span className="text-sm text-gray-700">
                                {content.title}
                                <span className="text-xs text-gray-500 ml-1">({content.type})</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </LunaCardContent>
              </LunaCard>
            )}

            {/* Employer Benefits */}
            {organizationBenefits && organizationBenefits.length > 0 && (
              <LunaCard>
                <LunaCardHeader>
                  <LunaCardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-luna-primary" />
                    Benefits & Perks
                  </LunaCardTitle>
                </LunaCardHeader>
                <LunaCardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organizationBenefits.map((benefit) => {
                      const Icon = getBenefitIcon(benefit.icon);
                      return (
                        <div key={benefit.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-luna-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-luna-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{benefit.benefit_name}</h4>
                            {benefit.description && (
                              <p className="text-xs text-gray-600 mt-0.5">{benefit.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </LunaCardContent>
              </LunaCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply Card */}
            <LunaCard>
              <LunaCardContent className="p-4">
                {existingApplication ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-luna-success mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Applied {formatDateTime(existingApplication.applied_at || '')}
                    </p>
                    <LunaBadge variant="success">
                      {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
                    </LunaBadge>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Ready to apply?</h3>
                    {!prerequisitesLoading && !prerequisitesMet && missingPrerequisites.length > 0 && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-900 mb-2">Prerequisites Required:</p>
                        <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
                          {missingPrerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <LunaButton
                      onClick={() => setApplyModalOpen(true)}
                      className="w-full"
                      icon={<Send className="w-4 h-4" />}
                      disabled={prerequisitesLoading || !prerequisitesMet}
                    >
                      {prerequisitesLoading ? 'Checking...' : 'Apply Now'}
                    </LunaButton>
                  </div>
                )}
              </LunaCardContent>
            </LunaCard>

            {/* Job Details */}
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>Job Details</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent className="space-y-3">
                {/* Salary Range */}
                {(vacancy.salary_range_min || vacancy.salary_range_max) && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Salary Range</span>
                    </div>
                    <div className="pl-6">
                      <div className="font-semibold text-gray-900">
                        {displaySalaryMin && displaySalaryMax
                          ? `$${displaySalaryMin.toLocaleString()} - $${displaySalaryMax.toLocaleString()}`
                          : displaySalaryMin
                          ? `$${displaySalaryMin.toLocaleString()}+`
                          : `Up to $${displaySalaryMax.toLocaleString()}`}
                      </div>
                      <div className="mt-1">
                        <CurrencyConverter
                          amountBZD={vacancy.salary_range_min || vacancy.salary_range_max || 0}
                          onCurrencyChange={handleCurrencyChange}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Application Deadline */}
                {vacancy.application_deadline && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Application Deadline</span>
                    </div>
                    <div className="pl-6 text-gray-900">{formatDateTime(vacancy.application_deadline)}</div>
                  </div>
                )}

                {/* Posted Date */}
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Posted</span>
                  </div>
                  <div className="pl-6 text-gray-900">{formatDateTime(vacancy.created_at || '')}</div>
                </div>
              </LunaCardContent>
            </LunaCard>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <LunaDialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <LunaDialogContent className="max-w-lg">
          <LunaDialogHeader>
            <LunaDialogTitle>Apply for {vacancy.title}</LunaDialogTitle>
          </LunaDialogHeader>
          <LunaDialogBody className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Your Professional Profile</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    By applying, your professional profile will be shared with <strong>{vacancy.organizations?.name || 'the employer'}</strong>.
                    This includes:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                    <li>General information (name, contact details, bio)</li>
                    <li>Education history</li>
                    <li>Work experience</li>
                    <li>Certifications & trainings</li>
                    <li>Skills</li>
                    <li>Pre-screening reports (if applicable)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 text-luna-primary border-gray-300 rounded focus:ring-luna-primary"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer flex-1">
                I agree to share my professional profile with <strong>{vacancy.organizations?.name || 'the employer'}</strong> for
                the purpose of this job application. I understand that the employer will be able to view all
                information listed above.
              </label>
            </div>
          </LunaDialogBody>
          <LunaDialogFooter>
            <LunaButton
              variant="outline"
              onClick={() => {
                setApplyModalOpen(false);
                setConsentGiven(false);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </LunaButton>
            <LunaButton
              onClick={handleApply}
              disabled={isSubmitting || !consentGiven}
              icon={<Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Submitting...' : 'Agree & Apply'}
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>
    </div>
  );
}

