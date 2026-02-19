'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaButton } from '@/components/luna/button';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogDescription, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaInputLabel } from '@/components/luna/input';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { ScholarshipStatusBadge } from '@/components/luna/scholarships/scholarship-status-badge';
import { Award, Clock, CheckCircle, XCircle, BookOpen, AlertCircle, Eye, X, Calendar, FileText, Briefcase, Target, MessageSquare, GraduationCap, MoreVertical } from 'lucide-react';
import type { Database } from '@/types/database.types';
import type { ScholarshipStatus, ScholarshipApplicationData } from '@/types/scholarship';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type ScholarshipApplication = Database['public']['Tables']['scholarship_applications']['Row'];
type AwardedScholarship = Database['public']['Tables']['awarded_scholarships']['Row'];

interface ContentDetails {
  title: string;
  image: string | null;
  creator: { name: string; logo: string | null } | null;
  price: number;
}

interface ScholarshipsPageClientProps {
  applications: ScholarshipApplication[];
  awardedScholarships: AwardedScholarship[];
  contentDetails: Record<string, ContentDetails>;
  userId: string;
}

export function ScholarshipsPageClient({
  applications,
  awardedScholarships,
  contentDetails,
  userId,
}: ScholarshipsPageClientProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<ScholarshipApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Calculate stats
  const totalApplications = applications.length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const activeScholarships = awardedScholarships.length;

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications.toString(),
      icon: <BookOpen className="w-5 h-5 text-luna-blue" />,
      bgColor: 'bg-luna-blue/10',
    },
    {
      label: 'Pending Review',
      value: pendingCount.toString(),
      icon: <Clock className="w-5 h-5 text-luna-warning" />,
      bgColor: 'bg-luna-warning/10',
    },
    {
      label: 'Approved',
      value: approvedCount.toString(),
      icon: <CheckCircle className="w-5 h-5 text-luna-success" />,
      bgColor: 'bg-luna-success/10',
    },
    {
      label: 'Active Scholarships',
      value: activeScholarships.toString(),
      icon: <Award className="w-5 h-5 text-luna-primary" />,
      bgColor: 'bg-luna-primary/10',
    },
  ];

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' ||
      contentDetails[app.content_id]?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(app.status);
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (application: ScholarshipApplication) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleWithdrawClick = (applicationId: string) => {
    setWithdrawingAppId(applicationId);
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawingAppId) return;

    setIsWithdrawing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(`/api/learning/scholarships/applications/${withdrawingAppId}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }

      // Refresh the page to show updated data
      router.refresh();
      setWithdrawDialogOpen(false);
      setWithdrawingAppId(null);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleEnroll = (contentType: string, contentId: string) => {
    const route = contentType === 'module' ? `/u/learning/${contentId}` :
                  contentType === 'course' ? `/u/learning/courses/${contentId}` :
                  `/u/learning/programs/${contentId}`;
    router.push(route);
  };

  const columns: DataTableColumn<ScholarshipApplication>[] = [
    {
      accessorKey: 'content_id',
      header: 'Learning Content',
      sortable: true,
      cell: (row) => {
        const content = contentDetails[row.content_id];
        if (!content) return <span className="text-luna-gray-400">Unknown</span>;

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0">
              {content.image ? (
                <Image
                  src={content.image}
                  alt={content.title}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-luna-blue/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-luna-blue" />
                </div>
              )}
            </div>
            <div>
              <div className="font-medium text-luna-gray-900">{content.title}</div>
              <div className="text-xs text-luna-gray-500 capitalize">{row.content_type}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Creator',
      sortable: false,
      cell: (row) => {
        const content = contentDetails[row.content_id];
        const creator = content?.creator;

        if (!creator) {
          return <span className="text-luna-gray-400 text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 shrink-0">
              {creator.logo ? (
                <Image
                  src={creator.logo}
                  alt={creator.name}
                  width={24}
                  height={24}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-luna-gray-200 flex items-center justify-center">
                  <span className="text-xs text-luna-gray-600 font-medium">
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-luna-gray-900">{creator.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'content_id',
      header: 'Original Cost',
      sortable: false,
      cell: (row) => {
        const content = contentDetails[row.content_id];
        if (!content) return <span className="text-luna-gray-400">-</span>;

        return (
          <span className="text-sm font-medium text-luna-gray-900">
            ${content.price.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Scholarship Coverage',
      sortable: false,
      cell: (row) => {
        // Find the awarded scholarship for this application
        const awarded = awardedScholarships.find(a => a.application_id === row.id);

        if (!awarded) {
          // If not awarded yet, show potential coverage based on scholarship discount
          const content = contentDetails[row.content_id];
          if (!content) return <span className="text-luna-gray-400">-</span>;

          // Get scholarship discount percentage from the application
          const discountPercentage = (row as any).scholarships?.discount_percentage || 0;
          const coverage = content.price * (discountPercentage / 100);

          return (
            <span className="text-sm text-luna-gray-600">
              ${coverage.toFixed(2)} ({discountPercentage}%)
            </span>
          );
        }

        const coverage = awarded.original_price - awarded.discounted_price;
        return (
          <span className="text-sm font-medium text-green-600">
            ${Number(coverage).toFixed(2)} ({awarded.discount_percentage}%)
          </span>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Amount Paid',
      sortable: false,
      cell: (row) => {
        // Find the awarded scholarship for this application
        const awarded = awardedScholarships.find(a => a.application_id === row.id);

        if (!awarded) {
          // If not awarded yet, show potential amount to pay
          const content = contentDetails[row.content_id];
          if (!content) return <span className="text-luna-gray-400">-</span>;

          const discountPercentage = (row as any).scholarships?.discount_percentage || 0;
          const amountToPay = content.price * (1 - discountPercentage / 100);

          return (
            <span className="text-sm text-luna-gray-600">
              ${amountToPay.toFixed(2)}
            </span>
          );
        }

        return (
          <span className="text-sm font-medium text-luna-blue">
            ${Number(awarded.discounted_price).toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: 'applied_at',
      header: 'Applied',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-luna-gray-700">
          {row.applied_at ? formatDateTime(row.applied_at) : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <ScholarshipStatusBadge status={row.status as ScholarshipStatus} />
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">
          My Scholarships
        </h1>
        <p className="text-sm text-luna-gray-600">
          Track your scholarship applications and access approved learning opportunities
        </p>
      </div>

      {/* KPI Grid - User-friendly design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-luna-border-default p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm text-luna-gray-600 mb-0.5">{stat.label}</div>
                <div className="text-2xl font-bold text-luna-gray-900">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>My Scholarship Applications</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchPlaceholder="Search applications..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'withdrawn', label: 'Withdrawn' },
                  { value: 'expired', label: 'Expired' },
                ],
              },
            ]}
            onFilterChange={(column, values) => {
              if (column === 'status') {
                setStatusFilter(values);
              }
            }}
          />
          <LunaDataTable
            columns={columns}
            data={filteredApplications}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No scholarship applications yet. Apply for scholarships when enrolling in learning content!"
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleViewDetails(row)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </LunaDropdownMenuItem>
                  {row.status === 'pending' && (
                    <LunaDropdownMenuItem onClick={() => handleWithdrawClick(row.id)}>
                      <X className="w-4 h-4 mr-2" />
                      Withdraw
                    </LunaDropdownMenuItem>
                  )}
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      {/* Application Details Modal */}
      <LunaDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <LunaDialogContent className="max-w-2xl">
          {selectedApplication && (
            <>
              <LunaDialogHeader>
                <LunaDialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Scholarship Application Details
                </LunaDialogTitle>
                <LunaDialogDescription>
                  {contentDetails[selectedApplication.content_id]?.title || 'Application Details'}
                </LunaDialogDescription>
              </LunaDialogHeader>

              <LunaDialogBody className="text-sm">
                {/* Status and Content Info */}
                <div className="flex items-start gap-4 pb-4 border-b border-luna-border-default">
                  <div className="w-15 h-15 shrink-0">
                    {contentDetails[selectedApplication.content_id]?.image ? (
                      <Image
                        src={contentDetails[selectedApplication.content_id].image!}
                        alt={contentDetails[selectedApplication.content_id].title}
                        width={60}
                        height={60}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-luna-blue/10 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-luna-blue" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-luna-gray-900">
                      {contentDetails[selectedApplication.content_id]?.title}
                    </h3>
                    <p className="text-sm text-luna-gray-600 capitalize mt-1">
                      {selectedApplication.content_type}
                    </p>
                    <div className="mt-2">
                      <ScholarshipStatusBadge status={selectedApplication.status as ScholarshipStatus} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {/* Application Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <LunaInputLabel>Applied On</LunaInputLabel>
                      <p className="text-luna-gray-900 mt-1">
                        {selectedApplication.applied_at ? formatDateTime(selectedApplication.applied_at) : 'N/A'}
                      </p>
                    </div>

                    {selectedApplication.reviewed_at && (
                      <div>
                        <LunaInputLabel>Reviewed On</LunaInputLabel>
                        <p className="text-luna-gray-900 mt-1">
                          {formatDateTime(selectedApplication.reviewed_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Application Responses */}
                  {selectedApplication.application_data && (() => {
                    const appData = selectedApplication.application_data as unknown as ScholarshipApplicationData;
                    return (
                      <>
                        <div>
                          <LunaInputLabel>Employment Status</LunaInputLabel>
                          <p className="text-luna-gray-900 mt-1">
                            {appData.employment_status?.split('_').map(word =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ') || 'Not provided'}
                          </p>
                        </div>

                        <div>
                          <LunaInputLabel>Why do you need this scholarship?</LunaInputLabel>
                          <p className="text-luna-gray-900 mt-1 whitespace-pre-wrap">
                            {appData.reason_for_scholarship || 'Not provided'}
                          </p>
                        </div>

                        <div>
                          <LunaInputLabel>Career Goals</LunaInputLabel>
                          <p className="text-luna-gray-900 mt-1 whitespace-pre-wrap">
                            {appData.career_goals || 'Not provided'}
                          </p>
                        </div>

                        {appData.additional_info && (
                          <div>
                            <LunaInputLabel>Additional Information</LunaInputLabel>
                            <p className="text-luna-gray-900 mt-1 whitespace-pre-wrap">
                              {appData.additional_info}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Review Notes (if rejected) */}
                  {selectedApplication.review_notes && (
                    <div className="bg-luna-error/5 border border-luna-error/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-luna-error mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Review Notes</span>
                      </div>
                      <p className="text-luna-gray-900 whitespace-pre-wrap">
                        {selectedApplication.review_notes}
                      </p>
                    </div>
                  )}
                </div>
              </LunaDialogBody>

              <LunaDialogFooter className="mt-6">
                <LunaButton
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </LunaButton>
                {selectedApplication.status === 'pending' && (
                  <LunaButton
                    variant="danger"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleWithdrawClick(selectedApplication.id);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Withdraw Application
                  </LunaButton>
                )}
              </LunaDialogFooter>
            </>
          )}
        </LunaDialogContent>
      </LunaDialog>

      {/* Withdrawal Confirmation Dialog */}
      <LunaDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <LunaDialogContent>
          <LunaDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-luna-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-luna-warning" />
              </div>
              <LunaDialogTitle>Withdraw Scholarship Application?</LunaDialogTitle>
            </div>
            <LunaDialogDescription>
              Are you sure you want to withdraw this scholarship application? This action cannot be undone.
              You will need to submit a new application if you change your mind.
            </LunaDialogDescription>
          </LunaDialogHeader>
          <LunaDialogFooter>
            <LunaButton
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={isWithdrawing}
            >
              Cancel
            </LunaButton>
            <LunaButton
              variant="danger"
              onClick={handleWithdrawConfirm}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>
    </div>
  );
}

