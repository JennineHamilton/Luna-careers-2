'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Briefcase, MoreVertical, Eye, Edit, Ban } from 'lucide-react';
import type { VacancyData } from './page';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';
import Image from 'next/image';
import { CreateVacancyModal } from './create-vacancy-modal';
import { EditVacancyModal } from './edit-vacancy-modal-new';
import { SuspendVacancyModal } from './suspend-vacancy-modal';

function formatEmploymentType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatExperienceLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatLocation(vacancy: VacancyData): string {
  if (vacancy.is_remote) return 'Remote';
  const parts = [
    vacancy.location_city,
    vacancy.location_state,
    vacancy.location_country
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Not specified';
}

const columns: DataTableColumn<VacancyData>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-luna-blue shrink-0" />
        <span className="font-medium text-luna-gray-900">{row.title}</span>
      </div>
    ),
  },
  {
    accessorKey: 'organization',
    header: 'Organization',
    sortable: false,
    cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0">
          {row.organization.logo_url ? (
            <Image
              src={row.organization.logo_url}
              alt={row.organization.name}
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-luna-gray-100 rounded-lg flex items-center justify-center text-xs font-semibold text-luna-gray-600">
              {getInitials(row.organization.name)}
            </div>
          )}
        </div>
        <span className="text-sm text-luna-gray-900">{row.organization.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'location_city',
    header: 'Location',
    sortable: false,
    cell: (row) => <span className="text-luna-gray-900">{formatLocation(row)}</span>,
  },
  {
    accessorKey: 'employment_type',
    header: 'Type',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant="default">
        {formatEmploymentType(row.employment_type)}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'experience_level',
    header: 'Level',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant="default">
        {formatExperienceLevel(row.experience_level)}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'applications_count',
    header: 'Applications',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{row.applications_count}</span>,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={row.is_active ? 'success' : 'error'}>
        {row.is_active ? 'Active' : 'Suspended'}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatDateTime(row.created_at, false)}</span>,
  },
];

interface VacanciesClientTableProps {
  initialVacancies: VacancyData[];
}

export function VacanciesClientTable({ initialVacancies }: VacanciesClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<VacancyData[]>([]);
  const [createVacancyModalOpen, setCreateVacancyModalOpen] = useState(false);
  const [editVacancyModalOpen, setEditVacancyModalOpen] = useState(false);
  const [suspendVacancyModalOpen, setSuspendVacancyModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyData | null>(null);

  const handleVacancyCreated = () => {
    setCreateVacancyModalOpen(false);
    router.refresh();
  };

  const handleVacancyUpdated = () => {
    setEditVacancyModalOpen(false);
    setSelectedVacancy(null);
    router.refresh();
  };

  const handleVacancySuspended = () => {
    setSuspendVacancyModalOpen(false);
    setSelectedVacancy(null);
    router.refresh();
  };

  const handleView = (vacancy: VacancyData) => {
    // TODO: Navigate to vacancy detail page
  };

  const handleEdit = (vacancy: VacancyData) => {
    setSelectedVacancy(vacancy);
    setEditVacancyModalOpen(true);
  };

  const handleSuspend = (vacancy: VacancyData) => {
    setSelectedVacancy(vacancy);
    setSuspendVacancyModalOpen(true);
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Vacancies</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search vacancies..."
            onCreateClick={() => setCreateVacancyModalOpen(true)}
            createLabel="Create Vacancy"
            createIcon={<Briefcase className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={initialVacancies}
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
                  <LunaDropdownMenuItem onClick={() => handleView(row)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleSuspend(row)}>
                    <Ban className="w-4 h-4 mr-2" />
                    {row.is_active === false ? 'Unsuspend' : 'Suspend'}
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <CreateVacancyModal
        open={createVacancyModalOpen}
        onOpenChange={setCreateVacancyModalOpen}
        onSuccess={handleVacancyCreated}
      />

      <EditVacancyModal
        open={editVacancyModalOpen}
        onOpenChange={setEditVacancyModalOpen}
        onSuccess={handleVacancyUpdated}
        vacancy={selectedVacancy}
      />

      <SuspendVacancyModal
        open={suspendVacancyModalOpen}
        onOpenChange={setSuspendVacancyModalOpen}
        onSuccess={handleVacancySuspended}
        vacancy={selectedVacancy}
      />
    </>
  );
}

