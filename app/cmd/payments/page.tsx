/**
 * Admin: Payment Management Page
 * Manage all payment submissions and approvals across the platform
 */

import { Suspense } from 'react';
import { PaymentsClientTable } from './payments-client-table';
import { Loader2 } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900">Payment Management</h1>
        <p className="text-luna-gray-600 mt-1">
          Review and approve payment submissions across the platform
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-luna-blue" />
          </div>
        }
      >
        <PaymentsClientTable />
      </Suspense>
    </div>
  );
}

