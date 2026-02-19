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
import { CheckCircle, XCircle, Clock, MoreVertical, Eye, Check, X, FileText, GraduationCap, Award } from 'lucide-react';
import type { VerificationItem } from './page';
import { getInitials, formatDateTime } from '@/lib/utils/formatters';
import type { Database } from '@/types/database.types';

type VerificationStatus = Database['public']['Enums']['verification_status'];

function getStatusBadge(status: VerificationStatus) {
  switch (status) {
    case 'verified':
      return <LunaBadge variant="success" dot><CheckCircle className="w-3 h-3" />Verified</LunaBadge>;
    case 'pending':
      return <LunaBadge variant="warning" dot><Clock className="w-3 h-3" />Pending</LunaBadge>;
    case 'rejected':
      return <LunaBadge variant="error" dot><XCircle className="w-3 h-3" />Rejected</LunaBadge>;
    default:
      return <LunaBadge variant="default">{status}</LunaBadge>;
  }
}

function getTypeBadge(type: 'experience' | 'education' | 'certification') {
  switch (type) {
    case 'experience':
      return <LunaBadge variant="primary"><FileText className="w-3 h-3" />Experience</LunaBadge>;
    case 'education':
      return <LunaBadge variant="primary"><GraduationCap className="w-3 h-3" />Education</LunaBadge>;
    case 'certification':
      return <LunaBadge variant="primary"><Award className="w-3 h-3" />Certification</LunaBadge>;
  }
}

const columns: DataTableColumn<VerificationItem>[] = [
  {
    accessorKey: 'user_name',
    header: 'User',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <LunaAvatar
          src={row.user_avatar || undefined}
          alt={row.user_name}
          fallback={getInitials(row.user_name)}
          size="xs"
        />
        <div className="flex flex-col">
          <span className="font-medium text-luna-gray-900">{row.user_name}</span>
          <span className="text-xs text-luna-gray-500">{row.user_email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    sortable: true,
    cell: (row) => getTypeBadge(row.type),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    sortable: true,
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-luna-gray-900">{row.title}</span>
        <span className="text-xs text-luna-gray-500">{row.organization}</span>
      </div>
    ),
  },
  {
    accessorKey: 'verification_status',
    header: 'Status',
    sortable: true,
    cell: (row) => getStatusBadge(row.verification_status),
  },
  {
    accessorKey: 'submitted_at',
    header: 'Submitted',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900">{formatDateTime(row.submitted_at, false)}</span>,
  },
];

interface VerificationsClientTableProps {
  initialItems: VerificationItem[];
}

export function VerificationsClientTable({ initialItems }: VerificationsClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Filter data
  const filteredItems = initialItems.filter(item => {
    const matchesSearch = 
      item.user_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.user_email.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.verification_status);
    const matchesType = typeFilter.length === 0 || typeFilter.includes(item.type);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = async (item: VerificationItem) => {
    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/verifications/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          action: 'approve',
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        console.error('Failed to approve:', error);
        alert('Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error approving verification');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (item: VerificationItem, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await fetch('/api/admin/verifications/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          action: 'reject',
          rejection_reason: reason,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        console.error('Failed to reject:', error);
        alert('Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting verification');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleQuickApprove = (item: VerificationItem) => {
    if (confirm(`Approve ${item.type} "${item.title}" for ${item.user_name}?`)) {
      handleApprove(item);
    }
  };

  const handleQuickReject = (item: VerificationItem) => {
    const reason = prompt(`Reject ${item.type} "${item.title}" for ${item.user_name}?\n\nPlease provide a reason:`);
    if (reason) {
      handleReject(item, reason);
    }
  };

  return (
    <LunaCard>
      <LunaCardHeader>
        <LunaCardTitle>Verification Submissions</LunaCardTitle>
      </LunaCardHeader>
      <LunaCardContent>
        <LunaDataTableToolbar
          searchPlaceholder="Search by user, title, or organization..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={[
            {
              column: 'verification_status',
              label: 'Status',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'rejected', label: 'Rejected' },
              ],
            },
            {
              column: 'type',
              label: 'Type',
              options: [
                { value: 'experience', label: 'Experience' },
                { value: 'education', label: 'Education' },
                { value: 'certification', label: 'Certification' },
              ],
            },
          ]}
          activeFilters={{
            verification_status: statusFilter,
            type: typeFilter,
          }}
          onFilterChange={(column, values) => {
            if (column === 'verification_status') {
              setStatusFilter(values);
            } else if (column === 'type') {
              setTypeFilter(values);
            }
          }}
        />
        <LunaDataTable
          columns={columns}
          data={filteredItems}
          hoverable
          actionsColumn={(row) => (
            <LunaDropdownMenu>
              <LunaDropdownMenuTrigger asChild>
                <LunaButton variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
              </LunaDropdownMenuTrigger>
              <LunaDropdownMenuContent align="end">
                <LunaDropdownMenuItem onClick={() => setSelectedItem(row)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </LunaDropdownMenuItem>
                {row.verification_status === 'pending' && (
                  <>
                    <LunaDropdownMenuItem onClick={() => handleQuickApprove(row)}>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </LunaDropdownMenuItem>
                    <LunaDropdownMenuItem onClick={() => handleQuickReject(row)} destructive>
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </LunaDropdownMenuItem>
                  </>
                )}
              </LunaDropdownMenuContent>
            </LunaDropdownMenu>
          )}
          emptyMessage="No verification submissions found"
        />
      </LunaCardContent>
    </LunaCard>
  );
}

