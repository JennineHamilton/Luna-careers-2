'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { InviteTeamMemberModal, EditOrgTeamMemberModal, RemoveOrgTeamMemberModal } from '@/components/luna/modals';
import { Users, UserCheck, UserPlus, Edit, Trash2, MoreVertical, User } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import Image from 'next/image';

type User = Database['public']['Tables']['users']['Row'];

interface TeamPageClientProps {
  teamMembers: User[];
  organizationId: string;
  organizationName: string;
  slug: string;
}

export function TeamPageClient({
  teamMembers,
  organizationId,
  organizationName,
  slug,
}: TeamPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // Calculate stats
  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.onboarding_completed).length,
    pending: teamMembers.filter(m => !m.onboarding_completed).length,
  };

  // KPI cards
  const kpiCards = [
    {
      label: 'Total Members',
      value: stats.total.toString(),
      icon: <Users className="w-5 h-5" />,
      bgColor: 'bg-blue-500',
    },
    {
      label: 'Active Members',
      value: stats.active.toString(),
      icon: <UserCheck className="w-5 h-5" />,
      bgColor: 'bg-green-500',
    },
    {
      label: 'Pending Invites',
      value: stats.pending.toString(),
      icon: <UserPlus className="w-5 h-5" />,
      bgColor: 'bg-orange-500',
    },
  ];

  const handleFilterChange = (column: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [column]: values,
    }));
  };



  const handleEditMember = (member: User) => {
    setSelectedMember(member);
    setEditModalOpen(true);
  };

  const handleRemoveMember = (member: User) => {
    setSelectedMember(member);
    setRemoveModalOpen(true);
  };

  const handleInviteSuccess = () => {
    setInviteModalOpen(false);
    router.refresh();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedMember(null);
    router.refresh();
  };

  const handleRemoveSuccess = () => {
    setRemoveModalOpen(false);
    setSelectedMember(null);
    router.refresh();
  };

  // Format role for display
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      org_admin: 'Organization Admin',
      hr_manager: 'HR Manager',
      recruiter: 'Recruiter',
      hiring_manager: 'Hiring Manager',
      organization_member: 'Member',
    };
    return roleLabels[role] || role;
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    if (role === 'org_admin') return 'primary';
    if (role === 'hr_manager') return 'warning';
    return 'default';
  };

  // Define columns
  const columns: DataTableColumn<User>[] = [
    {
      accessorKey: 'id',
      header: 'Member',
      sortable: true,
      cell: (member) => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={`${member.first_name} ${member.last_name}`}
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
                {member.first_name} {member.last_name}
              </span>
              <span className="text-sm text-gray-500">{member.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'user_role',
      header: 'Role',
      sortable: true,
      cell: (member) => (
        <LunaBadge variant={getRoleBadgeVariant(member.user_role || '')}>
          {getRoleLabel(member.user_role || '')}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'onboarding_completed',
      header: 'Status',
      sortable: true,
      cell: (member) => (
        <LunaBadge variant={member.onboarding_completed ? 'success' : 'warning'}>
          {member.onboarding_completed ? 'Active' : 'Pending'}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      sortable: true,
      cell: (member) => (
        <span className="text-gray-600">{formatDateTime(member.created_at || '')}</span>
      ),
    },
  ];

  // Filter team members
  const filteredTeamMembers = useMemo(() => {
    let filtered = teamMembers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.user_role?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilters.status && activeFilters.status.length > 0) {
      filtered = filtered.filter((member) => {
        const status = member.onboarding_completed ? 'active' : 'pending';
        return activeFilters.status.includes(status);
      });
    }

    // Apply role filter
    if (activeFilters.role && activeFilters.role.length > 0) {
      filtered = filtered.filter((member) =>
        activeFilters.role.includes(member.user_role || '')
      );
    }

    return filtered;
  }, [teamMembers, searchQuery, activeFilters]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">Team Management</h1>
        <p className="text-sm text-luna-gray-600">
          Manage team members for {organizationName}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <LunaCard key={index} className="hover:shadow-sm transition-shadow">
            <LunaCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-luna-gray-600 mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-luna-gray-900">{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${kpi.bgColor} flex items-center justify-center text-white`}>
                  {kpi.icon}
                </div>
              </div>
            </LunaCardContent>
          </LunaCard>
        ))}
      </div>

      {/* Data Table */}
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Team Members</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search team members..."
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                ],
              },
              {
                column: 'role',
                label: 'Role',
                options: [
                  { value: 'org_admin', label: 'Organization Admin' },
                  { value: 'hr_manager', label: 'HR Manager' },
                  { value: 'recruiter', label: 'Recruiter' },
                  { value: 'hiring_manager', label: 'Hiring Manager' },
                  { value: 'organization_member', label: 'Member' },
                ],
              },
            ]}
            onCreateClick={() => setInviteModalOpen(true)}
            createLabel="Invite Team Member"
            createIcon={<UserPlus className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredTeamMembers}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No team members found. Invite your first team member to get started."
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleEditMember(row)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Role
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleRemoveMember(row)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      {/* Invite Team Member Modal */}
      <InviteTeamMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        organizationId={organizationId}
        organizationName={organizationName}
        onSuccess={handleInviteSuccess}
      />

      {/* Edit Team Member Modal */}
      <EditOrgTeamMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={selectedMember ? {
          id: selectedMember.id,
          first_name: selectedMember.first_name || '',
          last_name: selectedMember.last_name || '',
          email: selectedMember.email || '',
          user_role: selectedMember.user_role || '',
        } : null}
        onSuccess={handleEditSuccess}
      />

      {/* Remove Team Member Modal */}
      <RemoveOrgTeamMemberModal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        member={selectedMember ? {
          id: selectedMember.id,
          first_name: selectedMember.first_name || '',
          last_name: selectedMember.last_name || '',
          email: selectedMember.email || '',
        } : null}
        onSuccess={handleRemoveSuccess}
      />
    </div>
  );
}

