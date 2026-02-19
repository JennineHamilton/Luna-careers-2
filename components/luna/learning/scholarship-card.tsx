'use client';

/**
 * Scholarship Card Component
 * Displays scholarship information and application status
 */

import { LunaCard, LunaBadge, LunaButton } from '@/components/luna';
import { Award, Calendar, Percent, Users } from 'lucide-react';

export interface ScholarshipCardProps {
  id: string;
  name: string;
  description: string;
  type: string;
  discountPercentage: number;
  totalSlots?: number | null;
  slotsRemaining?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  applicationStatus?: 'pending' | 'approved' | 'rejected' | null;
  onApply?: () => void;
  onViewDetails?: () => void;
}

export function ScholarshipCard({
  id,
  name,
  description,
  type,
  discountPercentage,
  totalSlots,
  slotsRemaining,
  validFrom,
  validUntil,
  isActive,
  applicationStatus,
  onApply,
  onViewDetails,
}: ScholarshipCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (!isActive) {
      return <LunaBadge variant="default">Inactive</LunaBadge>;
    }
    if (applicationStatus === 'approved') {
      return <LunaBadge variant="success">Approved</LunaBadge>;
    }
    if (applicationStatus === 'pending') {
      return <LunaBadge variant="warning">Pending</LunaBadge>;
    }
    if (applicationStatus === 'rejected') {
      return <LunaBadge variant="error">Rejected</LunaBadge>;
    }
    return <LunaBadge variant="default">Available</LunaBadge>;
  };

  const isFull = totalSlots !== null && totalSlots !== undefined && slotsRemaining !== null && slotsRemaining !== undefined && slotsRemaining <= 0;
  const isExpired = validUntil ? new Date(validUntil) < new Date() : false;
  const isUpcoming = validFrom ? new Date(validFrom) > new Date() : false;
  const canApply = isActive && !applicationStatus && !isFull && !isExpired && !isUpcoming;

  return (
    <LunaCard className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Discount Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Scholarship Value</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {discountPercentage}% OFF
          </p>
          <p className="text-xs text-purple-700 mt-1">Type: {type}</p>
        </div>

        {/* Meta Info */}
        <div className="space-y-2 text-sm text-gray-600">
          {totalSlots !== null && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {slotsRemaining} / {totalSlots} slots remaining
                {isFull && <span className="text-red-600 ml-2">(Full)</span>}
              </span>
            </div>
          )}

          {(validFrom || validUntil) && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {validFrom && `From ${formatDate(validFrom)}`}
                {validFrom && validUntil && ' - '}
                {validUntil && `Until ${formatDate(validUntil)}`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <LunaButton
              onClick={onViewDetails}
              variant="outline"
              className="flex-1"
            >
              View Details
            </LunaButton>
          )}
          {canApply && onApply && (
            <LunaButton
              onClick={onApply}
              className="flex-1"
            >
              Apply Now
            </LunaButton>
          )}
        </div>
      </div>
    </LunaCard>
  );
}

