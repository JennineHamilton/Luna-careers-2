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
import { InviteTeamMemberModal, EditTeamMemberModal, SuspendTeamMemberModal, RemoveTeamMemberModal } from '@/components/luna/modals';
import { UserPlus, MoreVertical, Eye, Edit, Ban, Trash2, Mail } from 'lucide-react';
import type { TeamMemberData } from './page';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';

const columns: DataTableColumn<TeamMemberData>[] = [
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
    accessorKey: 'role',
    header: 'Role',
    cell: (row) => {
      const role = row.role;
      const variant =
        role === 'super_admin'
          ? 'error'
          : role === 'moderator'
            ? 'warning'
            : 'primary';
      return (
        <LunaBadge variant={variant}>
          {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </LunaBadge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatDateTime(row.created_at, false)}</span>,
  },
  {
    accessorKey: 'onboarding_completed',
    header: 'Status',
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

interface TeamClientTableProps {
  initialTeamMembers: TeamMemberData[];
}

export function TeamClientTable({ initialTeamMembers }: TeamClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<TeamMemberData[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);

  const handleTeamMemberInvited = () => {
    setInviteModalOpen(false);
    router.refresh();
  };

  const handleTeamMemberUpdated = () => {
    setEditModalOpen(false);
    setSelectedMember(null);
    router.refresh();
  };

  const handleTeamMemberSuspended = () => {
    setSuspendModalOpen(false);
    setSelectedMember(null);
    router.refresh();
  };

  const handleTeamMemberRemoved = () => {
    setRemoveModalOpen(false);
    setSelectedMember(null);
    router.refresh();
  };

  const handleView = (member: TeamMemberData) => {
    // TODO: Navigate to team member detail page
  };

  const handleEdit = (member: TeamMemberData) => {
    setSelectedMember(member);
    setEditModalOpen(true);
  };

  const handleResendInvite = (_member: TeamMemberData) => {
    // TODO: Resend invitation email
  };

  const handleSuspend = (member: TeamMemberData) => {
    setSelectedMember(member);
    setSuspendModalOpen(true);
  };

  const handleRemove = (member: TeamMemberData) => {
    setSelectedMember(member);
    setRemoveModalOpen(true);
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Platform Team Members</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search team members..."
            onCreateClick={() => setInviteModalOpen(true)}
            createLabel="Invite Team Member"
            createIcon={<UserPlus className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={initialTeamMembers}
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
                  {!row.onboarding_completed && (
                    <LunaDropdownMenuItem onClick={() => handleResendInvite(row)}>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Invite
                    </LunaDropdownMenuItem>
                  )}
                  <LunaDropdownMenuItem onClick={() => handleSuspend(row)}>
                    <Ban className="w-4 h-4 mr-2" />
                    {row.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleRemove(row)} className="text-luna-error">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <InviteTeamMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={handleTeamMemberInvited}
        organizationId="platform"
        organizationName="Platform Admin Team"
      />

      <EditTeamMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleTeamMemberUpdated}
        member={selectedMember ? {
          id: selectedMember.id,
          first_name: selectedMember.name.split(' ')[0],
          last_name: selectedMember.name.split(' ').slice(1).join(' '),
          email: selectedMember.email,
          user_role: selectedMember.role,
        } : null}
      />

      <SuspendTeamMemberModal
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        onSuccess={handleTeamMemberSuspended}
        member={selectedMember ? {
          id: selectedMember.id,
          name: selectedMember.name,
          is_suspended: selectedMember.is_suspended,
        } : null}
      />

      <RemoveTeamMemberModal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        onSuccess={handleTeamMemberRemoved}
        member={selectedMember ? {
          id: selectedMember.id,
          name: selectedMember.name,
        } : null}
      />
    </>
  );
}

