/**
 * My Enrollments List
 * Display user's enrollments with payment status tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent, LunaBadge, LunaButton } from '@/components/luna';
import { Loader2, GraduationCap, Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';
import Link from 'next/link';

interface Enrollment {
  id: string;
  enrollment_type: string;
  enrollment_id: string;
  purchase_id: string | null;
  enrolled_at: string;
  expires_at: string | null;
  status: string;
  completion_credits_awarded: number | null;
  credits_awarded_at: string | null;
  content: {
    id: string;
    title: string;
    description: string;
    price: number;
    is_free: boolean;
  } | null;
  purchase: {
    id: string;
    payment_method: string;
    payment_status: string;
    amount_credits: number;
    amount_cash: number;
    created_at: string;
  } | null;
  payment_submission: {
    id: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    admin_notes: string | null;
  } | null;
}

export function MyEnrollmentsList() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/learning/my-enrollments');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (enrollment: Enrollment) => {
    if (!enrollment.purchase) {
      return null;
    }

    const { payment_status, payment_method } = enrollment.purchase;
    const submission = enrollment.payment_submission;

    if (payment_method === 'credits' || payment_method === 'free') {
      return null; // No badge needed for credit/free payments
    }

    if (payment_status === 'pending' && submission) {
      if (submission.status === 'pending') {
        return (
          <LunaBadge variant="warning" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Payment Pending Review
          </LunaBadge>
        );
      } else if (submission.status === 'rejected') {
        return (
          <LunaBadge variant="error" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Payment Rejected
          </LunaBadge>
        );
      }
    }

    if (payment_status === 'completed') {
      return (
        <LunaBadge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Payment Confirmed
        </LunaBadge>
      );
    }

    if (payment_status === 'failed') {
      return (
        <LunaBadge variant="error" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Payment Failed
        </LunaBadge>
      );
    }

    return null;
  };

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <LunaBadge variant="default">Active</LunaBadge>;
      case 'completed':
        return <LunaBadge variant="success">Completed</LunaBadge>;
      case 'expired':
        return <LunaBadge variant="warning">Expired</LunaBadge>;
      default:
        return <LunaBadge variant="default">{status}</LunaBadge>;
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filter === 'all') return true;
    if (filter === 'active') return enrollment.status === 'active';
    if (filter === 'completed') return enrollment.status === 'completed';
    if (filter === 'pending') {
      return enrollment.purchase?.payment_status === 'pending' && 
             enrollment.payment_submission?.status === 'pending';
    }
    return true;
  });

  const pendingCount = enrollments.filter(
    (e) => e.purchase?.payment_status === 'pending' && e.payment_submission?.status === 'pending'
  ).length;

  if (loading) {
    return (
      <LunaCard>
        <LunaCardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-luna-blue" />
        </LunaCardContent>
      </LunaCard>
    );
  }

  return (
    <LunaCard>
      <LunaCardHeader>
        <div className="flex items-center justify-between">
          <LunaCardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            My Enrollments
          </LunaCardTitle>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <LunaButton
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({enrollments.length})
            </LunaButton>
            <LunaButton
              variant={filter === 'active' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active
            </LunaButton>
            <LunaButton
              variant={filter === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending Payment {pendingCount > 0 && `(${pendingCount})`}
            </LunaButton>
            <LunaButton
              variant={filter === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </LunaButton>
          </div>
        </div>
      </LunaCardHeader>

      <LunaCardContent>
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-luna-gray-300 mx-auto mb-3" />
            <p className="text-luna-gray-600">
              {filter === 'all'
                ? 'No enrollments yet. Start learning today!'
                : `No ${filter} enrollments.`}
            </p>
            {filter === 'all' && (
              <Link href="/u/learning">
                <LunaButton className="mt-4">
                  Browse Learning Content
                </LunaButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="border border-luna-border-light rounded-lg p-4 hover:bg-luna-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-luna-gray-900">
                        {enrollment.content?.title || 'Unknown Content'}
                      </h3>
                      <span className="text-xs text-luna-gray-500 uppercase">
                        {enrollment.enrollment_type}
                      </span>
                    </div>

                    <p className="text-sm text-luna-gray-600 mb-3 line-clamp-2">
                      {enrollment.content?.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getEnrollmentStatusBadge(enrollment.status)}
                      {getPaymentStatusBadge(enrollment)}

                      {enrollment.completion_credits_awarded && (
                        <LunaBadge variant="success" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {enrollment.completion_credits_awarded} credits earned
                        </LunaBadge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-luna-gray-500">
                      <span>Enrolled: {formatDateTime(enrollment.enrolled_at)}</span>

                      {enrollment.payment_submission?.status === 'rejected' && enrollment.payment_submission.admin_notes && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Reason: {enrollment.payment_submission.admin_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {enrollment.status === 'active' && (
                      <Link
                        href={`/u/learning/${enrollment.enrollment_id}`}
                        className="inline-flex"
                      >
                        <LunaButton size="sm" className="flex items-center gap-1">
                          Continue Learning
                          <ExternalLink className="w-3 h-3" />
                        </LunaButton>
                      </Link>
                    )}

                    {enrollment.payment_submission?.status === 'rejected' && (
                      <LunaButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // TODO: Open modal to resubmit payment
                          alert('Resubmit payment functionality coming soon');
                        }}
                      >
                        Resubmit Payment
                      </LunaButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </LunaCardContent>
    </LunaCard>
  );
}


