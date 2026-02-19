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
  GraduationCap,
  Clock,
  Award,
  Coins,
  CheckCircle2,
  PlayCircle,
  ArrowLeft,
  Target,
  BookOpen,
  AlertCircle,
  Loader2,
  ClipboardList,
  FileText,
  Check,
  Circle,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import { CurrencyConverter } from '@/components/luna/currency-converter';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { ScholarshipEligibilityResponse } from '@/types/scholarship';

type Course = Database['public']['Tables']['courses']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

interface CourseWithDetails extends Course {
  creators: Creator | null;
  course_modules: Array<{
    id: string;
    sort_order: number;
    is_required: boolean | null;
    modules: {
      id: string;
      title: string;
      description: string;
      duration_minutes: number | null;
      cover_image_url: string | null;
      level: string;
      module_lessons: Array<{
        id: string;
        sort_order: number;
        is_required: boolean | null;
        lessons: {
          id: string;
          title: string;
          duration_minutes: number | null;
        } | null;
      }>;
      module_quizzes: Array<{
        id: string;
        sort_order: number;
        is_required: boolean | null;
        quizzes: {
          id: string;
          name: string;
          duration_minutes: number | null;
          number_of_questions: number;
        } | null;
      }>;
    } | null;
  }>;
}

interface CourseDetailsClientProps {
  course: CourseWithDetails;
  courseProgress: any;
  moduleProgress: any[];
  lessonProgress: any[];
  quizAttempts: any[];
  userId?: string;
  enrollment: any;
  creditBalance: number;
  awardedScholarship?: any;
  skillNames: string[];
}

export function CourseDetailsClient({
  course,
  courseProgress,
  moduleProgress,
  lessonProgress,
  quizAttempts,
  userId,
  enrollment,
  creditBalance,
  awardedScholarship,
  skillNames,
}: CourseDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState<string>('BZD');
  const [displayPrice, setDisplayPrice] = useState<number>(course.price || 0);
  const [scholarshipEligibility, setScholarshipEligibility] = useState<ScholarshipEligibilityResponse | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);
  const [withdrawingApplication, setWithdrawingApplication] = useState(false);

  const isEnrolled = !!enrollment;
  const completionPercentage = courseProgress?.completion_percentage || 0;
  const hasPendingApplication = scholarshipEligibility?.existing_application?.status === 'pending';

  // Description preview
  const descriptionPreview = course.description && course.description.length > 150
    ? course.description.substring(0, 150) + '...'
    : course.description;

  // Calculate discounted price if scholarship is awarded
  const hasAwardedScholarship = !!awardedScholarship;
  const discountPercentage = awardedScholarship?.scholarships?.discount_percentage || 0;
  const originalPrice = course.price || 0;
  const discountAmount = (originalPrice * discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  // Get navigation context from URL params
  const fromContext = searchParams.get('from'); // 'program' or null
  const programId = searchParams.get('programId');

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

  const getModuleProgress = (moduleId: string) => {
    return moduleProgress.find(p => p.module_id === moduleId);
  };

  const getLessonProgress = (lessonId: string) => {
    return lessonProgress.find(p => p.lesson_id === lessonId);
  };

  // Check scholarship eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      if (!userId || isEnrolled || course.is_free) return;

      setLoadingEligibility(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setLoadingEligibility(false);
          return;
        }

        const response = await fetch(
          `/api/learning/scholarships/eligibility?content_type=course&content_id=${course.id}`,
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
  }, [userId, isEnrolled, course.is_free, course.id]);

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

  const handleViewModule = (moduleId: string) => {
    // Always navigate to module details page
    // The module details page will handle enrollment if needed
    router.push(`/u/learning/${moduleId}?from=course&courseId=${course.id}`);
  };

  const handleContinueLearning = () => {
    // Navigate to the course learn page
    router.push(`/u/learning/courses/${course.id}/learn`);
  };

  const handleApplyScholarship = () => {
    // Open the enroll modal which has scholarship application tab
    setEnrollModalOpen(true);
  };

  // Parse learning outcomes from JSONB
  const learningOutcomes = Array.isArray(course.learning_outcomes) ? course.learning_outcomes : [];

  // Sort modules by sort_order and filter out null modules
  const sortedModules = [...course.course_modules]
    .filter((cm) => cm.modules) // Filter out null modules
    .sort((a, b) => a.sort_order - b.sort_order);

  // Handle back navigation based on context
  const handleBackNavigation = () => {
    if (fromContext === 'program' && programId) {
      router.push(`/u/learning/programs/${programId}`);
    } else {
      router.push('/u/learning');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Bleed with Dark Blue Luna Color */}
      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-gradient-to-br from-[#00185f] via-[#001a70] to-[#002080] text-white py-6 md:py-8 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Back Button */}
          <LunaButton
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4 text-white hover:bg-white/10 text-sm p-0 underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {fromContext === 'program' ? 'Back to Program' : 'Back to Learning'}
          </LunaButton>

          {/* Content Grid - Matches main content layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Hero Content (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              {/* Course Title and Badges */}
              <div className="flex items-center gap-2 mb-3">
                {course.level && (
                  <LunaBadge className={
                    course.level.toLowerCase() === 'beginner'
                      ? "bg-green-500/20 text-green-200 border-green-400/30 capitalize"
                      : course.level.toLowerCase() === 'intermediate'
                      ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30 capitalize"
                      : course.level.toLowerCase() === 'advanced'
                      ? "bg-red-500/20 text-red-200 border-red-400/30 capitalize"
                      : "bg-white/20 text-white border-white/30 capitalize"
                  }>
                    {course.level}
                  </LunaBadge>
                )}
                {course.is_free && (
                  <LunaBadge className="bg-green-500/20 text-green-200 border-green-400/30">Free</LunaBadge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-3 break-words">{course.title}</h1>

              {/* Description - Expandable */}
              <div className="mb-4">
                <p className="text-white/90 text-sm leading-relaxed break-words">
                  {isDescriptionExpanded ? course.description : descriptionPreview}
                  {course.description && course.description.length > 150 && (
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
                {course.created_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(course.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
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
                      <span className="text-sm text-gray-700 break-words">
                        {typeof outcome === 'string' ? outcome : outcome.outcome_text || outcome}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills You'll Gain */}
            {skillNames.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills you'll gain</h2>
                <div className="flex flex-wrap gap-2">
                  {skillNames.map((skillName: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-900 text-sm font-medium rounded hover:bg-blue-100 transition-colors"
                    >
                      {skillName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Content - Nested Accordion */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Course content</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {sortedModules.length} {sortedModules.length === 1 ? 'module' : 'modules'}
                </p>
              </div>

              <LunaAccordion type="multiple" className="divide-y divide-gray-200">
                {sortedModules.map((cm, moduleIndex) => {
                  const module = cm.modules;
                  if (!module) return null;

                  const progress = getModuleProgress(module.id);
                  const isModuleCompleted = progress?.completion_percentage === 100;

                  // Get all lessons and quizzes for this module
                  const moduleLessons = (module as any).module_lessons || [];
                  const moduleQuizzes = (module as any).module_quizzes || [];

                  // Calculate total items
                  const totalItems = moduleLessons.length + moduleQuizzes.length;

                  return (
                    <LunaAccordionItem key={cm.id} value={`module-${cm.id}`}>
                      <LunaAccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <div className="shrink-0">
                            {isEnrolled && isModuleCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 text-sm break-words">
                                Module {moduleIndex + 1}: {module.title}
                              </h4>
                              {cm.is_required && (
                                <span className="text-xs text-gray-500 shrink-0">(Required)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                              {module.duration_minutes && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(module.duration_minutes)}</span>
                                </>
                              )}
                              {isEnrolled && progress && progress.completion_percentage > 0 && !isModuleCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">{progress.completion_percentage}% complete</span>
                                </>
                              )}
                              {isEnrolled && isModuleCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">Completed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </LunaAccordionTrigger>
                      <LunaAccordionContent className="px-4 pb-3">
                        {/* Module Description */}
                        {module.description && (
                          <p className="text-sm text-gray-600 pl-8 mb-3 break-words">{module.description}</p>
                        )}

                        {/* Nested Lessons and Quizzes */}
                        {totalItems > 0 && (
                          <div className="pl-8 space-y-2">
                            {/* Lessons */}
                            {moduleLessons.map((ml: any) => {
                              const lesson = ml.lessons;
                              if (!lesson) return null;

                              const lessonProg = getLessonProgress(lesson.id);
                              const isLessonCompleted = lessonProg?.status === 'completed' || lessonProg?.status === 'passed';

                              return (
                                <div key={ml.id} className="flex items-center gap-2 py-2 text-sm">
                                  <div className="shrink-0">
                                    {isEnrolled && isLessonCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <PlayCircle className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-gray-700 break-words">{lesson.title}</span>
                                  {lesson.duration_minutes && (
                                    <span className="text-xs text-gray-500 shrink-0">{lesson.duration_minutes} min</span>
                                  )}
                                </div>
                              );
                            })}

                            {/* Quizzes */}
                            {moduleQuizzes.map((mq: any) => {
                              const quiz = mq.quizzes;
                              if (!quiz) return null;

                              const attempts = quizAttempts.filter((qa: any) => qa.quiz_id === quiz.id);
                              const latestAttempt = attempts[0];
                              const isQuizCompleted = latestAttempt?.completed_at != null;

                              return (
                                <div key={mq.quiz_id} className="flex items-center gap-2 py-2 text-sm">
                                  <div className="shrink-0">
                                    {isEnrolled && isQuizCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <ClipboardList className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-gray-700 break-words">{quiz.name}</span>
                                  <span className="text-xs text-gray-500 shrink-0">
                                    {quiz.number_of_questions} questions • {quiz.duration_minutes} min
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </LunaAccordionContent>
                    </LunaAccordionItem>
                  );
                })}
              </LunaAccordion>
            </div>
        </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:sticky lg:top-24 lg:self-start min-w-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
              {/* Cover Image */}
              <div className="relative aspect-video bg-gray-900">
                {course.cover_image_url ? (
                  <Image
                    src={course.cover_image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <GraduationCap className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Pricing and Details */}
              <div className="p-5 space-y-4">
                {/* Creator */}
                {course.creators && course.creators.logo_url && (
                  <div className="pb-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Created by</div>
                    <Image
                      src={course.creators.logo_url}
                      alt={course.creators.name}
                      width={128}
                      height={128}
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Price */}
                <div>
                  {course.is_free ? (
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
                              <CurrencyConverter amountBZD={course.price || 0} onCurrencyChange={handleCurrencyChange} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Stats */}
                <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                  {course.duration_minutes && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatDuration(course.duration_minutes)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>Modules</span>
                    </div>
                    <span className="font-medium text-gray-900">{sortedModules.length}</span>
                  </div>
                </div>

                {/* Scholarship Available Badge */}
                {course.scholarship_eligible && !isEnrolled && (
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
                        <button
                          onClick={() => setShowWithdrawWarning(true)}
                          className="text-xs text-yellow-800 underline mt-2 hover:text-yellow-900"
                        >
                          Withdraw Application
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4">
                  {isEnrolled ? (
                    <LunaButton
                      onClick={handleContinueLearning}
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
                        onClick={handleEnroll}
                        className="w-full"
                        disabled={loadingEligibility}
                      >
                        {loadingEligibility ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : course.is_free ? (
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

      </div>

      {/* Enroll Modal */}
      {userId && (
        <EnrollModal
          open={enrollModalOpen}
          onOpenChange={setEnrollModalOpen}
          contentType="course"
          contentId={course.id}
          contentTitle={course.title}
          price={course.price || 0}
          isFree={course.is_free || false}
          currentBalance={creditBalance}
          onSuccess={handleEnrollSuccess}
          initialCurrency={displayCurrency}
          initialDisplayPrice={displayPrice}
        />
      )}

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
                scholarship application for this course.
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

