/**
 * Scholarship System Types
 * Comprehensive type definitions for the scholarship application and management system
 */

import type { Database } from './database.types';

// Database table types
export type ScholarshipRow = Database['public']['Tables']['scholarships']['Row'];
export type ScholarshipInsert = Database['public']['Tables']['scholarships']['Insert'];
export type ScholarshipUpdate = Database['public']['Tables']['scholarships']['Update'];

export type ScholarshipApplicationRow = Database['public']['Tables']['scholarship_applications']['Row'];
export type ScholarshipApplicationInsert = Database['public']['Tables']['scholarship_applications']['Insert'];
export type ScholarshipApplicationUpdate = Database['public']['Tables']['scholarship_applications']['Update'];

export type AwardedScholarshipRow = Database['public']['Tables']['awarded_scholarships']['Row'];
export type AwardedScholarshipInsert = Database['public']['Tables']['awarded_scholarships']['Insert'];
export type AwardedScholarshipUpdate = Database['public']['Tables']['awarded_scholarships']['Update'];

export type ScholarshipContentRow = Database['public']['Tables']['scholarship_content']['Row'];
export type ScholarshipContentInsert = Database['public']['Tables']['scholarship_content']['Insert'];

// Enums and constants
export type ScholarshipStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn';
export type ScholarshipType = 'full' | 'partial';
export type ContentType = 'module' | 'course' | 'program';

// Application data structure (stored in JSONB)
export interface ScholarshipApplicationData {
  employment_status: string;
  reason_for_scholarship: string;
  career_goals: string;
  additional_info?: string;
}

// Extended types with relationships
export interface ScholarshipWithContent extends ScholarshipRow {
  scholarship_content: Array<{
    content_type: ContentType;
    content_id: string;
  }>;
}

export interface ScholarshipApplicationWithDetails extends ScholarshipApplicationRow {
  scholarships: ScholarshipRow;
  content_title?: string;
  content_price?: number;
  user_email?: string;
  user_name?: string;
}

export interface AwardedScholarshipWithDetails extends AwardedScholarshipRow {
  scholarships: ScholarshipRow;
  scholarship_applications: ScholarshipApplicationRow;
  content_title?: string;
}

// Form data types
export interface ScholarshipApplicationFormData {
  scholarship_id: string;
  content_type: ContentType;
  content_id: string;
  employment_status: string;
  reason_for_scholarship: string;
  career_goals: string;
  additional_info?: string;
}

export interface ScholarshipReviewFormData {
  status: 'approved' | 'rejected';
  review_notes: string;
  message_to_applicant?: string;
  expires_at?: string; // ISO date string for approved scholarships
}

// API response types
export interface ScholarshipEligibilityResponse {
  eligible: boolean;
  reason?: string;
  existing_application?: ScholarshipApplicationRow;
  awarded_scholarship?: AwardedScholarshipRow & {
    scholarships?: Pick<ScholarshipRow, 'id' | 'name' | 'type' | 'discount_percentage'>;
  };
}

export interface ScholarshipApplicationResponse {
  application: ScholarshipApplicationWithDetails;
  message: string;
}

export interface ScholarshipReviewResponse {
  application: ScholarshipApplicationWithDetails;
  awarded_scholarship?: AwardedScholarshipRow;
  message: string;
}

// Filter and query types
export interface ScholarshipApplicationFilters {
  status?: ScholarshipStatus | ScholarshipStatus[];
  content_type?: ContentType;
  date_from?: string;
  date_to?: string;
  search?: string; // Search by user name or email
}

export interface ScholarshipListParams {
  page?: number;
  limit?: number;
  filters?: ScholarshipApplicationFilters;
  sort_by?: 'applied_at' | 'reviewed_at' | 'status';
  sort_order?: 'asc' | 'desc';
}

// Email template data types
export interface ScholarshipEmailData {
  user_name: string;
  user_email: string;
  content_name: string;
  content_type: ContentType;
  application_id: string;
  scholarship_name: string;
  expires_at?: string;
  admin_message?: string;
  rejection_reason?: string;
}

// Status badge configuration
export interface ScholarshipStatusConfig {
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'yellow';
  icon?: string;
}

export const SCHOLARSHIP_STATUS_CONFIG: Record<ScholarshipStatus, ScholarshipStatusConfig> = {
  pending: {
    label: 'Pending Review',
    variant: 'warning',
    icon: 'Clock',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    variant: 'error',
    icon: 'XCircle',
  },
  expired: {
    label: 'Expired',
    variant: 'default',
    icon: 'AlertCircle',
  },
  withdrawn: {
    label: 'Withdrawn',
    variant: 'default',
    icon: 'MinusCircle',
  },
};

// Employment status options
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed_full_time', label: 'Employed Full-Time' },
  { value: 'employed_part_time', label: 'Employed Part-Time' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed_seeking', label: 'Unemployed, Actively Seeking' },
  { value: 'unemployed_not_seeking', label: 'Unemployed, Not Seeking' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
] as const;

export type EmploymentStatus = typeof EMPLOYMENT_STATUS_OPTIONS[number]['value'];

