'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogDescription, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaInputLabel } from '@/components/luna/input';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Briefcase, Clock, CheckCircle, XCircle, Eye, X, AlertCircle, Building2, MapPin, Calendar, MoreVertical, Trash2, EyeOff } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type JobApplicationStatus = Database['public']['Enums']['job_application_status'];

// Type for preserved vacancy information in application_data
type DeletedVacancyInfo = {
  vacancy_title: string;
  vacancy_description: string;
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  is_remote: boolean;
  work_location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  deleted_at: string;
};

type ApplicationData = {
  deleted_vacancy_info?: DeletedVacancyInfo;
  [key: string]: any;
};

type ApplicationWithDetails = JobApplication & {
  vacancies: (Vacancy & {
    organizations: Organization;
  }) | null;
  application_data: ApplicationData | null;
};

interface ApplicationsPageClientProps {
  applications: ApplicationWithDetails[];
  userId: string;
}

export function ApplicationsPageClient({
  applications,
  userId,
}: ApplicationsPageClientProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<ApplicationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [hidingAppId, setHidingAppId] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // Calculate stats
  const totalApplications = applications.length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const reviewingCount = applications.filter(app => app.status === 'reviewing').length;
  const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications.toString(),
      icon: <Briefcase className="w-5 h-5 text-luna-blue" />,
      bgColor: 'bg-luna-blue/10',
    },
    {
      label: 'Pending Review',
      value: pendingCount.toString(),
      icon: <Clock className="w-5 h-5 text-luna-warning" />,
      bgColor: 'bg-luna-warning/10',
    },
    {
      label: 'Under Review',
      value: reviewingCount.toString(),
      icon: <Eye className="w-5 h-5 text-luna-primary" />,
      bgColor: 'bg-luna-primary/10',
    },
    {
      label: 'Shortlisted',
      value: shortlistedCount.toString(),
      icon: <CheckCircle className="w-5 h-5 text-luna-success" />,
      bgColor: 'bg-luna-success/10',
    },
  ];

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // When showHidden is false, only show non-hidden applications
    // When showHidden is true, only show hidden applications
    if (showHidden) {
      // Only show hidden applications
      if (!app.is_hidden) return false;
    } else {
      // Only show non-hidden applications
      if (app.is_hidden) return false;
    }

    const matchesSearch = searchQuery === '' ||
      (app.vacancies && (
        app.vacancies.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.vacancies.organizations.name.toLowerCase().includes(searchQuery.toLowerCase())
      )) ||
      // Also search in preserved vacancy data for deleted vacancies
      (!app.vacancies && app.application_data?.deleted_vacancy_info && (
        app.application_data.deleted_vacancy_info.vacancy_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.application_data.deleted_vacancy_info.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(app.status);
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (application: ApplicationWithDetails) => {
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

      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', withdrawingAppId)
        .eq('user_id', userId);

      if (error) {
        throw error;
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

  const handleHideClick = (applicationId: string) => {
    setHidingAppId(applicationId);
    setHideDialogOpen(true);
  };

  const handleHideDirectly = async (applicationId: string) => {
    setIsHiding(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('job_applications')
        .update({ is_hidden: true })
        .eq('id', applicationId)
        .eq('user_id', userId);

      if (error) throw error;

      router.refresh();
      setDetailsDialogOpen(false);
    } catch (error) {
      console.error('Error hiding application:', error);
      alert('Failed to hide application. Please try again.');
    } finally {
      setIsHiding(false);
    }
  };

  const handleHideConfirm = async () => {
    if (!hidingAppId) return;

    setIsHiding(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('job_applications')
        .update({ is_hidden: true })
        .eq('id', hidingAppId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Refresh the page to show updated data
      router.refresh();
      setHideDialogOpen(false);
      setHidingAppId(null);
    } catch (error) {
      console.error('Error hiding application:', error);
      alert('Failed to hide application. Please try again.');
    } finally {
      setIsHiding(false);
    }
  };

  const handleUnhideDirectly = async (applicationId: string) => {
    setIsHiding(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('job_applications')
        .update({ is_hidden: false })
        .eq('id', applicationId)
        .eq('user_id', userId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error('Error unhiding application:', error);
      alert('Failed to unhide application. Please try again.');
    } finally {
      setIsHiding(false);
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    const statusConfig: Record<JobApplicationStatus, { variant: 'default' | 'primary' | 'success' | 'warning' | 'error', icon: any }> = {
      pending: { variant: 'warning', icon: Clock },
      reviewing: { variant: 'primary', icon: Eye },
      shortlisted: { variant: 'success', icon: CheckCircle },
      rejected: { variant: 'error', icon: XCircle },
      accepted: { variant: 'success', icon: CheckCircle },
      withdrawn: { variant: 'default', icon: X },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <LunaBadge variant={config.variant} className="inline-flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{status}</span>
      </LunaBadge>
    );
  };

  const columns: DataTableColumn<ApplicationWithDetails>[] = [
    {
      accessorKey: 'vacancy_id',
      header: 'Job Position',
      sortable: true,
      cell: (row) => {
        const vacancy = row.vacancies;
        const isDeleted = !vacancy;

        if (isDeleted) {
          // Try to get preserved vacancy details from application_data
          const deletedInfo = row.application_data?.deleted_vacancy_info;

          if (deletedInfo) {
            // Show preserved vacancy information
            return (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <LunaAvatar
                    src={deletedInfo.organization_logo_url || undefined}
                    alt={deletedInfo.organization_name || 'Organization'}
                    fallback={(deletedInfo.organization_name || 'OR').substring(0, 2).toUpperCase()}
                    size="md"
                    className="rounded-lg opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-luna-error/20 rounded-lg">
                    <Trash2 className="w-4 h-4 text-luna-error" />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-luna-gray-700 line-through">
                    {deletedInfo.vacancy_title || 'Deleted Vacancy'}
                  </div>
                  <div className="text-xs text-luna-gray-500">
                    {deletedInfo.organization_name || 'Unknown Organization'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-luna-error mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>Position removed</span>
                  </div>
                </div>
              </div>
            );
          }

          // Fallback if no preserved data
          return (
            <div className="flex items-center gap-3">
              <LunaAvatar
                fallback={<Trash2 className="w-5 h-5 text-luna-error" />}
                size="md"
                className="rounded-lg bg-luna-error/10"
              />
              <div>
                <div className="font-medium text-luna-gray-500 line-through">Deleted Vacancy</div>
                <div className="flex items-center gap-1.5 text-xs text-luna-error">
                  <AlertCircle className="w-3 h-3" />
                  <span>This position has been removed</span>
                </div>
              </div>
            </div>
          );
        }

        const organization = vacancy.organizations;

        return (
          <div className="flex items-center gap-3">
            <LunaAvatar
              src={organization.logo_url || undefined}
              alt={organization.name}
              fallback={organization.name.substring(0, 2).toUpperCase()}
              size="md"
              className="rounded-lg"
            />
            <div>
              <div className="font-medium text-luna-gray-900">{vacancy.title}</div>
              <div className="text-xs text-luna-gray-500">{organization.name}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Location',
      sortable: false,
      cell: (row) => {
        const vacancy = row.vacancies;

        if (!vacancy) {
          // Try to get preserved location from application_data
          const deletedInfo = row.application_data?.deleted_vacancy_info;

          if (deletedInfo) {
            const locationParts = [
              deletedInfo.location_city,
              deletedInfo.location_state,
              deletedInfo.location_country
            ].filter(Boolean);
            const location = locationParts.length > 0
              ? locationParts.join(', ')
              : (deletedInfo.is_remote ? 'Remote' : 'Not specified');

            return (
              <div className="flex items-center gap-2 text-sm text-luna-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2 text-sm text-luna-gray-400">
              <MapPin className="w-4 h-4" />
              <span>N/A</span>
            </div>
          );
        }

        const locationParts = [
          vacancy.location_city,
          vacancy.location_state,
          vacancy.location_country
        ].filter(Boolean);
        const location = locationParts.length > 0
          ? locationParts.join(', ')
          : (vacancy.is_remote ? 'Remote' : 'Not specified');

        return (
          <div className="flex items-center gap-2 text-sm text-luna-gray-700">
            <MapPin className="w-4 h-4 text-luna-gray-400" />
            <span>{location}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'applied_at',
      header: 'Applied',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-luna-gray-700">
          <Calendar className="w-4 h-4 text-luna-gray-400" />
          <span>{row.applied_at ? formatDateTime(row.applied_at) : 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => getStatusBadge(row.status as JobApplicationStatus),
    },
  ];


  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">
          My Applications
        </h1>
        <p className="text-sm text-luna-gray-600">
          Track your job applications and manage your career opportunities
        </p>
      </div>

      {/* KPI Grid */}
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
          <LunaCardTitle>My Job Applications</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
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
                      { value: 'reviewing', label: 'Reviewing' },
                      { value: 'shortlisted', label: 'Shortlisted' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'accepted', label: 'Accepted' },
                      { value: 'withdrawn', label: 'Withdrawn' },
                    ],
                  },
                ]}
                onFilterChange={(column, values) => {
                  if (column === 'status') {
                    setStatusFilter(values);
                  }
                }}
              />
            </div>
            <LunaButton
              variant={showHidden ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              icon={<EyeOff className="w-4 h-4" />}
            >
              {showHidden ? 'Hide Hidden' : 'Show Hidden'}
            </LunaButton>
          </div>
          <LunaDataTable
            columns={columns}
            data={filteredApplications}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No job applications yet. Start applying to vacancies!"
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
                  {row.status === 'pending' && row.vacancies && (
                    <LunaDropdownMenuItem onClick={() => handleWithdrawClick(row.id)}>
                      <X className="w-4 h-4 mr-2" />
                      Withdraw
                    </LunaDropdownMenuItem>
                  )}
                  {!row.vacancies && !row.is_hidden && (
                    <LunaDropdownMenuItem onClick={() => handleHideClick(row.id)} className="text-luna-error">
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Application
                    </LunaDropdownMenuItem>
                  )}
                  {!row.vacancies && row.is_hidden && (
                    <LunaDropdownMenuItem onClick={() => handleUnhideDirectly(row.id)} className="text-luna-primary">
                      <Eye className="w-4 h-4 mr-2" />
                      Unhide Application
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
                  <Briefcase className="h-5 w-5" />
                  Application Details
                </LunaDialogTitle>
                <LunaDialogDescription>
                  {selectedApplication.vacancies
                    ? `${selectedApplication.vacancies.title} at ${selectedApplication.vacancies.organizations.name}`
                    : (selectedApplication.application_data?.deleted_vacancy_info
                      ? `${selectedApplication.application_data.deleted_vacancy_info.vacancy_title} at ${selectedApplication.application_data.deleted_vacancy_info.organization_name}`
                      : 'Deleted Vacancy')}
                </LunaDialogDescription>
              </LunaDialogHeader>

              <LunaDialogBody className="text-sm">
                {/* Deleted Vacancy Warning and Info */}
                {!selectedApplication.vacancies && selectedApplication.application_data?.deleted_vacancy_info && (
                  <>
                    <div className="flex items-start gap-3 p-4 bg-luna-error/10 border border-luna-error/20 rounded-lg mb-4">
                      <AlertCircle className="w-5 h-5 text-luna-error shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-luna-error mb-1">Vacancy Deleted</p>
                        <p className="text-sm text-luna-gray-700">
                          This job vacancy has been removed by the organization. Your application is no longer valid.
                          You can hide this application from your list using the actions menu.
                        </p>
                      </div>
                    </div>

                    {/* Show preserved vacancy info */}
                    <div className="flex items-start gap-4 pb-4 border-b border-luna-border-default">
                      <div className="w-15 h-15 shrink-0">
                        {selectedApplication.application_data.deleted_vacancy_info.organization_logo_url ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={selectedApplication.application_data.deleted_vacancy_info.organization_logo_url}
                              alt={selectedApplication.application_data.deleted_vacancy_info.organization_name || 'Organization'}
                              width={60}
                              height={60}
                              className="w-full h-full rounded-lg object-cover opacity-50"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-luna-error/20 rounded-lg">
                              <Trash2 className="w-6 h-6 text-luna-error" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-lg bg-luna-error/10 flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-luna-error" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-luna-gray-700 line-through">
                          {selectedApplication.application_data.deleted_vacancy_info.vacancy_title}
                        </h3>
                        <p className="text-sm text-luna-gray-600 mt-1">
                          {selectedApplication.application_data.deleted_vacancy_info.organization_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-luna-gray-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {(() => {
                              const info = selectedApplication.application_data.deleted_vacancy_info;
                              const locationParts = [
                                info.location_city,
                                info.location_state,
                                info.location_country
                              ].filter(Boolean);
                              return locationParts.length > 0
                                ? locationParts.join(', ')
                                : (info.is_remote ? 'Remote' : 'Not specified');
                            })()}
                          </span>
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(selectedApplication.status as JobApplicationStatus)}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Deleted Vacancy Warning (no preserved data) */}
                {!selectedApplication.vacancies && !selectedApplication.application_data?.deleted_vacancy_info && (
                  <div className="flex items-start gap-3 p-4 bg-luna-error/10 border border-luna-error/20 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-luna-error shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-luna-error mb-1">Vacancy Deleted</p>
                      <p className="text-sm text-luna-gray-700">
                        This job vacancy has been removed by the organization. Your application is no longer valid.
                        You can hide this application from your list using the actions menu.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status and Vacancy Info (active vacancy) */}
                {selectedApplication.vacancies && (
                  <div className="flex items-start gap-4 pb-4 border-b border-luna-border-default">
                    <div className="w-15 h-15 shrink-0">
                      {selectedApplication.vacancies.organizations.logo_url ? (
                        <Image
                          src={selectedApplication.vacancies.organizations.logo_url}
                          alt={selectedApplication.vacancies.organizations.name}
                          width={60}
                          height={60}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-luna-blue/10 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-luna-blue" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-luna-gray-900">
                        {selectedApplication.vacancies.title}
                      </h3>
                      <p className="text-sm text-luna-gray-600 mt-1">
                        {selectedApplication.vacancies.organizations.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-luna-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {(() => {
                            const vacancy = selectedApplication.vacancies;
                            const locationParts = [
                              vacancy.location_city,
                              vacancy.location_state,
                              vacancy.location_country
                            ].filter(Boolean);
                            return locationParts.length > 0
                              ? locationParts.join(', ')
                              : (vacancy.is_remote ? 'Remote' : 'Not specified');
                          })()}
                        </span>
                      </div>
                      <div className="mt-2">
                        {getStatusBadge(selectedApplication.status as JobApplicationStatus)}
                      </div>
                    </div>
                  </div>
                )}

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

                  {/* Application Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Your professional profile was shared with the employer when you applied for this position.
                    </p>
                  </div>

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
                {!selectedApplication.vacancies ? (
                  // Show Hide button for deleted vacancies - hide directly without confirmation
                  <LunaButton
                    variant="danger"
                    onClick={() => handleHideDirectly(selectedApplication.id)}
                    disabled={isHiding}
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    {isHiding ? 'Hiding...' : 'Hide Application'}
                  </LunaButton>
                ) : selectedApplication.status === 'pending' ? (
                  // Show Withdraw button for active vacancies with pending status
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
                ) : null}
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
              <LunaDialogTitle>Withdraw Job Application?</LunaDialogTitle>
            </div>
            <LunaDialogDescription>
              Are you sure you want to withdraw this job application? This action cannot be undone.
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

      {/* Hide Application Confirmation Dialog */}
      <LunaDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <LunaDialogContent>
          <LunaDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-luna-error/10 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-luna-error" />
              </div>
              <LunaDialogTitle>Hide Application?</LunaDialogTitle>
            </div>
            <LunaDialogDescription>
              This will hide the application from your list. The vacancy for this application has been deleted by the organization, so this application is no longer valid.
            </LunaDialogDescription>
          </LunaDialogHeader>
          <LunaDialogBody className="text-sm">
            <div className="flex items-start gap-3 p-3 bg-luna-blue/10 border border-luna-blue/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-luna-blue shrink-0 mt-0.5" />
              <div className="text-luna-gray-700">
                <p className="font-semibold mb-1">You can view hidden applications anytime</p>
                <p>Hidden applications can be viewed by toggling the "Show Hidden" option in the toolbar.</p>
              </div>
            </div>
          </LunaDialogBody>
          <LunaDialogFooter>
            <LunaButton
              variant="outline"
              onClick={() => setHideDialogOpen(false)}
              disabled={isHiding}
            >
              Cancel
            </LunaButton>
            <LunaButton
              variant="primary"
              onClick={handleHideConfirm}
              loading={isHiding}
            >
              Hide Application
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>
    </div>
  );
}

