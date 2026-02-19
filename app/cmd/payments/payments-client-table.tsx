/**
 * Payments Client Table
 * Client component for managing bank transfer submissions
 */

'use client';

import { useState, useEffect } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent, LunaButton, LunaBadge } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Loader2, CheckCircle2, XCircle, Eye, ExternalLink, MoreVertical, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';
import { ReviewPaymentModal } from './review-payment-modal';

interface BankTransferSubmission {
  id: string;
  purchase_id: string;
  user_id: string;
  enrollment_type: string;
  enrollment_id: string;
  user_bank_name: string;
  user_account_holder: string;
  transaction_reference: string;
  amount_paid: number;
  receipt_image_url: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  submitted_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  purchase: {
    id: string;
    purchasable_type: string;
    purchasable_id: string;
    original_price: number;
    final_price: number;
    amount_credits: number;
    amount_cash: number;
    payment_method: string;
    payment_status: string;
  } | null;
}

export function PaymentsClientTable() {
  const [submissions, setSubmissions] = useState<BankTransferSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<BankTransferSubmission | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<BankTransferSubmission[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Fetch all submissions - filtering will be done client-side
      const response = await fetch('/api/payments/bank-transfer/pending?status=all');

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        console.error('Failed to fetch submissions:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission: BankTransferSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewModalOpen(false);
    setSelectedSubmission(null);
    fetchSubmissions();
  };

  const columns: DataTableColumn<BankTransferSubmission>[] = [
    {
      accessorKey: 'submitted_at' as keyof BankTransferSubmission,
      header: 'Submitted',
      sortable: true,
      cell: (submission: BankTransferSubmission) => (
        <span className="text-sm text-luna-gray-900">
          {formatDateTime(submission.submitted_at)}
        </span>
      ),
    },
    {
      accessorKey: 'user' as keyof BankTransferSubmission,
      header: 'User',
      cell: (submission: BankTransferSubmission) => (
        <div>
          <p className="text-sm font-medium text-luna-gray-900">
            {submission.user?.first_name || 'Unknown'} {submission.user?.last_name || 'User'}
          </p>
          <p className="text-xs text-luna-gray-500">{submission.user?.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'enrollment_type' as keyof BankTransferSubmission,
      header: 'Content',
      cell: (submission: BankTransferSubmission) => (
        <div>
          <p className="text-sm text-luna-gray-900 capitalize">{submission.enrollment_type}</p>
          <p className="text-xs text-luna-gray-500">
            {submission.purchase?.payment_method === 'hybrid' ? 'Hybrid Payment' : 'Bank Transfer'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'amount_paid' as keyof BankTransferSubmission,
      header: 'Amount',
      sortable: true,
      cell: (submission: BankTransferSubmission) => (
        <div>
          <p className="text-sm font-medium text-luna-gray-900">
            ${submission.amount_paid.toFixed(2)} USD
          </p>
          {submission.purchase && submission.purchase.amount_credits > 0 && (
            <p className="text-xs text-luna-gray-500">
              + {submission.purchase.amount_credits} credits
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'user_bank_name' as keyof BankTransferSubmission,
      header: 'Bank Details',
      cell: (submission: BankTransferSubmission) => (
        <div>
          <p className="text-sm text-luna-gray-900">{submission.user_bank_name}</p>
          <p className="text-xs text-luna-gray-500">{submission.user_account_holder}</p>
          <p className="text-xs text-luna-gray-500 font-mono">
            Ref: {submission.transaction_reference}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status' as keyof BankTransferSubmission,
      header: 'Status',
      sortable: true,
      cell: (submission: BankTransferSubmission) => {
        if (submission.status === 'pending') {
          return <LunaBadge variant="warning">Pending</LunaBadge>;
        } else if (submission.status === 'approved') {
          return <LunaBadge variant="success">Approved</LunaBadge>;
        } else {
          return <LunaBadge variant="error">Rejected</LunaBadge>;
        }
      },
    },
  ];

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = searchValue === '' ||
      submission.user?.first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      submission.user?.last_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      submission.user?.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      submission.transaction_reference?.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(submission.status);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <LunaCard>
        <LunaCardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-luna-blue" />
        </LunaCardContent>
      </LunaCard>
    );
  }

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Bank Transfer Submissions</LunaCardTitle>
        </LunaCardHeader>

        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search by user or transaction reference..."
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ],
              },
            ]}
            activeFilters={{ status: statusFilter }}
            onFilterChange={(column, values) => {
              if (column === 'status') {
                setStatusFilter(values);
              }
            }}
          />

          <LunaDataTable
            columns={columns}
            data={filteredSubmissions}
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
                  {row.status === 'pending' && (
                    <LunaDropdownMenuItem onClick={() => handleReview(row)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Review Payment
                    </LunaDropdownMenuItem>
                  )}
                  {row.receipt_image_url && (
                    <LunaDropdownMenuItem
                      onClick={() => window.open(row.receipt_image_url!, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Receipt
                    </LunaDropdownMenuItem>
                  )}
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
            emptyMessage="No bank transfer submissions found"
          />
        </LunaCardContent>
      </LunaCard>

      {selectedSubmission && (
        <ReviewPaymentModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          submission={selectedSubmission}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}


