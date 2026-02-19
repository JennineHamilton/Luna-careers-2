'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaAvatar } from '@/components/luna/avatar';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { CreateOrganizationModal, EditOrganizationModal, SuspendOrganizationModal } from '@/components/luna/modals';
import { Building2, MoreVertical, Eye, Edit, Ban } from 'lucide-react';
import type { OrganizationData } from './page';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';

function formatIndustry(industry: string | null): string {
  if (!industry) return '—';
  return industry
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const columns: DataTableColumn<OrganizationData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-3">
        {row.logo_url ? (
          <img
            src={row.logo_url}
            alt={row.name}
            className="w-8 h-8 object-cover rounded-[5px]"
          />
        ) : (
          <div className="w-8 h-8 bg-luna-gray-100 rounded-[5px] flex items-center justify-center text-xs font-semibold text-luna-gray-600">
            {getInitials(row.name)}
          </div>
        )}
        <span className="font-medium text-luna-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'account_admin',
    header: 'Account Admin',
    sortable: false,
    cell: (row) => {
      if (!row.account_admin) {
        return <span className="text-luna-gray-400">—</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <LunaAvatar
            src={row.account_admin.avatar_url || undefined}
            alt={row.account_admin.name}
            fallback={getInitials(row.account_admin.name)}
            size="xs"
          />
          <span className="text-sm text-luna-gray-900">{row.account_admin.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatIndustry(row.industry)}</span>,
  },
  {
    accessorKey: 'country',
    header: 'Country',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{row.country || '—'}</span>,
  },
  {
    accessorKey: 'state',
    header: 'State',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{row.state || '—'}</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatDateTime(row.created_at, false)}</span>,
  },
];

interface EmployersClientTableProps {
  initialOrganizations: OrganizationData[];
}

export function EmployersClientTable({ initialOrganizations }: EmployersClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<OrganizationData[]>([]);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [editOrgModalOpen, setEditOrgModalOpen] = useState(false);
  const [suspendOrgModalOpen, setSuspendOrgModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);

  const handleOrganizationCreated = () => {
    setCreateOrgModalOpen(false);
    router.refresh();
  };

  const handleOrganizationUpdated = () => {
    setEditOrgModalOpen(false);
    setSelectedOrg(null);
    router.refresh();
  };

  const handleOrganizationSuspended = () => {
    setSuspendOrgModalOpen(false);
    setSelectedOrg(null);
    router.refresh();
  };

  const handleView = (org: OrganizationData) => {
    // TODO: Navigate to organization detail page
  };

  const handleEdit = (org: OrganizationData) => {
    setSelectedOrg(org);
    setEditOrgModalOpen(true);
  };

  const handleSuspend = (org: OrganizationData) => {
    setSelectedOrg(org);
    setSuspendOrgModalOpen(true);
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Organizations</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search organizations..."
            onCreateClick={() => setCreateOrgModalOpen(true)}
            createLabel="Create Organization"
            createIcon={<Building2 className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={initialOrganizations}
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

      <CreateOrganizationModal
        open={createOrgModalOpen}
        onOpenChange={setCreateOrgModalOpen}
        onSuccess={handleOrganizationCreated}
      />

      <EditOrganizationModal
        open={editOrgModalOpen}
        onOpenChange={setEditOrgModalOpen}
        onSuccess={handleOrganizationUpdated}
        organization={selectedOrg}
      />

      <SuspendOrganizationModal
        open={suspendOrgModalOpen}
        onOpenChange={setSuspendOrgModalOpen}
        onSuccess={handleOrganizationSuspended}
        organization={selectedOrg ? {
          id: selectedOrg.id,
          name: selectedOrg.name,
          is_active: selectedOrg.is_active,
        } : null}
      />
    </>
  );
}

