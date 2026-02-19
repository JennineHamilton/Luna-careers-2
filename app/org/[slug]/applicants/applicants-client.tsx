'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Users, Eye, CheckCircle, XCircle, Clock, FileText, MoreVertical, User } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { ViewProfileModal } from './view-profile-modal';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type User = Database['public']['Tables']['users']['Row'];

type ApplicationWithDetails = JobApplication & {
  vacancies: Vacancy;
  users: User;
};

interface ApplicantsPageClientProps {
  applications: ApplicationWithDetails[];
  organizationId: string;
  slug: string;
}

export function ApplicantsPageClient({
  applications,
  organizationId,
  slug,
}: ApplicantsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<ApplicationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState<string>('');

  // Auto-filter by vacancy from URL params
  useEffect(() => {
    const vacancyId = searchParams.get('vacancy');
    if (vacancyId) {
      setActiveFilters(prev => ({
        ...prev,
        vacancy: [vacancyId],
      }));
    }
  }, [searchParams]);

  // Calculate stats
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const shortlistedApplications = applications.filter(app => app.status === 'shortlisted').length;
  const reviewingApplications = applications.filter(app => app.status === 'reviewing').length;

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications.toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Pending Review',
      value: pendingApplications.toString(),
      icon: 'Clock' as const,
    },
    {
      label: 'Under Review',
      value: reviewingApplications.toString(),
      icon: 'FileText' as const,
    },
    {
      label: 'Shortlisted',
      value: shortlistedApplications.toString(),
      icon: 'CheckCircle' as const,
    },
  ];

  // Format status
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewing': return 'primary';
      case 'shortlisted': return 'success';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(application => {
    const matchesSearch = searchQuery === '' ||
      application.users.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.users.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.vacancies.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] || [];
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(application.status);
    
    const vacancyFilter = activeFilters['vacancy'] || [];
    const matchesVacancy = vacancyFilter.length === 0 || (application.vacancy_id && vacancyFilter.includes(application.vacancy_id));
    
    return matchesSearch && matchesStatus && matchesVacancy;
  });

  const handleFilterChange = (column: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [column]: values,
    }));
  };

  const handleViewApplication = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setViewModalOpen(true);
  };

  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn'
  ) => {
    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      router.refresh();
      setViewModalOpen(false);
    } catch (err: any) {
      console.error('Error updating application status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get unique vacancies for filter
  const uniqueVacancies = Array.from(new Set(applications.map(app => app.vacancies.title)))
    .map(title => {
      const vacancy = applications.find(app => app.vacancies.title === title)?.vacancies;
      return {
        label: title,
        value: vacancy?.id || '',
      };
    });

  // Define columns
  const columns: DataTableColumn<ApplicationWithDetails>[] = [
    {
      accessorKey: 'user_id',
      header: 'Applicant',
      sortable: true,
      cell: (application) => {
        const user = application.users;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-luna-blue/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-luna-blue" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'vacancy_id',
      header: 'Position',
      sortable: true,
      cell: (application) => (
        <span className="text-gray-900">{application.vacancies.title}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (application) => (
        <LunaBadge variant={getStatusVariant(application.status)}>
          {formatStatus(application.status)}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'applied_at',
      header: 'Applied',
      sortable: true,
      cell: (application) => (
        <span className="text-gray-600">{formatDateTime(application.applied_at || '')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Applicants"
        description="Manage job applications for your vacancies"
      />

      <AdminKPIGrid kpis={stats} />

      <LunaCard>
          <LunaCardHeader>
            <LunaCardTitle>All Applications</LunaCardTitle>
          </LunaCardHeader>
          <LunaCardContent>
            <LunaDataTableToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search applicants..."
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              filters={[
                {
                  column: 'status',
                  label: 'Status',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Reviewing', value: 'reviewing' },
                    { label: 'Shortlisted', value: 'shortlisted' },
                    { label: 'Accepted', value: 'accepted' },
                    { label: 'Rejected', value: 'rejected' },
                    { label: 'Withdrawn', value: 'withdrawn' },
                  ],
                },
                {
                  column: 'vacancy',
                  label: 'Position',
                  options: uniqueVacancies,
                },
              ]}
            />
            <LunaDataTable
              columns={columns}
              data={filteredApplications}
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              striped
              hoverable
              actionsColumn={(row) => (
                <LunaDropdownMenu>
                  <LunaDropdownMenuTrigger asChild>
                    <LunaButton variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </LunaButton>
                  </LunaDropdownMenuTrigger>
                  <LunaDropdownMenuContent align="end">
                    <LunaDropdownMenuItem onClick={() => {
                      setSelectedUserId(row.user_id);
                      setSelectedApplicationId(row.id);
                      setSelectedApplicationStatus(row.status);
                      setProfileModalOpen(true);
                    }}>
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </LunaDropdownMenuItem>
                    <LunaDropdownMenuItem onClick={() => { /* TODO: Update status */ }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Status
                    </LunaDropdownMenuItem>
                  </LunaDropdownMenuContent>
                </LunaDropdownMenu>
              )}
            />
          </LunaCardContent>
        </LunaCard>

      {/* View Application Modal */}
      <LunaDialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <LunaDialogContent className="max-w-3xl">
          <LunaDialogHeader>
            <LunaDialogTitle>Application Details</LunaDialogTitle>
          </LunaDialogHeader>
          {selectedApplication && (
            <LunaDialogBody className="space-y-6">
              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication.users.first_name} {selectedApplication.users.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedApplication.users.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="font-medium text-gray-900">{selectedApplication.vacancies.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applied On</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(selectedApplication.applied_at || '')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <LunaBadge variant={getStatusVariant(selectedApplication.status)}>
                      {formatStatus(selectedApplication.status)}
                    </LunaBadge>
                  </div>
                </div>
              </div>

              {/* Profile Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Profile</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View the applicant's complete professional profile including education, experience, certifications, and skills.
                </p>
                <LunaButton
                  variant="outline"
                  onClick={() => router.push(`/profile/${selectedApplication.user_id}`)}
                  icon={<User className="w-4 h-4" />}
                >
                  View Full Profile
                </LunaButton>
              </div>

              {/* Status Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  <LunaButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'reviewing')}
                    disabled={isUpdating || selectedApplication.status === 'reviewing'}
                  >
                    Mark as Reviewing
                  </LunaButton>
                  <LunaButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'shortlisted')}
                    disabled={isUpdating || selectedApplication.status === 'shortlisted'}
                  >
                    Shortlist
                  </LunaButton>
                  <LunaButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'accepted')}
                    disabled={isUpdating || selectedApplication.status === 'accepted'}
                  >
                    Accept
                  </LunaButton>
                  <LunaButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                    disabled={isUpdating || selectedApplication.status === 'rejected'}
                  >
                    Reject
                  </LunaButton>
                </div>
              </div>
            </LunaDialogBody>
          )}
          <LunaDialogFooter>
            <LunaButton variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>

      {/* Profile Modal */}
      {selectedUserId && selectedApplicationId && (
        <ViewProfileModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          userId={selectedUserId}
          applicationId={selectedApplicationId}
          currentStatus={selectedApplicationStatus}
          onStatusUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

