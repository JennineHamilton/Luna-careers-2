'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { Eye } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { SCHOLARSHIP_STATUS_CONFIG } from '@/types/scholarship';
import { ScholarshipReviewModal } from '../modals/scholarship-review-modal';
import Image from 'next/image';

type ScholarshipApplicationRow = Database['public']['Tables']['scholarship_applications']['Row'];

interface ScholarshipApplication extends ScholarshipApplicationRow {
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  scholarships: {
    id: string;
    name: string;
    type: string;
    discount_percentage: number;
  } | null;
}

interface ScholarshipApplicationsTabProps {
  initialApplications: ScholarshipApplication[];
  contentDetails: Record<string, { title: string; image: string | null; type: string }>;
  currentUserId: string;
}

export function ScholarshipApplicationsTab({
  initialApplications,
  contentDetails,
  currentUserId,
}: ScholarshipApplicationsTabProps) {
  const [applications, setApplications] = useState<ScholarshipApplication[]>(initialApplications);
  const [selectedRows, setSelectedRows] = useState<ScholarshipApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);

  const columns: DataTableColumn<ScholarshipApplication>[] = [
    {
      accessorKey: 'user_id',
      header: 'Applicant',
      sortable: true,
      cell: (row) => {
        const user = row.users;
        if (!user) return <span className="text-luna-gray-400">Unknown User</span>;
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-luna-gray-900">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-xs text-luna-gray-500">{user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'content_id',
      header: 'Learning Content',
      sortable: true,
      cell: (row) => {
        const content = contentDetails[row.content_id];
        if (!content) {
          return <span className="text-luna-gray-400 text-sm">Unknown Content</span>;
        }

        return (
          <div className="flex items-center gap-3">
            {content.image ? (
              <Image
                src={content.image}
                alt={content.title}
                width={40}
                height={40}
                className="rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-luna-gray-200 flex items-center justify-center shrink-0">
                <span className="text-xs text-luna-gray-600 font-medium">
                  {content.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-luna-gray-900 text-sm truncate">{content.title}</span>
              <span className="text-xs text-luna-gray-500 capitalize">{content.type}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'scholarship_id',
      header: 'Scholarship',
      sortable: false,
      cell: (row) => {
        const scholarship = row.scholarships;
        if (!scholarship) return <span className="text-luna-gray-400">-</span>;
        
        return (
          <div className="flex flex-col">
            <span className="text-sm text-luna-gray-900">{scholarship.name}</span>
            <span className="text-xs text-luna-gray-500">
              {scholarship.type === 'full' ? 'Full' : 'Partial'} ({scholarship.discount_percentage}%)
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'applied_at',
      header: 'Applied',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-luna-gray-900">
          {row.applied_at ? formatDateTime(row.applied_at, false) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        const config = SCHOLARSHIP_STATUS_CONFIG[row.status as keyof typeof SCHOLARSHIP_STATUS_CONFIG];
        return (
          <LunaBadge variant={config.variant}>
            {config.label}
          </LunaBadge>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Action',
      sortable: false,
      cell: (row) => (
        <LunaButton
          variant="ghost"
          size="sm"
          onClick={() => handleReview(row)}
        >
          <Eye className="w-4 h-4" />
          Review
        </LunaButton>
      ),
    },
  ];

  const handleReview = (application: ScholarshipApplication) => {
    setSelectedApplication(application);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = (updatedApplication: ScholarshipApplication) => {
    setApplications(applications.map(app => 
      app.id === updatedApplication.id ? updatedApplication : app
    ));
    setReviewModalOpen(false);
    setSelectedApplication(null);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' ||
      app.users?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.users?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.users?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contentDetails[app.content_id]?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Scholarship Applications</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search applicants or content..."
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                  { label: 'Expired', value: 'expired' },
                  { label: 'Withdrawn', value: 'withdrawn' },
                ],
              },
            ]}
            activeFilters={{ status: statusFilter === 'all' ? [] : [statusFilter] }}
            onFilterChange={(column, values) => {
              if (column === 'status') {
                setStatusFilter(values.length > 0 ? values[0] : 'all');
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
          />
        </LunaCardContent>
      </LunaCard>

      {selectedApplication && (
        <ScholarshipReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          application={selectedApplication}
          contentDetails={contentDetails}
          currentUserId={currentUserId}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}

