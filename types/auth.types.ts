/**
 * Authentication and authorization type definitions for Luna Careers
 */

// Account Types - determines portal access
export type AccountType = 'personal' | 'organization' | 'platformAdmin' | 'hybrid';

// User Roles - permissions within each account type/context
export type PersonalRole = 'candidate' | 'premium_member';

export type OrganizationRole =
  | 'organization_member'
  | 'recruiter'
  | 'hr_manager'
  | 'hiring_manager'
  | 'org_admin';

export type PlatformAdminRole = 'super_admin' | 'moderator' | 'support';

export type UserRole = PersonalRole | OrganizationRole | PlatformAdminRole;

// Context for hybrid users
export type UserContext = 'personal' | 'organization';

// User session data stored in Supabase auth metadata
export interface UserSessionData {
  account_type: AccountType;
  user_role: UserRole;
  organization_id?: string;
  current_context?: UserContext; // Only for hybrid users
}

// Extended user type with profile data
export interface LunaUser {
  id: string;
  email: string;
  account_type: AccountType;
  user_role: UserRole;
  organization_id?: string;
  current_context?: UserContext;
  created_at: string;
  updated_at: string;
}

// Helper type guards
export function isPersonalRole(role: UserRole): role is PersonalRole {
  return role === 'candidate' || role === 'premium_member';
}

export function isOrganizationRole(role: UserRole): role is OrganizationRole {
  return [
    'organization_member',
    'recruiter',
    'hr_manager',
    'hiring_manager',
    'org_admin',
  ].includes(role);
}

export function isPlatformAdminRole(role: UserRole): role is PlatformAdminRole {
  return role === 'super_admin' || role === 'moderator' || role === 'support';
}

// Portal access check helpers
export function canAccessPersonalPortal(accountType: AccountType): boolean {
  return accountType === 'personal' || accountType === 'hybrid';
}

export function canAccessOrganizationPortal(accountType: AccountType): boolean {
  return accountType === 'organization' || accountType === 'hybrid';
}

export function canAccessAdminPortal(accountType: AccountType): boolean {
  return accountType === 'platformAdmin';
}

