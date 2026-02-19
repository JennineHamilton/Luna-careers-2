'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  BookOpen,
  Award,
  Briefcase,
  ChevronRight,
  GraduationCap,
  Play,
  ClipboardCheck,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaProgress } from '@/components/luna/progress';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
export interface DashboardStats {
  trainingProgress: number;
  totalEnrollments: number;
  completedEnrollments: number;
  activeModules: number;
  achievements: number;
  performanceScore: number;
  creditBalance: number;
  applicationCount: number;
}

export interface DashboardClientProps {
  firstName: string;
  stats: DashboardStats;
}

interface Enrollment {
  id: string;
  enrollment_type: string;
  enrollment_id: string;
  status: string;
  enrolled_at: string;
  content: { title: string; description?: string } | null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function DashboardClient({ 
  firstName, 
  stats, 
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-8">
      {/* ── Welcome header ── */}
      <div>
        <h1 className="text-2xl font-semibold text-luna-gray-900">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </h1>
        <p className="text-luna-gray-500 mt-1">
          Here&apos;s an overview of your career journey.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Active Courses"
          value={stats.activeModules}
          href="/u/learning"
          accentColor="blue"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Completed"
          value={stats.completedEnrollments}
          subtitle={stats.totalEnrollments > 0 ? `of ${stats.totalEnrollments} enrolled` : undefined}
          href="/u/learning"
          accentColor="emerald"
        />
        <KpiCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Applications"
          value={stats.applicationCount}
          href="/u/jobs"
          accentColor="violet"
        />
        <KpiCard
          icon={<Award className="w-5 h-5" />}
          label="Achievements"
          value={stats.achievements}
          subtitle="badges earned"
          href="/u/screening"
          accentColor="amber"
        />
      </div>

      {/* ── Quick Actions ── */}
      <QuickActions />

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Continue Learning (2 cols) ── */}
        <div className="lg:col-span-2">
          <ContinueLearning />
        </div>

        {/* ── Sidebar Stats ── */}
        <div className="space-y-4">
          <CreditsCard balance={stats.creditBalance} />
          <PerformanceCard score={stats.performanceScore} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════ */
function KpiCard({
  icon,
  label,
  value,
  subtitle,
  href,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
  href: string;
  accentColor: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const router = useRouter();
  
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-l-violet-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-l-amber-500' },
  };

  const colors = colorClasses[accentColor];

  return (
    <button
      onClick={() => router.push(href)}
      className={cn(
        "bg-white rounded-xl p-5 border border-luna-border-default border-l-4 text-left",
        "hover:shadow-luna-md transition-shadow group",
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <span className={colors.text}>{icon}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-luna-gray-300 group-hover:text-luna-gray-500 transition-colors" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-luna-gray-900">{value}</p>
        <p className="text-sm text-luna-gray-500 mt-0.5">{label}</p>
        {subtitle && (
          <p className="text-xs text-luna-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS
═══════════════════════════════════════════════════════════════ */
function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'screening',
      label: 'Take Assessment',
      description: 'Complete pre-screening tests',
      icon: ClipboardCheck,
      href: '/u/screening',
      color: 'bg-violet-500',
    },
    {
      id: 'learning',
      label: 'Browse Courses',
      description: 'Explore learning content',
      icon: GraduationCap,
      href: '/u/learning',
      color: 'bg-blue-500',
    },
    {
      id: 'jobs',
      label: 'Find Jobs',
      description: 'View open positions',
      icon: Search,
      href: '/u/jobs',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-luna-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(action.href)}
            className="flex items-center gap-4 p-4 bg-white border border-luna-border-default rounded-xl text-left transition-all hover:shadow-sm hover:border-luna-gray-300"
          >
            <div className={cn("p-2.5 rounded-xl text-white", action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-luna-gray-900">{action.label}</p>
              <p className="text-sm text-luna-gray-500 truncate">{action.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-luna-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTINUE LEARNING
═══════════════════════════════════════════════════════════════ */
function ContinueLearning() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await fetch('/api/learning/my-enrollments');
        if (res.ok) {
          const data = await res.json();
          // Only show active enrollments
          const active = (data.enrollments || []).filter((e: Enrollment) => e.status === 'active');
          setEnrollments(active.slice(0, 3));
        }
      } catch {
        console.error('Failed to fetch enrollments');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const fakeProgress = (status: string) => (status === 'completed' ? 100 : 45);

  return (
    <div className="bg-white border border-luna-border-default rounded-xl p-6 shadow-luna-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-luna-gray-900">Continue Learning</h2>
          <p className="text-sm text-luna-gray-500">Pick up where you left off</p>
        </div>
        <LunaButton variant="ghost" size="sm" onClick={() => router.push('/u/learning')}>
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </LunaButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-luna-gray-400" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <BookOpen className="w-8 h-8 text-luna-gray-300 mb-3" />
          <p className="text-luna-gray-500 mb-3">No active courses</p>
          <LunaButton variant="outline" size="sm" onClick={() => router.push('/u/learning')}>
            Browse Courses
          </LunaButton>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center gap-4 p-4 bg-luna-gray-50 rounded-xl hover:bg-luna-gray-100 transition-colors cursor-pointer group"
              onClick={() => router.push('/u/learning')}
            >
              <div className="w-10 h-10 bg-white rounded-lg border border-luna-border-default flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-luna-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-luna-gray-900 truncate">
                  {enrollment.content?.title || 'Untitled'}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <LunaProgress value={fakeProgress(enrollment.status)} size="sm" className="flex-1 max-w-[120px]" />
                  <span className="text-xs text-luna-gray-500">{fakeProgress(enrollment.status)}%</span>
                </div>
              </div>
              <LunaBadge variant="primary" size="sm" className="hidden sm:flex">
                {enrollment.enrollment_type}
              </LunaBadge>
              <ChevronRight className="w-4 h-4 text-luna-gray-300 group-hover:text-luna-gray-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREDITS CARD
═══════════════════════════════════════════════════════════════ */
function CreditsCard({ balance }: { balance: number }) {
  const router = useRouter();
  
  return (
    <div className="bg-gradient-to-br from-luna-navy to-luna-blue rounded-xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/70 text-sm font-medium">Luna Credits</span>
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
      <p className="text-white/60 text-sm mt-1">Available balance</p>
      <button 
        onClick={() => router.push('/u/learning')}
        className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
      >
        Earn More Credits
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERFORMANCE CARD
═══════════════════════════════════════════════════════════════ */
function PerformanceCard({ score }: { score: number }) {
  const router = useRouter();
  
  const getScoreLabel = (s: number) => {
    if (s === 0) return { label: 'Not assessed', color: 'text-luna-gray-400' };
    if (s >= 80) return { label: 'Excellent', color: 'text-emerald-600' };
    if (s >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (s >= 40) return { label: 'Average', color: 'text-amber-600' };
    return { label: 'Needs improvement', color: 'text-red-600' };
  };

  const scoreInfo = getScoreLabel(score);

  return (
    <div className="bg-white border border-luna-border-default rounded-xl p-5 shadow-luna-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-luna-gray-500 text-sm font-medium">Assessment Score</span>
        <button 
          onClick={() => router.push('/u/screening')}
          className="text-luna-blue text-sm font-medium hover:underline"
        >
          View Details
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-luna-gray-900">
          {score > 0 ? score : '—'}
        </p>
        {score > 0 && <span className="text-luna-gray-400 text-lg">/100</span>}
      </div>
      <p className={cn("text-sm mt-1 font-medium", scoreInfo.color)}>
        {scoreInfo.label}
      </p>
      {score === 0 && (
        <LunaButton 
          variant="outline" 
          size="sm" 
          className="mt-4 w-full"
          onClick={() => router.push('/u/screening')}
        >
          Take Assessment
        </LunaButton>
      )}
    </div>
  );
}
