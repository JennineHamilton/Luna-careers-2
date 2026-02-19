'use client';

/**
 * Scholarship Status Badge Component
 * Displays scholarship application status with appropriate styling and icons
 */

import { LunaBadge } from '@/components/luna';
import { Clock, CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react';
import type { ScholarshipStatus } from '@/types/scholarship';
import { SCHOLARSHIP_STATUS_CONFIG } from '@/types/scholarship';

interface ScholarshipStatusBadgeProps {
  status: ScholarshipStatus;
  className?: string;
  showIcon?: boolean;
}

export function ScholarshipStatusBadge({
  status,
  className = '',
  showIcon = true,
}: ScholarshipStatusBadgeProps) {
  const config = SCHOLARSHIP_STATUS_CONFIG[status];

  const Icon = getStatusIcon(status);

  return (
    <LunaBadge variant={config.variant} className={`inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </LunaBadge>
  );
}

function getStatusIcon(status: ScholarshipStatus) {
  switch (status) {
    case 'pending':
      return Clock;
    case 'approved':
      return CheckCircle;
    case 'rejected':
      return XCircle;
    case 'expired':
      return AlertCircle;
    case 'withdrawn':
      return MinusCircle;
    default:
      return null;
  }
}

