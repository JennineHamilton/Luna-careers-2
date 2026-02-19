'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardContent,
  LunaButton,
  LunaBadge,
  LunaProgress,
  LunaAvatar,
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogFooter,
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
} from '@/components/luna';
import { EnrollModal } from '@/components/luna/learning/modals/enroll-modal';
import {
  BookOpen,
  Clock,
  Award,
  Coins,
  Check,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowLeft,
  User,
  Target,
  FileText,
  AlertCircle,
  Loader2,
  ClipboardList,
  Calendar,
  ChevronDown,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import { CurrencyConverter } from '@/components/luna/currency-converter';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { ScholarshipEligibilityResponse } from '@/types/scholarship';

type Module = Database['public']['Tables']['modules']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface ModuleWithDetails extends Module {
  creators: Creator | null;
  module_lessons: Array<{
    id: string;
    sort_order: number;
    is_required: boolean | null;
    lessons: Lesson;
  }>;
  module_quizzes?: Array<{
    quiz_id: string;
    sort_order: number;
    is_required: boolean | null;
    quizzes: Quiz & {
      question_count?: number;
    };
  }> | null;
}

interface ModuleDetailsClientProps {
  module: ModuleWithDetails;
  moduleProgress: any;
  lessonProgress: any[];
  quizAttempts: any[];
  userId?: string;
  enrollment: any;
  creditBalance: number;
  awardedScholarship?: any;
  enrolledCourseId?: string | null;
}

export function ModuleDetailsClient({
  module,
  moduleProgress,
  lessonProgress,
  quizAttempts,
  userId,
  enrollment,
  creditBalance,
  awardedScholarship,
  enrolledCourseId,
}: ModuleDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState<string>('BZD');
  const [displayPrice, setDisplayPrice] = useState<number>(module.price || 0);
  const [scholarshipEligibility, setScholarshipEligibility] = useState<ScholarshipEligibilityResponse | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);
  const [withdrawingApplication, setWithdrawingApplication] = useState(false);

  const isEnrolled = !!enrollment;
  const completionPercentage = moduleProgress?.completion_percentage || 0;
  const hasPendingApplication = scholarshipEligibility?.existing_application?.status === 'pending';

  // Calculate discounted price if scholarship is awarded
  const hasAwardedScholarship = !!awardedScholarship;
  const discountPercentage = awardedScholarship?.scholarships?.discount_percentage || 0;
  const originalPrice = module.price || 0;
  const discountAmount = (originalPrice * discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  // Get navigation context from URL params
  const fromContext = searchParams.get('from'); // 'course' or null
  const courseId = searchParams.get('courseId');

  const levelColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getLessonProgress = (lessonId: string) => {
    return lessonProgress.find(p => p.lesson_id === lessonId);
  };

  // Check scholarship eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      if (!userId || isEnrolled || module.is_free) return;

      setLoadingEligibility(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setLoadingEligibility(false);
          return;
        }

        const response = await fetch(
          `/api/learning/scholarships/eligibility?content_type=module&content_id=${module.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data: ScholarshipEligibilityResponse = await response.json();
          setScholarshipEligibility(data);
        }
      } catch (error) {
        console.error('Failed to check scholarship eligibility:', error);
      } finally {
        setLoadingEligibility(false);
      }
    };

    checkEligibility();
  }, [userId, isEnrolled, module.is_free, module.id]);

  const handleWithdrawAndPay = async () => {
    if (!scholarshipEligibility?.existing_application?.id) return;

    setWithdrawingApplication(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setWithdrawingApplication(false);
        return;
      }

      // Withdraw the application
      const response = await fetch(
        `/api/learning/scholarships/applications/${scholarshipEligibility.existing_application.id}/withdraw`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        setWithdrawingApplication(false);
        return;
      }

      // Successfully withdrawn, open enrollment modal
      setWithdrawingApplication(false);
      setShowWithdrawWarning(false);
      setScholarshipEligibility(null); // Clear eligibility to remove pending status
      setEnrollModalOpen(true);
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setWithdrawingApplication(false);
    }
  };

  const handleEnroll = () => {
    if (!userId) {
      router.push('/login');
      return;
    }

    // If there's a pending application, show warning dialog
    if (hasPendingApplication) {
      setShowWithdrawWarning(true);
    } else {
      setEnrollModalOpen(true);
    }
  };

  const handleEnrollSuccess = () => {
    // Refresh the page to update enrollment status
    router.refresh();
  };

  // Handle currency conversion
  const handleCurrencyChange = (currency: string, amount: number) => {
    setDisplayCurrency(currency);
    setDisplayPrice(amount);
  };

  const handleStartLesson = (lessonId: string) => {
    if (!isEnrolled) {
      handleEnroll();
      return;
    }

    // Only navigate to course learn page if user is ENROLLED in a course that contains this module
    // enrolledCourseId is only set if user is enrolled in a course (not just the module)
    if (enrolledCourseId) {
      // User is enrolled in a course that contains this module
      router.push(`/u/learning/courses/${enrolledCourseId}/learn?lesson=${lessonId}&module=${module.id}`);
    } else {
      // User is only enrolled in the standalone module (not via a course)
      // Navigate to the new module LMS page
      router.push(`/u/learning/modules/${module.id}/learn?lesson=${lessonId}`);
    }
  };

  // Parse skills from JSONB
  const skills = Array.isArray(module.skills) ? module.skills : [];
  const learningOutcomes = Array.isArray(module.learning_outcomes) ? module.learning_outcomes : [];

  // Combine lessons and quizzes into a single content array
  type ContentItem =
    | { type: 'lesson'; data: typeof module.module_lessons[0]; sort_order: number }
    | { type: 'quiz'; data: NonNullable<typeof module.module_quizzes>[0]; sort_order: number };

  const contentItems: ContentItem[] = [
    ...module.module_lessons.map(ml => ({ type: 'lesson' as const, data: ml, sort_order: ml.sort_order })),
    ...(module.module_quizzes || []).map(mq => ({ type: 'quiz' as const, data: mq, sort_order: mq.sort_order })),
  ].sort((a, b) => a.sort_order - b.sort_order);

  // Count lessons and quizzes
  const lessonCount = module.module_lessons.length;
  const quizCount = module.module_quizzes?.length || 0;

  // Handle back navigation based on context
  const handleBackNavigation = () => {
    if (fromContext === 'course' && courseId) {
      router.push(`/u/learning/courses/${courseId}`);
    } else {
      router.push('/u/learning');
    }
  };

  // State for description expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionPreview = module.description && module.description.length > 150
    ? module.description.substring(0, 150) + '...'
    : module.description;

  // Calculate total duration including quizzes
  const totalDuration = (module.duration_minutes || 0) +
    (module.module_quizzes?.reduce((sum, mq) => sum + (mq.quizzes.duration_minutes || 0), 0) || 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Bleed with Dark Blue Luna Color */}
      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-gradient-to-br from-[#00185f] via-[#001a70] to-[#002080] text-white py-6 md:py-8 relative" style={{ marginTop: '-1.5rem' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Back Button */}
          <LunaButton
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4 text-white hover:bg-white/10 text-sm p-0 underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {fromContext === 'course' ? 'Back to Course' : 'Back to Learning'}
          </LunaButton>

          {/* Content Grid - Matches main content layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Hero Content (2/3 width on desktop) */}
            <div className="lg:col-span-2">
            {/* Module Title and Badges */}
            <div className="flex items-center gap-2 mb-3">
              {module.level && (
                <LunaBadge className={
                  module.level.toLowerCase() === 'beginner'
                    ? "bg-green-500/20 text-green-200 border-green-400/30 capitalize"
                    : module.level.toLowerCase() === 'intermediate'
                    ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30 capitalize"
                    : module.level.toLowerCase() === 'advanced'
                    ? "bg-red-500/20 text-red-200 border-red-400/30 capitalize"
                    : "bg-white/20 text-white border-white/30 capitalize"
                }>
                  {module.level}
                </LunaBadge>
              )}
              {module.is_free && (
                <LunaBadge className="bg-green-500/20 text-green-200 border-green-400/30">Free</LunaBadge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3 break-words">{module.title}</h1>

            {/* Description - Expandable */}
            <div className="mb-4">
              <p className="text-white/90 text-sm leading-relaxed break-words">
                {isDescriptionExpanded ? module.description : descriptionPreview}
                {module.description && module.description.length > 150 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="ml-2 text-white font-medium hover:underline focus:outline-none"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-white/80 mb-3">
              {/* Date Created */}
              {module.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(module.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
              )}
            </div>
            </div>
            {/* End of Left Column */}
          </div>
          {/* End of Grid */}
        </div>
        {/* End of max-w-7xl container */}
      </div>
      {/* End of Hero Section */}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8 min-w-0">
            {/* Progress (if enrolled) */}
            {isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Your Progress</span>
                  <span className="text-sm font-semibold text-green-600">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            {learningOutcomes.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {learningOutcomes.map((outcome: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 min-w-0">
                      <Check className="w-4 h-4 text-gray-700 shrink-0 mt-1" />
                      <span className="text-sm text-gray-700 break-words">{outcome.outcome_text || outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills You'll Gain */}
            {skills.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills you'll gain</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: any, index: number) => {
                    // Extract skill name - handle both string and object formats
                    const skillName = typeof skill === 'string'
                      ? skill
                      : skill.skill_name || skill.name || JSON.stringify(skill);

                    return (
                      <span
                        key={index}
                        className="px-4 py-2 bg-blue-50 text-blue-900 text-sm font-medium rounded hover:bg-blue-100 transition-colors"
                      >
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requirements */}
            {module.requirements && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
                <div className="space-y-3">
                  {module.requirements.split('\n').filter((req: string) => req.trim()).map((requirement: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Circle className="w-2 h-2 text-gray-700 fill-gray-700 shrink-0 mt-2" />
                      <span className="text-sm text-gray-700">{requirement.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Content */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Learning content</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}{quizCount > 0 ? ` • ${quizCount} ${quizCount === 1 ? 'quiz' : 'quizzes'}` : ''} • {formatDuration(totalDuration)} total length
                </p>
              </div>

              <LunaAccordion type="multiple" className="divide-y divide-gray-200">
                {contentItems.map((item, index) => {
                  if (item.type === 'lesson') {
                    const moduleLesson = item.data;
                    const lesson = moduleLesson.lessons;
                    const progress = getLessonProgress(lesson.id);
                    const isCompleted = progress?.status === 'completed' || progress?.status === 'passed';

                    return (
                      <LunaAccordionItem key={moduleLesson.id} value={`lesson-${moduleLesson.id}`}>
                        <LunaAccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="shrink-0">
                              {isEnrolled && isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <PlayCircle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 text-sm break-words">{lesson.title}</h4>
                                {moduleLesson.is_required && (
                                  <span className="text-xs text-gray-500 shrink-0">(Required)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.duration_minutes} min</span>
                                </div>
                                {isEnrolled && isCompleted && (
                                  <span className="text-green-600 font-medium">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </LunaAccordionTrigger>
                        <LunaAccordionContent className="px-4 pb-3">
                          {lesson.description && (
                            <p className="text-sm text-gray-600 pl-8 break-words">{lesson.description}</p>
                          )}
                        </LunaAccordionContent>
                      </LunaAccordionItem>
                    );
                  } else {
                    // Quiz
                    const moduleQuiz = item.data;
                    const quiz = moduleQuiz.quizzes;

                    // Check if quiz is completed
                    const attempts = quizAttempts.filter((qa: any) => qa.quiz_id === quiz.id);
                    const latestAttempt = attempts[0]; // Assuming sorted by started_at desc
                    const isCompleted = latestAttempt?.completed_at != null;

                    return (
                      <LunaAccordionItem key={moduleQuiz.quiz_id} value={`quiz-${moduleQuiz.quiz_id}`}>
                        <LunaAccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="shrink-0">
                              {isEnrolled && isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <ClipboardList className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 text-sm break-words">{quiz.name}</h4>
                                {moduleQuiz.is_required && (
                                  <span className="text-xs text-gray-500 shrink-0">(Required)</span>
                                )}
                                {quiz.is_graded && quiz.passing_score && (
                                  <span className="text-xs text-gray-500 shrink-0">
                                    (Pass: {quiz.passing_score}%)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{quiz.number_of_questions} questions</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{quiz.duration_minutes} min</span>
                                </div>
                                {isEnrolled && isCompleted && (
                                  <span className="text-green-600 font-medium">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </LunaAccordionTrigger>
                        <LunaAccordionContent className="px-4 pb-3">
                          {quiz.description && (
                            <p className="text-sm text-gray-600 pl-8 break-words">{quiz.description}</p>
                          )}
                        </LunaAccordionContent>
                      </LunaAccordionItem>
                    );
                  }
                })}
              </LunaAccordion>
            </div>
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:sticky lg:top-24 lg:self-start min-w-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
              {/* Video or Cover Image */}
              <div className="relative aspect-video bg-gray-900">
                {module.intro_video_url ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={module.cover_image_url || undefined}
                  >
                    <source src={module.intro_video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : module.cover_image_url ? (
                  <Image
                    src={module.cover_image_url}
                    alt={module.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Pricing and Details */}
              <div className="p-5 space-y-4">
                {/* Creator */}
                {module.creators && module.creators.logo_url && (
                  <div className="pb-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Created by</div>
                    <Image
                      src={module.creators.logo_url}
                      alt={module.creators.name}
                      width={128}
                      height={128}
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Price */}
                <div>
                  {module.is_free ? (
                    <div className="text-3xl font-bold text-gray-900">Free</div>
                  ) : (
                    <div className="space-y-3">
                      {!isEnrolled && hasAwardedScholarship ? (
                        <>
                          <div className="text-sm text-gray-500 line-through">
                            ${originalPrice.toFixed(2)} BZD
                          </div>
                          <div className="text-3xl font-bold text-gray-900">
                            ${finalPrice.toFixed(2)} <span className="text-lg text-gray-600">BZD</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            After {discountPercentage}% scholarship discount
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="text-3xl font-bold text-gray-900">
                              ${displayPrice.toFixed(2)}
                            </div>
                            <div className="text-right">
                              <CurrencyConverter amountBZD={module.price || 0} onCurrencyChange={handleCurrencyChange} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Module Stats */}
                <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatDuration(totalDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>Lessons</span>
                    </div>
                    <span className="font-medium text-gray-900">{lessonCount}</span>
                  </div>
                  {quizCount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <ClipboardList className="w-4 h-4" />
                        <span>Quizzes</span>
                      </div>
                      <span className="font-medium text-gray-900">{quizCount}</span>
                    </div>
                  )}
                </div>

                {/* Scholarship Available Badge */}
                {module.scholarship_eligible && !isEnrolled && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900 font-semibold text-sm">Scholarship Available</span>
                  </div>
                )}

                {/* Awarded Scholarship Notice */}
                {!isEnrolled && hasAwardedScholarship && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-900">
                          Scholarship Applied!
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          {awardedScholarship.scholarships?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Scholarship Application Notice */}
                {!isEnrolled && hasPendingApplication && !hasAwardedScholarship && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-yellow-900">
                          Application Under Review
                        </p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          We typically respond within 5-7 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enroll Button */}
                {isEnrolled ? (
                  <LunaButton
                    onClick={() => {
                      // Find the first lesson in the content items
                      const firstLesson = contentItems.find(item => item.type === 'lesson');
                      if (firstLesson && firstLesson.type === 'lesson') {
                        handleStartLesson(firstLesson.data.lessons.id);
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Continue Learning
                  </LunaButton>
                ) : userId ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Your Balance:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-600" />
                        {creditBalance.toLocaleString()} credits
                      </span>
                    </div>
                    <LunaButton
                      fullWidth
                      size="lg"
                      onClick={handleEnroll}
                      disabled={loadingEligibility}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {loadingEligibility ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : module.is_free ? (
                        'Enroll for Free'
                      ) : hasAwardedScholarship ? (
                        'Complete Payment'
                      ) : hasPendingApplication ? (
                        'Pay Now Instead'
                      ) : (
                        'Enroll Now'
                      )}
                    </LunaButton>
                  </div>
                ) : (
                  <LunaButton onClick={() => router.push('/login')} className="w-full">
                    Sign in to Enroll
                  </LunaButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      <EnrollModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onSuccess={handleEnrollSuccess}
        contentId={module.id}
        contentType="module"
        contentTitle={module.title}
        price={module.price || 0}
        isFree={module.is_free || false}
        currentBalance={creditBalance}
        initialCurrency={displayCurrency}
        initialDisplayPrice={displayPrice}
      />

      {/* Withdraw Application Warning Dialog */}
      <LunaDialog open={showWithdrawWarning} onOpenChange={setShowWithdrawWarning}>
        <LunaDialogContent className="max-w-md">
          <LunaDialogHeader>
            <LunaDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Withdraw Scholarship Application?
            </LunaDialogTitle>
            <LunaDialogDescription>
              Please confirm before proceeding
            </LunaDialogDescription>
          </LunaDialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-900">
                Important Notice
              </p>
              <p className="text-sm text-yellow-700">
                By proceeding with payment, you will automatically withdraw your pending
                scholarship application for this module.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-luna-gray-700">
                <strong>What this means:</strong>
              </p>
              <ul className="text-sm text-luna-gray-700 list-disc list-inside space-y-1 ml-2">
                <li>Your scholarship application will be cancelled</li>
                <li>You'll proceed to payment immediately</li>
                <li>You can still apply for scholarships on other content</li>
                <li>This won't affect future scholarship applications</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Tip:</strong> If you prefer to wait for the scholarship decision,
                click "Keep Waiting" below.
              </p>
            </div>
          </div>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => setShowWithdrawWarning(false)}
              disabled={withdrawingApplication}
            >
              Keep Waiting
            </LunaButton>
            <LunaButton
              type="button"
              onClick={handleWithdrawAndPay}
              disabled={withdrawingApplication}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {withdrawingApplication ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                'Withdraw & Pay Now'
              )}
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>
    </div>
  );
}

