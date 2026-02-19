'use client';

import { useState, useEffect } from 'react';
import { Diamond, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
  LunaButton,
} from '@/components/luna';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { TransactionHistoryModal } from '@/components/luna/learning/modals/transaction-history-modal';

interface CreditWallet {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

interface AffordableContent {
  modules: number;
  courses: number;
  programs: number;
  total: number;
}

export default function PointsTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [affordableContent, setAffordableContent] = useState<AffordableContent>({
    modules: 0,
    courses: 0,
    programs: 0,
    total: 0,
  });
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const { user } = useAuthContext();

  // Fetch credit balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/learning/credits/balance');

        if (response.ok) {
          const data = await response.json();
          setWallet(data.wallet);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  // Fetch affordable content when wallet balance changes
  useEffect(() => {
    const fetchAffordableContent = async () => {
      if (!wallet) return;

      try {
        const balance = wallet.balance;

        // Fetch modules, courses, programs, and user enrollments in parallel
        const [modulesRes, coursesRes, programsRes] = await Promise.all([
          fetch('/api/learning/modules?published_only=true'),
          fetch('/api/learning/courses?published_only=true'),
          fetch('/api/learning/programs?published_only=true'),
        ]);

        const [modulesData, coursesData, programsData] = await Promise.all([
          modulesRes.ok ? modulesRes.json() : { modules: [] },
          coursesRes.ok ? coursesRes.json() : { courses: [] },
          programsRes.ok ? programsRes.json() : { programs: [] },
        ]);

        // Fetch user's enrollments using Supabase client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('enrollment_type, enrollment_id, status');

        // Get enrolled content IDs to exclude them (both active and completed)
        const enrolledModuleIds = new Set(
          (enrollments || [])
            .filter((e: any) => e.enrollment_type === 'module')
            .map((e: any) => e.enrollment_id)
        );
        const enrolledCourseIds = new Set(
          (enrollments || [])
            .filter((e: any) => e.enrollment_type === 'course')
            .map((e: any) => e.enrollment_id)
        );
        const enrolledProgramIds = new Set(
          (enrollments || [])
            .filter((e: any) => e.enrollment_type === 'program')
            .map((e: any) => e.enrollment_id)
        );

        // Count affordable content, excluding enrolled/completed items
        // Convert price (dollars) to credits for comparison (100 credits = $1)
        const affordableModules = (modulesData.modules || []).filter(
          (m: any) => !enrolledModuleIds.has(m.id) && (m.is_free || (m.price ? m.price * 100 : 0) <= balance)
        ).length;

        const affordableCourses = (coursesData.courses || []).filter(
          (c: any) => !enrolledCourseIds.has(c.id) && (c.is_free || (c.price ? c.price * 100 : 0) <= balance)
        ).length;

        const affordablePrograms = (programsData.programs || []).filter(
          (p: any) => !enrolledProgramIds.has(p.id) && (p.is_free || (p.price ? p.price * 100 : 0) <= balance)
        ).length;

        setAffordableContent({
          modules: affordableModules,
          courses: affordableCourses,
          programs: affordablePrograms,
          total: affordableModules + affordableCourses + affordablePrograms,
        });

      } catch {
        // Silently handle fetch errors
      }
    };

    fetchAffordableContent();
  }, [wallet]);

  const balance = wallet?.balance || 0;
  const lifetimeEarned = wallet?.lifetime_earned || 0;
  const displayCredits = balance.toLocaleString();

  return (
    <>
      <LunaDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <LunaDropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2.5 px-4 h-9 rounded-md transition-all duration-200 hover:shadow-md bg-gradient-to-br from-luna-blue to-indigo-600 shadow-sm border border-white/20"
            aria-label="View learning credits"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Diamond
                className="w-4 h-4 text-luna-yellow drop-shadow-sm"
                fill="currentColor"
              />
            )}
            <span className="font-bold text-white text-base tracking-tight drop-shadow-sm">
              {loading ? '...' : displayCredits}
            </span>
          </button>
        </LunaDropdownMenuTrigger>

        <LunaDropdownMenuContent className="w-[360px] p-0 flex flex-col max-h-[85vh]" align="end">
          {/* Fixed Header */}
          <div className="px-4 pt-4 pb-3 border-b border-luna-border-default flex-shrink-0">
            <h3 className="text-lg font-semibold text-luna-gray-900 mb-1">
              Learning Credits
            </h3>
            <p className="text-sm text-luna-gray-600">
              Your credit balance and earning stats
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-luna-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Balance Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-900 mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {balance.toLocaleString()}{' '}
                        <span className="text-base font-normal">credits</span>
                      </p>
                    </div>
                    <TrendingUp className="w-7 h-7 text-blue-500 opacity-60" />
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-luna-border-default mb-4"></div>

                {/* Affordable Content Section */}
                <div className="mb-4">
                  <p className="text-sm text-luna-gray-700 font-medium mb-3 text-center">
                    {affordableContent.total} learning {affordableContent.total === 1 ? 'opportunity' : 'opportunities'} available within your current balance
                  </p>

                  {/* Affordable Content Breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/u/learning?affordable=modules"
                      onClick={() => setIsOpen(false)}
                      className="bg-green-50 border border-green-200 rounded-md p-3 text-center hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-green-700 mb-1 font-medium">Modules</p>
                      <p className="text-2xl font-bold text-green-900">
                        {affordableContent.modules}
                      </p>
                    </Link>
                    <Link
                      href="/u/learning?affordable=courses"
                      onClick={() => setIsOpen(false)}
                      className="bg-purple-50 border border-purple-200 rounded-md p-3 text-center hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-purple-700 mb-1 font-medium">Courses</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {affordableContent.courses}
                      </p>
                    </Link>
                    <Link
                      href="/u/learning?affordable=programs"
                      onClick={() => setIsOpen(false)}
                      className="bg-orange-50 border border-orange-200 rounded-md p-3 text-center hover:bg-orange-100 hover:border-orange-300 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-orange-700 mb-1 font-medium">Programs</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {affordableContent.programs}
                      </p>
                    </Link>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-luna-border-default mb-4"></div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-luna-gray-50 border border-luna-border-default rounded-md p-3">
                    <p className="text-xs text-luna-gray-500 mb-1">Lifetime Earned</p>
                    <p className="text-xl font-semibold text-luna-gray-900">
                      {lifetimeEarned.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-luna-gray-50 border border-luna-border-default rounded-md p-3">
                    <p className="text-xs text-luna-gray-500 mb-1">Lifetime Spent</p>
                    <p className="text-xl font-semibold text-luna-gray-900">
                      {wallet?.lifetime_spent?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-luna-gray-50 rounded-md p-3">
                  <p className="text-xs text-luna-gray-600 leading-relaxed">
                    Earn credits by completing modules. Use credits to enroll in new courses and programs.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Fixed Footer */}
          {!loading && (
            <div className="px-4 pb-4 pt-3 border-t border-luna-border-default bg-white flex-shrink-0">
              <LunaButton
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => {
                  setIsOpen(false);
                  setShowTransactionHistory(true);
                }}
              >
                View Transaction History
              </LunaButton>
            </div>
          )}
        </LunaDropdownMenuContent>
      </LunaDropdownMenu>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        open={showTransactionHistory}
        onOpenChange={setShowTransactionHistory}
      />
    </>
  );
}

