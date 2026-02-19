'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaButton } from '@/components/luna/button';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogDescription, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaBadge } from '@/components/luna/badge';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { LunaToast, LunaToastProvider, LunaToastViewport } from '@/components/luna/toast';
import { Briefcase, Users, Clock, CheckCircle, Plus, Pencil, Trash2, Eye, MapPin, DollarSign, Calendar, MoreVertical, Archive, AlertTriangle } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import { CreateVacancyModal } from './create-vacancy-modal-new';
import { EditVacancyModal } from './edit-vacancy-modal-new';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type VacancyWithApplicationCount = Vacancy & {
  application_count: number;
};

interface VacanciesPageClientProps {
  vacancies: VacancyWithApplicationCount[];
  organizationId: string;
  slug: string;
}

export function VacanciesPageClient({
  vacancies,
  organizationId,
  slug,
}: VacanciesPageClientProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<VacancyWithApplicationCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyWithApplicationCount | null>(null);

  // Toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description: string;
  }>({
    variant: 'success',
    title: '',
    description: '',
  });

  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Calculate stats
  const totalVacancies = vacancies.length;
  const activeVacancies = vacancies.filter(v => v.is_active).length;
  const totalApplications = vacancies.reduce((sum, v) => sum + v.application_count, 0);
  const pendingApplications = 0; // Will be calculated from applications data

  const stats = [
    {
      label: 'Total Vacancies',
      value: totalVacancies.toString(),
      icon: <Briefcase className="w-5 h-5 text-luna-blue" />,
      bgColor: 'bg-luna-blue/10',
    },
    {
      label: 'Active Vacancies',
      value: activeVacancies.toString(),
      icon: <CheckCircle className="w-5 h-5 text-luna-success" />,
      bgColor: 'bg-luna-success/10',
    },
    {
      label: 'Total Applications',
      value: totalApplications.toString(),
      icon: <Users className="w-5 h-5 text-luna-primary" />,
      bgColor: 'bg-luna-primary/10',
    },
    {
      label: 'Pending Review',
      value: pendingApplications.toString(),
      icon: <Clock className="w-5 h-5 text-luna-warning" />,
      bgColor: 'bg-luna-warning/10',
    },
  ];

  // Filter vacancies
  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = searchQuery === '' ||
      vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacancy.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const statusFilter = activeFilters['status'] || [];
    const matchesStatus = statusFilter.length === 0 ||
      (statusFilter.includes('active') && vacancy.is_active) ||
      (statusFilter.includes('inactive') && !vacancy.is_active);

    const employmentTypeFilter = activeFilters['employment_type'] || [];
    const matchesEmploymentType = employmentTypeFilter.length === 0 ||
      employmentTypeFilter.includes(vacancy.employment_type);

    return matchesSearch && matchesStatus && matchesEmploymentType;
  });

  const handleFilterChange = (column: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [column]: values,
    }));
  };

  const showToast = (variant: 'success' | 'error' | 'warning' | 'info', title: string, description: string) => {
    setToastConfig({ variant, title, description });
    setToastOpen(true);
  };

  const handleEdit = (vacancy: VacancyWithApplicationCount) => {
    setSelectedVacancy(vacancy);
    setEditModalOpen(true);
  };

  const handleDelete = (vacancy: VacancyWithApplicationCount) => {
    setSelectedVacancy(vacancy);
    setDeleteModalOpen(true);
  };

  const handleArchive = (vacancy: VacancyWithApplicationCount) => {
    setSelectedVacancy(vacancy);
    setArchiveModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVacancy) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {

      const { data, error } = await supabase
        .from('vacancies')
        .delete()
        .eq('id', selectedVacancy.id)
        .select();



      if (error) {
        console.error('Supabase error:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        throw new Error(error.message || 'Failed to delete vacancy');
      }

      showToast('success', 'Vacancy Deleted', `"${selectedVacancy.title}" has been permanently deleted.`);
      setDeleteModalOpen(false);
      setSelectedVacancy(null);
      router.refresh();
    } catch (error: any) {
      console.error('Caught error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error));
      const errorMessage = error?.message || 'Failed to delete vacancy. Please try again.';
      showToast('error', 'Delete Failed', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!selectedVacancy) return;

    setIsArchiving(true);
    const supabase = createClient();
    const newStatus = !selectedVacancy.is_active;

    try {
      const { error } = await supabase
        .from('vacancies')
        .update({ is_active: newStatus })
        .eq('id', selectedVacancy.id);

      if (error) throw error;

      showToast(
        'success',
        newStatus ? 'Vacancy Activated' : 'Vacancy Archived',
        `"${selectedVacancy.title}" has been ${newStatus ? 'activated' : 'archived'}.`
      );
      setArchiveModalOpen(false);
      setSelectedVacancy(null);
      router.refresh();
    } catch (error) {
      console.error('Error archiving vacancy:', error);
      showToast('error', 'Archive Failed', 'Failed to update vacancy status. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleViewApplications = (vacancyId: string) => {
    router.push(`/org/${slug}/applicants?vacancy=${vacancyId}`);
  };

  // Format employment type for display
  const formatEmploymentType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Format experience level for display
  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Format location
  const formatLocation = (vacancy: Vacancy) => {
    if (vacancy.is_remote) return 'Remote';
    const parts = [vacancy.location_city, vacancy.location_state, vacancy.location_country].filter(Boolean);
    return parts.join(', ') || 'Not specified';
  };

  // Format salary range
  const formatSalary = (vacancy: Vacancy) => {
    if (!vacancy.salary_range_min && !vacancy.salary_range_max) return 'Not specified';
    const currency = vacancy.salary_currency || 'USD';
    if (vacancy.salary_range_min && vacancy.salary_range_max) {
      return `${currency} ${vacancy.salary_range_min.toLocaleString()} - ${vacancy.salary_range_max.toLocaleString()}`;
    }
    if (vacancy.salary_range_min) {
      return `${currency} ${vacancy.salary_range_min.toLocaleString()}+`;
    }
    return `Up to ${currency} ${vacancy.salary_range_max?.toLocaleString()}`;
  };

  const columns: DataTableColumn<VacancyWithApplicationCount>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      sortable: true,
      cell: (vacancy) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{vacancy.title}</span>
          <span className="text-sm text-gray-500">{formatEmploymentType(vacancy.employment_type)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'location_city',
      header: 'Location',
      cell: (vacancy) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {formatLocation(vacancy)}
        </div>
      ),
    },
    {
      accessorKey: 'experience_level',
      header: 'Experience',
      sortable: true,
      cell: (vacancy) => (
        <span className="text-sm text-gray-600">{formatExperienceLevel(vacancy.experience_level)}</span>
      ),
    },
    {
      accessorKey: 'application_count',
      header: 'Applications',
      sortable: true,
      cell: (vacancy) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{vacancy.application_count}</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (vacancy) => (
        <LunaBadge variant={vacancy.is_active ? 'success' : 'default'}>
          {vacancy.is_active ? 'Active' : 'Inactive'}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Posted',
      sortable: true,
      cell: (vacancy) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {formatDateTime(vacancy.created_at || '')}
        </div>
      ),
    },
  ];

  return (
    <LunaToastProvider>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">
            Job Vacancies
          </h1>
          <p className="text-sm text-luna-gray-600">
            Manage your organization's job postings and applications
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

      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Vacancies</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search vacancies..."
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ],
              },
              {
                column: 'employment_type',
                label: 'Employment Type',
                options: [
                  { label: 'Full Time', value: 'full-time' },
                  { label: 'Part Time', value: 'part-time' },
                  { label: 'Contract', value: 'contract' },
                  { label: 'Internship', value: 'internship' },
                  { label: 'Temporary', value: 'temporary' },
                ],
              },
            ]}
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Vacancy"
            createIcon={<Plus className="w-4 h-4" />}
          />
          <LunaDataTable
            data={filteredVacancies}
            columns={columns}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No vacancies found. Create your first job posting to get started."
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleViewApplications(row.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Applications
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleArchive(row)}>
                    <Archive className="w-4 h-4 mr-2" />
                    {row.is_active ? 'Archive' : 'Activate'}
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleDelete(row)} className="text-luna-error">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      {/* Create Vacancy Modal */}
      <CreateVacancyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        organizationId={organizationId}
        onSuccess={() => router.refresh()}
      />

      {/* Edit Vacancy Modal */}
      <EditVacancyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        vacancy={selectedVacancy}
        onSuccess={() => router.refresh()}
      />

      {/* Archive Vacancy Modal */}
      <LunaDialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <LunaDialogContent className="max-w-md">
          <LunaDialogHeader>
            <LunaDialogTitle className="flex items-center gap-2">
              <Archive className={`h-5 w-5 ${selectedVacancy?.is_active ? 'text-luna-warning' : 'text-luna-success'}`} />
              {selectedVacancy?.is_active ? 'Archive Vacancy' : 'Activate Vacancy'}
            </LunaDialogTitle>
            <LunaDialogDescription>
              {selectedVacancy?.is_active
                ? `Archive "${selectedVacancy?.title}" and hide it from job seekers`
                : `Activate "${selectedVacancy?.title}" and make it visible to job seekers`}
            </LunaDialogDescription>
          </LunaDialogHeader>
          <LunaDialogBody>
            <div className="text-sm text-luna-gray-600">
              {selectedVacancy?.is_active ? (
                <>
                  <p>Archiving this vacancy will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Hide it from the public job listings</li>
                    <li>Prevent new applications</li>
                    <li>Keep existing applications intact</li>
                  </ul>
                  <p className="mt-3">You can reactivate it anytime.</p>
                </>
              ) : (
                <>
                  <p>Activating this vacancy will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Make it visible in public job listings</li>
                    <li>Allow job seekers to apply</li>
                    <li>Resume accepting applications</li>
                  </ul>
                </>
              )}
            </div>
          </LunaDialogBody>
          <LunaDialogFooter>
            <LunaButton
              variant="outline"
              onClick={() => setArchiveModalOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </LunaButton>
            <LunaButton
              variant="primary"
              onClick={handleArchiveConfirm}
              loading={isArchiving}
            >
              {selectedVacancy?.is_active ? 'Archive' : 'Activate'}
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>

      {/* Delete Vacancy Modal */}
      <LunaDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <LunaDialogContent className="max-w-md">
          <LunaDialogHeader>
            <LunaDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-luna-error" />
              Delete Vacancy
            </LunaDialogTitle>
            <LunaDialogDescription>
              Permanently delete "{selectedVacancy?.title}"
            </LunaDialogDescription>
          </LunaDialogHeader>
          <LunaDialogBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-luna-error/10 border border-luna-error/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-luna-error shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-luna-error mb-1">Warning: This action cannot be undone!</p>
                  <p className="text-luna-gray-700">
                    Deleting this vacancy will permanently remove:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-luna-gray-600">
                    <li>The vacancy and all its details</li>
                    <li>All {selectedVacancy?.application_count || 0} application(s) for this position</li>
                    <li>All related application data</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-luna-gray-600">
                Consider <span className="font-semibold">archiving</span> instead if you want to hide the vacancy while preserving applications.
              </p>
            </div>
          </LunaDialogBody>
          <LunaDialogFooter>
            <LunaButton
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </LunaButton>
            <LunaButton
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Permanently
            </LunaButton>
          </LunaDialogFooter>
        </LunaDialogContent>
      </LunaDialog>

      {/* Toast Notifications */}
      <LunaToast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastConfig.variant}
        title={toastConfig.title}
        description={toastConfig.description}
      />
      <LunaToastViewport />
    </div>
    </LunaToastProvider>
  );
}

