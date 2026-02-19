/**
 * Scholarship Utility Functions
 * Helper functions for scholarship status checks, eligibility, and calculations
 */

import type {
  ScholarshipStatus,
  ScholarshipApplicationRow,
  AwardedScholarshipRow,
  ContentType,
} from '@/types/scholarship';

/**
 * Check if a scholarship application is in a final state (cannot be modified)
 */
export function isApplicationFinal(status: ScholarshipStatus): boolean {
  return ['approved', 'rejected', 'expired', 'withdrawn'].includes(status);
}

/**
 * Check if a scholarship application can be withdrawn
 */
export function canWithdrawApplication(status: ScholarshipStatus): boolean {
  return status === 'pending';
}

/**
 * Check if a scholarship application can be reapplied
 */
export function canReapply(status: ScholarshipStatus): boolean {
  return ['rejected', 'expired', 'withdrawn'].includes(status);
}

/**
 * Check if an awarded scholarship is still valid (not expired and not used)
 */
export function isScholarshipValid(awardedScholarship: AwardedScholarshipRow): boolean {
  if (awardedScholarship.used) {
    return false;
  }

  if (!awardedScholarship.expires_at) {
    return true; // No expiration date means it's always valid
  }

  const expirationDate = new Date(awardedScholarship.expires_at);
  const now = new Date();
  
  return expirationDate > now;
}

/**
 * Calculate the discounted price based on scholarship discount percentage
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  const discount = Math.round(originalPrice * (discountPercentage / 100));
  return Math.max(0, originalPrice - discount);
}

/**
 * Calculate the discount amount based on scholarship discount percentage
 */
export function calculateDiscountAmount(
  originalPrice: number,
  discountPercentage: number
): number {
  return Math.round(originalPrice * (discountPercentage / 100));
}

/**
 * Get the default expiration date for an approved scholarship (90 days from now)
 */
export function getDefaultExpirationDate(daysFromNow: number = 90): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

/**
 * Format scholarship expiration date for display
 */
export function formatExpirationDate(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'No expiration';
  }

  const date = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    return 'Expired';
  }

  if (daysUntilExpiration === 0) {
    return 'Expires today';
  }

  if (daysUntilExpiration === 1) {
    return 'Expires tomorrow';
  }

  if (daysUntilExpiration <= 7) {
    return `Expires in ${daysUntilExpiration} days`;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a scholarship is expiring soon (within 7 days)
 */
export function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  const date = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiration > 0 && daysUntilExpiration <= 7;
}

/**
 * Get content type display name
 */
export function getContentTypeDisplayName(contentType: ContentType): string {
  const displayNames: Record<ContentType, string> = {
    module: 'Module',
    course: 'Course',
    program: 'Program',
  };
  return displayNames[contentType];
}

/**
 * Validate scholarship application data
 */
export function validateApplicationData(data: {
  employment_status: string;
  reason_for_scholarship: string;
  career_goals: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.employment_status || data.employment_status.trim() === '') {
    errors.push('Employment status is required');
  }

  if (!data.reason_for_scholarship || data.reason_for_scholarship.trim() === '') {
    errors.push('Reason for scholarship is required');
  }

  if (!data.career_goals || data.career_goals.trim() === '') {
    errors.push('Career goals are required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

