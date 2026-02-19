'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, BookOpen, GraduationCap, Briefcase, Clock } from 'lucide-react';
import Image from 'next/image';
import type { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/luna/learning/content-card';

type Module = Database['public']['Tables']['modules']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];
type Program = Database['public']['Tables']['programs']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface ModuleWithCreator extends Module {
  creators: Creator | null;
}

interface CourseWithCreator extends Course {
  creators: Creator | null;
}

interface ProgramWithCreator extends Program {
  creators: Creator | null;
}

interface Progress {
  module_id?: string;
  course_id?: string;
  program_id?: string;
  completion_percentage: number;
  status: string;
}

interface ScholarshipApplication {
  id: string;
  content_type: 'module' | 'course' | 'program';
  content_id: string;
  status: string;
}

interface LearningPageClientProps {
  modules: ModuleWithCreator[];
  courses: CourseWithCreator[];
  programs: ProgramWithCreator[];
  moduleProgress: Progress[];
  courseProgress: Progress[];
  programProgress: Progress[];
  scholarshipApplications: ScholarshipApplication[];
  userId?: string;
  userBalance?: number;
}

type TabType = 'modules' | 'courses' | 'programs';

const LEVEL_FILTERS = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'All Prices' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

export function LearningPageClient({
  modules,
  courses,
  programs,
  moduleProgress,
  courseProgress,
  programProgress,
}: LearningPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL focus: when opening from a prerequisite link (?module=id, ?course=id, ?program=id)
  const focusModuleId = searchParams.get('module');
  const focusCourseId = searchParams.get('course');
  const focusProgramId = searchParams.get('program');

  // Get initial tab from URL (focus param takes precedence over tab param)
  const initialTab = (() => {
    if (focusModuleId) return 'modules' as TabType;
    if (focusCourseId) return 'courses' as TabType;
    if (focusProgramId) return 'programs' as TabType;
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['modules', 'courses', 'programs'].includes(tab)) {
      return tab;
    }
    return 'modules';
  })();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');

  // Filter modules (and optionally restrict to one when ?module=id)
  const filteredModules = useMemo(() => {
    let list = modules.filter((module) => {
      const matchesSearch = searchQuery === '' ||
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'all' || module.level === levelFilter;
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'free' && module.is_free) ||
        (priceFilter === 'paid' && !module.is_free);
      return matchesSearch && matchesLevel && matchesPrice;
    });
    if (focusModuleId) list = list.filter((m) => m.id === focusModuleId);
    return list;
  }, [modules, searchQuery, levelFilter, priceFilter, focusModuleId]);

  // Filter courses (and optionally restrict to one when ?course=id)
  const filteredCourses = useMemo(() => {
    let list = courses.filter((course) => {
      const matchesSearch = searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'free' && course.is_free) ||
        (priceFilter === 'paid' && !course.is_free);
      return matchesSearch && matchesLevel && matchesPrice;
    });
    if (focusCourseId) list = list.filter((c) => c.id === focusCourseId);
    return list;
  }, [courses, searchQuery, levelFilter, priceFilter, focusCourseId]);

  // Filter programs (and optionally restrict to one when ?program=id)
  const filteredPrograms = useMemo(() => {
    let list = programs.filter((program) => {
      const matchesSearch = searchQuery === '' ||
        program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'all' || program.level === levelFilter;
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'free' && program.is_free) ||
        (priceFilter === 'paid' && !program.is_free);
      return matchesSearch && matchesLevel && matchesPrice;
    });
    if (focusProgramId) list = list.filter((p) => p.id === focusProgramId);
    return list;
  }, [programs, searchQuery, levelFilter, priceFilter, focusProgramId]);

  // Progress helpers
  const getModuleProgress = (moduleId: string) => moduleProgress.find(p => p.module_id === moduleId)?.completion_percentage || 0;
  const getCourseProgress = (courseId: string) => courseProgress.find(p => p.course_id === courseId)?.completion_percentage || 0;
  const getProgramProgress = (programId: string) => programProgress.find(p => p.program_id === programId)?.completion_percentage || 0;

  const isModuleEnrolled = (moduleId: string) => moduleProgress.some(p => p.module_id === moduleId);
  const isCourseEnrolled = (courseId: string) => courseProgress.some(p => p.course_id === courseId);
  const isProgramEnrolled = (programId: string) => programProgress.some(p => p.program_id === programId);

  // Navigation
  const handleViewModule = (moduleId: string) => router.push(`/u/learning/${moduleId}`);
  const handleViewCourse = (courseId: string) => router.push(`/u/learning/courses/${courseId}`);
  const handleViewProgram = (programId: string) => router.push(`/u/learning/programs/${programId}`);

  // Get current filtered items based on active tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'modules': return filteredModules;
      case 'courses': return filteredCourses;
      case 'programs': return filteredPrograms;
    }
  };

  const tabs = [
    { id: 'modules' as TabType, label: 'Modules', count: filteredModules.length, icon: BookOpen },
    { id: 'courses' as TabType, label: 'Courses', count: filteredCourses.length, icon: GraduationCap },
    { id: 'programs' as TabType, label: 'Programs', count: filteredPrograms.length, icon: Briefcase },
  ];

  return (
    <div className="pb-8">
      {/* Main Container */}
      <div className="bg-white rounded-[10px] border border-luna-border-default">
        {/* Header */}
        <div className="p-5 border-b border-luna-gray-100">
          <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">Learning Center</h1>
          <p className="text-sm text-luna-gray-600">
            Explore our collection of modules, courses, and programs to advance your career.
          </p>
        </div>

        {/* Search & Tabs */}
        <div className="p-5 border-b border-luna-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luna-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-luna-gray-200 text-sm text-luna-gray-900 placeholder:text-luna-gray-400 focus:outline-none focus:border-luna-gray-400 focus:ring-2 focus:ring-luna-gray-100 transition-all"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-luna-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-white text-luna-gray-900 shadow-sm"
                      : "text-luna-gray-600 hover:text-luna-gray-900"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id ? "bg-luna-blue text-white" : "bg-luna-gray-200 text-luna-gray-600"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-luna-gray-50 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-luna-gray-500 uppercase tracking-wide">Level:</span>
            <div className="flex gap-1">
              {LEVEL_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLevelFilter(filter.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    levelFilter === filter.id
                      ? "bg-luna-navy text-white"
                      : "bg-luna-gray-100 text-luna-gray-600 hover:bg-luna-gray-200"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-luna-gray-500 uppercase tracking-wide">Price:</span>
            <div className="flex gap-1">
              {PRICE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setPriceFilter(filter.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    priceFilter === filter.id
                      ? "bg-luna-navy text-white"
                      : "bg-luna-gray-100 text-luna-gray-600 hover:bg-luna-gray-200"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-5">
          {getCurrentItems().length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-luna-gray-300 mx-auto mb-3" />
              <p className="text-luna-gray-500">No {activeTab} found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeTab === 'modules' && filteredModules.map((module) => (
                <ContentCard
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description || ''}
                  coverImage={module.cover_image_url}
                  creatorName={module.creators?.name}
                  creatorLogo={module.creators?.logo_url}
                  contentType="module"
                  level={module.level as 'beginner' | 'intermediate' | 'advanced' | null}
                  price={module.price || 0}
                  isFree={module.is_free || false}
                  duration={module.duration_minutes}
                  skills={Array.isArray(module.skills) ? module.skills as string[] : []}
                  progress={getModuleProgress(module.id)}
                  isEnrolled={isModuleEnrolled(module.id)}
                  onClick={() => handleViewModule(module.id)}
                />
              ))}
              {activeTab === 'courses' && filteredCourses.map((course) => (
                <ContentCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || ''}
                  coverImage={course.cover_image_url}
                  creatorName={course.creators?.name}
                  creatorLogo={course.creators?.logo_url}
                  contentType="course"
                  level={course.level as 'beginner' | 'intermediate' | 'advanced' | null}
                  price={course.price || 0}
                  isFree={course.is_free || false}
                  duration={course.duration_minutes}
                  skills={Array.isArray(course.skills) ? course.skills as string[] : []}
                  progress={getCourseProgress(course.id)}
                  isEnrolled={isCourseEnrolled(course.id)}
                  onClick={() => handleViewCourse(course.id)}
                />
              ))}
              {activeTab === 'programs' && filteredPrograms.map((program) => (
                <ContentCard
                  key={program.id}
                  id={program.id}
                  title={program.title}
                  description={program.description || ''}
                  coverImage={program.cover_image_url}
                  creatorName={program.creators?.name}
                  creatorLogo={program.creators?.logo_url}
                  contentType="program"
                  level={program.level as 'beginner' | 'intermediate' | 'advanced' | null}
                  price={program.price || 0}
                  isFree={program.is_free || false}
                  duration={program.duration_minutes}
                  skills={Array.isArray(program.skills) ? program.skills as string[] : []}
                  progress={getProgramProgress(program.id)}
                  isEnrolled={isProgramEnrolled(program.id)}
                  onClick={() => handleViewProgram(program.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
