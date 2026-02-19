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
import { CreateUserModal, EditUserModal, SuspendUserModal } from '@/components/luna/modals';
import { UserPlus, MoreVertical, Eye, Edit, Ban } from 'lucide-react';
import type { UserData } from './page';
import { formatAccountType, formatUserRole, formatDateTime, getInitials } from '@/lib/utils/formatters';
import type { DateRange } from '@/components/luna/date-range-picker';

const columns: DataTableColumn<UserData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-3">
        <LunaAvatar
          src={row.avatar_url || undefined}
          alt={row.name}
          fallback={getInitials(row.name)}
          size="sm"
        />
        <span className="font-medium text-luna-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    accessorKey: 'account_type',
    header: 'Account Type',
    sortable: true,
    cell: (row) => {
      const type = row.account_type;
      const variant =
        type === 'personal'
          ? 'primary'
          : type === 'organization'
            ? 'warning'
            : type === 'platformAdmin'
              ? 'error'
              : 'yellow';
      return (
        <LunaBadge variant={variant}>
          {formatAccountType(type)}
        </LunaBadge>
      );
    },
  },
  {
    accessorKey: 'user_role',
    header: 'Role',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatUserRole(row.user_role)}</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatDateTime(row.created_at)}</span>,
  },
  {
    accessorKey: 'onboarding_completed',
    header: 'Status',
    sortable: true,
    cell: (row) => {
      if (row.is_suspended) {
        return (
          <LunaBadge variant="error">
            Suspended
          </LunaBadge>
        );
      }
      return (
        <LunaBadge variant={row.onboarding_completed ? 'success' : 'warning'}>
          {row.onboarding_completed ? 'Active' : 'Pending'}
        </LunaBadge>
      );
    },
  },
];

interface UsersClientTableProps {
  initialUsers: UserData[];
}

export function UsersClientTable({ initialUsers }: UsersClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [suspendUserModalOpen, setSuspendUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRows, setSelectedRows] = useState<UserData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>();

  // Filter the data based on active filters
  const filteredUsers = initialUsers.filter((user) => {
    // Search filter
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.account_type.toLowerCase().includes(searchLower) ||
        user.user_role.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter.length > 0) {
      const userStatus = user.onboarding_completed ? 'Active' : 'Pending';
      if (!statusFilter.includes(userStatus)) return false;
    }

    // Account type filter
    if (accountTypeFilter.length > 0) {
      if (!accountTypeFilter.includes(user.account_type)) return false;
    }

    // User role filter
    if (userRoleFilter.length > 0) {
      if (!userRoleFilter.includes(user.user_role)) return false;
    }

    // Date range filter
    if (dateRange?.from || dateRange?.to) {
      const userDate = new Date(user.created_at);
      if (dateRange.from && userDate < dateRange.from) return false;
      if (dateRange.to && userDate > dateRange.to) return false;
    }

    return true;
  });

  const handleUserCreated = () => {
    setCreateUserModalOpen(false);
    router.refresh();
  };

  const handleUserUpdated = () => {
    setEditUserModalOpen(false);
    setSelectedUser(null);
    router.refresh();
  };

  const handleUserSuspended = () => {
    setSuspendUserModalOpen(false);
    setSelectedUser(null);
    router.refresh();
  };

  const handleViewUser = (user: UserData) => {
    // TODO: Navigate to user details page
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleSuspendUser = (user: UserData) => {
    setSelectedUser(user);
    setSuspendUserModalOpen(true);
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Users</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search users..."
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { value: 'Active', label: 'Active' },
                  { value: 'Pending', label: 'Pending' },
                ],
              },
              {
                column: 'account_type',
                label: 'Account Type',
                options: [
                  { value: 'personal', label: 'Personal' },
                  { value: 'organization', label: 'Organization' },
                  { value: 'platformAdmin', label: 'Platform Admin' },
                  { value: 'hybrid', label: 'Hybrid' },
                ],
              },
              {
                column: 'user_role',
                label: 'User Role',
                options: [
                  { value: 'candidate', label: 'Candidate' },
                  { value: 'org_admin', label: 'Organization Admin' },
                  { value: 'org_member', label: 'Organization Member' },
                  { value: 'platform_admin', label: 'Platform Admin' },
                ],
              },
            ]}
            activeFilters={{
              status: statusFilter,
              account_type: accountTypeFilter,
              user_role: userRoleFilter,
            }}
            onFilterChange={(column, values) => {
              if (column === 'status') setStatusFilter(values);
              if (column === 'account_type') setAccountTypeFilter(values);
              if (column === 'user_role') setUserRoleFilter(values);
            }}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onCreateClick={() => setCreateUserModalOpen(true)}
            createLabel="Create User"
            createIcon={<UserPlus className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredUsers}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            rowIdAccessor="id"
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleViewUser(row)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleEditUser(row)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleSuspendUser(row)}>
                    <Ban className="w-4 h-4 mr-2" />
                    {row.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <CreateUserModal
        open={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
        onSuccess={handleUserCreated}
        isPlatformAdmin={false}
      />

      <EditUserModal
        open={editUserModalOpen}
        onOpenChange={setEditUserModalOpen}
        onSuccess={handleUserUpdated}
        user={selectedUser ? {
          id: selectedUser.id,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          email: selectedUser.email,
          user_role: selectedUser.user_role,
        } : null}
      />

      <SuspendUserModal
        open={suspendUserModalOpen}
        onOpenChange={setSuspendUserModalOpen}
        onSuccess={handleUserSuspended}
        user={selectedUser ? {
          id: selectedUser.id,
          name: selectedUser.name,
          is_suspended: selectedUser.is_suspended,
        } : null}
      />
    </>
  );
}

