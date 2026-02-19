# Database Schema Documentation

## Overview

The Luna Careers database schema is designed to support a multi-tenant platform with three distinct user portals (personal, organization, and platform admin). The schema emphasizes security through Row Level Security (RLS) policies and provides comprehensive user and organization management.

## Schema Migrations

Migrations are located in `supabase/migrations/` and should be run in order:

1. `20260119000001_extend_users_organizations_schema.sql` - Core tables and extensions
2. `20260119000002_activity_logs_and_rls_policies.sql` - Activity logging and security policies
3. `20260119000003_functions_and_triggers.sql` - Helper functions and automation

## Core Tables

### `public.users`

Extended user profile table linked to Supabase Auth.

**Key Fields:**
- `id` (UUID, PK) - References `auth.users(id)`
- `email` (VARCHAR) - User email address
- `first_name`, `last_name` (VARCHAR) - User name
- `account_type` (ENUM) - Portal access: `personal`, `organization`, `platformAdmin`, `hybrid`
- `user_role` (ENUM) - Permissions within portal
- `organization_id` (UUID, FK) - Links to organization (required for org/hybrid users)
- `current_context` (ENUM) - Active context for hybrid users: `personal` or `organization`

**Profile Fields:**
- `avatar_url` - Profile picture URL
- `phone` - Contact phone number
- `bio` - User biography
- `location` - Geographic location
- `linkedin_url`, `portfolio_url`, `resume_url` - Professional links

**Status Fields:**
- `is_active` - Account active status
- `last_login_at` - Last login timestamp
- `email_verified`, `phone_verified` - Verification status

**Indexes:**
- `idx_users_account_type` - Fast filtering by account type
- `idx_users_email` - Email lookups
- `idx_users_organization_id` - Organization member queries
- `idx_users_is_active` - Active user filtering
- `idx_users_last_login_at` - Activity tracking

**RLS Policies:**
- Users can read/update their own data
- Organization admins can read members of their organization
- Platform admins can read/update all users
- Users cannot change their own `account_type` or `organization_id` (admin only)

---

### `public.organizations`

Organization/employer profiles.

**Key Fields:**
- `id` (UUID, PK) - Organization identifier
- `name` (VARCHAR) - Organization name
- `slug` (VARCHAR, UNIQUE) - URL-friendly identifier (auto-generated)
- `description` (TEXT) - Organization description
- `logo_url`, `cover_image_url` - Branding assets
- `website_url` - Company website

**Classification:**
- `industry` (ENUM) - Industry category (technology, healthcare, finance, etc.)
- `organization_size` (ENUM) - Size category: `startup`, `small`, `medium`, `large`, `enterprise`
- `founded_year` (INTEGER) - Year founded
- `employee_count` (INTEGER) - Number of employees

**Location:**
- `headquarters_location` - Primary office location

**Verification:**
- `verification_status` (ENUM) - `pending`, `verified`, `rejected`, `suspended`
- `verified_at` (TIMESTAMPTZ) - Verification timestamp
- `verified_by` (UUID, FK) - Admin who verified

**Legal:**
- `tax_id` - Tax identification number
- `registration_number` - Business registration number

**Contact:**
- `contact_email`, `contact_phone` - Primary contact information

**Status:**
- `is_active` - Organization active status
- `social_links` (JSONB) - Social media links (LinkedIn, Twitter, etc.)

**Indexes:**
- `idx_organizations_slug` - Slug lookups
- `idx_organizations_verification_status` - Verification filtering
- `idx_organizations_industry` - Industry filtering
- `idx_organizations_is_active` - Active organization filtering

**RLS Policies:**
- Organization members can read their own organization
- Organization admins can update their organization
- Platform admins can read/update/insert all organizations

**Triggers:**
- Auto-generates `slug` from `name` on insert/update

---

### `public.team_invitations`

Team member invitation management.

**Key Fields:**
- `id` (UUID, PK) - Invitation identifier
- `organization_id` (UUID, FK) - Target organization
- `invited_by` (UUID, FK) - User who sent invitation
- `email` (VARCHAR) - Invitee email address
- `user_role` (ENUM) - Role to assign upon acceptance
- `invitation_token` (VARCHAR, UNIQUE) - Secure invitation token
- `status` (ENUM) - `pending`, `accepted`, `declined`, `expired`, `cancelled`
- `expires_at` (TIMESTAMPTZ) - Expiration timestamp
- `accepted_at` (TIMESTAMPTZ) - Acceptance timestamp
- `accepted_by` (UUID, FK) - User who accepted

**Constraints:**
- `unique_pending_invitation` - Prevents duplicate pending invitations for same email/org

**Indexes:**
- `idx_team_invitations_organization_id` - Organization invitation queries
- `idx_team_invitations_email` - Email lookups
- `idx_team_invitations_status` - Status filtering
- `idx_team_invitations_token` - Token validation
- `idx_team_invitations_expires_at` - Expiration checks

**RLS Policies:**
- Organization admins and HR managers can read/create/update invitations for their org
- Platform admins can read all invitations

---

### `public.activity_logs`

Comprehensive activity and audit logging.

**Key Fields:**
- `id` (UUID, PK) - Log entry identifier
- `user_id` (UUID, FK) - User who performed action (nullable)
- `organization_id` (UUID, FK) - Related organization (nullable)
- `activity_type` (ENUM) - Type of activity (see Activity Types below)
- `description` (TEXT) - Human-readable description
- `metadata` (JSONB) - Additional structured data
- `ip_address` (INET) - IP address of request
- `user_agent` (TEXT) - Browser/client user agent
- `created_at` (TIMESTAMPTZ) - Activity timestamp

**Activity Types:**
- User: `user_login`, `user_logout`, `user_created`, `user_updated`, `user_deleted`
- Organization: `organization_created`, `organization_updated`, `organization_verified`, `organization_suspended`
- Team: `team_member_invited`, `team_member_joined`, `team_member_removed`
- Security: `role_changed`, `context_switched`, `settings_updated`, `password_changed`, `email_changed`

**Indexes:**
- `idx_activity_logs_user_id` - User activity queries
- `idx_activity_logs_organization_id` - Organization activity queries
- `idx_activity_logs_activity_type` - Activity type filtering
- `idx_activity_logs_created_at` - Time-based queries (DESC for recent first)

**RLS Policies:**
- Users can read their own activity logs
- Organization admins can read activity logs for their organization
- Platform admins can read all activity logs
- System can insert activity logs (via service role or trigger)

---

## Views

### `public.organization_members`

Convenient view combining user and organization data for organization members.

**Fields:**
- `id`, `email`, `first_name`, `last_name`, `avatar_url` - User details
- `user_role` - Member role
- `organization_id` - Organization ID
- `is_active` - Member active status
- `last_login_at` - Last login timestamp
- `created_at` - Member join date
- `organization_name` - Organization name
- `organization_slug` - Organization slug

**Usage:**
```sql
-- Get all members of an organization
SELECT * FROM organization_members
WHERE organization_id = 'org-uuid';

-- Get active members only
SELECT * FROM organization_members
WHERE organization_id = 'org-uuid' AND is_active = true;
```

---

## Helper Functions

### `public.log_activity()`

Logs user and organization activities for audit trails.

**Parameters:**
- `p_user_id` (UUID) - User performing action
- `p_organization_id` (UUID) - Related organization
- `p_activity_type` (activity_type) - Type of activity
- `p_description` (TEXT, optional) - Human-readable description
- `p_metadata` (JSONB, optional) - Additional structured data
- `p_ip_address` (INET, optional) - IP address
- `p_user_agent` (TEXT, optional) - User agent string

**Returns:** UUID - ID of created log entry

**Example:**
```sql
SELECT public.log_activity(
  auth.uid(),
  'org-uuid',
  'user_updated',
  'Updated profile information',
  '{"fields": ["first_name", "bio"]}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
```

---

### `public.generate_organization_slug()`

Generates a unique URL-friendly slug from organization name.

**Parameters:**
- `org_name` (TEXT) - Organization name

**Returns:** TEXT - Unique slug

**Behavior:**
- Converts to lowercase
- Replaces spaces and special characters with hyphens
- Removes leading/trailing hyphens
- Limits to 80 characters
- Appends counter if slug already exists

**Example:**
```sql
SELECT public.generate_organization_slug('Acme Corporation Inc.');
-- Returns: 'acme-corporation-inc'

-- If slug exists, appends counter
SELECT public.generate_organization_slug('Acme Corporation Inc.');
-- Returns: 'acme-corporation-inc-1'
```

---

### `public.create_team_invitation()`

Creates a team member invitation with automatic token generation and activity logging.

**Parameters:**
- `p_organization_id` (UUID) - Organization ID
- `p_invited_by` (UUID) - User sending invitation
- `p_email` (VARCHAR) - Invitee email
- `p_user_role` (user_role) - Role to assign
- `p_expires_in_days` (INTEGER, optional, default: 7) - Days until expiration

**Returns:** UUID - ID of created invitation

**Example:**
```sql
SELECT public.create_team_invitation(
  'org-uuid',
  auth.uid(),
  'newmember@example.com',
  'recruiter',
  14  -- Expires in 14 days
);
```

**Side Effects:**
- Generates unique invitation token
- Sets expiration timestamp
- Logs `team_member_invited` activity

---

## Enums

### `account_type`
- `personal` - Personal/jobseeker account
- `organization` - Organization member only
- `platformAdmin` - Platform administrator
- `hybrid` - Both personal and organization access

### `user_context`
- `personal` - Personal portal context
- `organization` - Organization portal context

### `user_role`
**Personal Roles:**
- `candidate` - Basic jobseeker
- `premium_member` - Premium subscription

**Organization Roles:**
- `organization_member` - Basic member
- `recruiter` - Can post jobs, review applications
- `hr_manager` - Manages team, settings
- `hiring_manager` - Manages hiring process
- `org_admin` - Full organization control

**Platform Admin Roles:**
- `super_admin` - Full platform access
- `moderator` - Content moderation
- `support` - Customer support

### `organization_verification_status`
- `pending` - Awaiting verification
- `verified` - Verified organization
- `rejected` - Verification rejected
- `suspended` - Temporarily suspended

### `organization_size`
- `startup` - 1-10 employees
- `small` - 11-50 employees
- `medium` - 51-200 employees
- `large` - 201-1000 employees
- `enterprise` - 1000+ employees

### `industry_type`
- `technology`, `healthcare`, `finance`, `education`, `retail`
- `manufacturing`, `hospitality`, `construction`, `transportation`
- `energy`, `telecommunications`, `media`, `real_estate`
- `legal`, `consulting`, `nonprofit`, `government`, `other`

### `invitation_status`
- `pending` - Awaiting response
- `accepted` - Invitation accepted
- `declined` - Invitation declined
- `expired` - Invitation expired
- `cancelled` - Invitation cancelled

---

## TypeScript Usage

### Importing Types

```typescript
import type { Database } from '@/types/database.types';
import type {
  OrganizationVerificationStatus,
  OrganizationSize,
  IndustryType,
  InvitationStatus,
  ActivityType
} from '@/types/database.types';

// Table row types
type User = Database['public']['Tables']['users']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type TeamInvitation = Database['public']['Tables']['team_invitations']['Row'];
type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

// Insert types (for creating new records)
type UserInsert = Database['public']['Tables']['users']['Insert'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];

// Update types (for updating records)
type UserUpdate = Database['public']['Tables']['users']['Update'];
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
```

### Querying with Supabase Client

```typescript
import { createClient } from '@/lib/supabase/server';

// Get user with organization
const supabase = await createClient();
const { data: user } = await supabase
  .from('users')
  .select(`
    *,
    organization:organizations(*)
  `)
  .eq('id', userId)
  .single();

// Get organization members
const { data: members } = await supabase
  .from('organization_members')
  .select('*')
  .eq('organization_id', orgId)
  .eq('is_active', true);

// Create team invitation
const { data: invitation } = await supabase
  .rpc('create_team_invitation', {
    p_organization_id: orgId,
    p_invited_by: userId,
    p_email: 'newmember@example.com',
    p_user_role: 'recruiter',
    p_expires_in_days: 7
  });

// Log activity
await supabase.rpc('log_activity', {
  p_user_id: userId,
  p_organization_id: orgId,
  p_activity_type: 'user_updated',
  p_description: 'Updated profile',
  p_metadata: { fields: ['bio', 'location'] }
});
```

---

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled. Key principles:

1. **Users can only access their own data** unless they have elevated permissions
2. **Organization admins can access their organization's data** but not other organizations
3. **Platform admins have full access** to all data
4. **Hybrid users** must have correct `current_context` to access organization data

### Sensitive Fields

The following fields should be protected:
- `users.account_type` - Only admins can modify
- `users.organization_id` - Only admins can modify
- `organizations.verification_status` - Only platform admins can modify
- `organizations.tax_id`, `registration_number` - Sensitive legal information

### Activity Logging

Always log sensitive operations:
- User role changes
- Organization verification status changes
- Team member additions/removals
- Context switching for hybrid users

---

## Migration Guide

### Running Migrations

1. **Local Development:**
   ```bash
   # Run migrations in Supabase SQL Editor
   # Copy contents of each migration file in order
   ```

2. **Production:**
   ```bash
   # Use Supabase CLI
   supabase db push
   ```

### Rollback Strategy

Each migration should be reversible. Create rollback scripts if needed:

```sql
-- Rollback example for 20260119000001
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
-- ... etc
```

---

## Performance Optimization

### Indexes

All critical query paths are indexed:
- User lookups by email, account_type, organization_id
- Organization lookups by slug, verification_status, industry
- Activity logs by user_id, organization_id, created_at (DESC)
- Team invitations by organization_id, email, status

### Query Optimization Tips

1. **Use views for complex joins:**
   ```sql
   -- Instead of joining users + organizations repeatedly
   SELECT * FROM organization_members WHERE organization_id = 'uuid';
   ```

2. **Filter by indexed columns first:**
   ```sql
   -- Good: Uses idx_users_organization_id
   SELECT * FROM users WHERE organization_id = 'uuid' AND is_active = true;

   -- Less optimal: Full scan then filter
   SELECT * FROM users WHERE is_active = true AND organization_id = 'uuid';
   ```

3. **Use RPC functions for complex operations:**
   ```sql
   -- Better than multiple queries
   SELECT create_team_invitation(...);
   ```

---

## Next Steps

1. **Run migrations** in your Supabase project
2. **Test RLS policies** with different user roles
3. **Implement activity logging** in your application code
4. **Add additional tables** as needed (jobs, applications, courses, etc.)

For questions or issues, refer to the [Supabase Integration](./supabase-integration.md) documentation.


