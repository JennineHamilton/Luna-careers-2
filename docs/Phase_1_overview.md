# Luna Careers Platform - Phase 1 Overview

> Complete technical documentation of the Luna Careers platform architecture, authentication, design system, and component library.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [User Architecture](#user-architecture)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [Routing & Authorization](#routing--authorization)
8. [Design System](#design-system)
9. [Component Library](#component-library)
10. [Layout System](#layout-system)
11. [File Structure](#file-structure)
12. [Environment Setup](#environment-setup)

---

## Project Overview

Luna Careers is a multi-tenant career development and job placement platform built with Next.js 15+ and Supabase. The platform serves three distinct user portals:

- **Personal Portal (`/u/*`)** - For job seekers and candidates
- **Organization Portal (`/org/*`)** - For employers and recruiters
- **Admin Portal (`/cmd/*`)** - For platform administrators

The application runs on `app.domain.com` (subdomain), separate from the main marketing website on `domain.com`.

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.1.6 |
| React | React | 19.x |
| Language | TypeScript | Strict mode |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | v2 |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | new-york style |
| Icons | Lucide React | Latest |
| Font | Inter (Google Fonts) | - |

---

## Architecture

### Server-First Approach

The platform follows a server-first architecture:
- **Default**: Server Components for all pages and layouts
- **Client Components**: Only when required (interactivity, hooks, browser APIs)
- **Server Actions**: For form submissions and mutations (`lib/auth/actions.ts`)

### Key Architectural Decisions

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router                                          │
│  ├── proxy.ts (Route protection & auth checks)              │
│  ├── Server Components (Default)                             │
│  ├── Client Components ('use client')                        │
│  └── Server Actions (lib/auth/actions.ts)                    │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client Layer                                       │
│  ├── lib/supabase/server.ts (Server Components/Actions)     │
│  ├── lib/supabase/client.ts (Client Components)             │
│  └── lib/supabase/middleware.ts (Route protection)          │
├─────────────────────────────────────────────────────────────┤
│  Supabase Backend                                            │
│  ├── auth.users (Supabase Auth)                             │
│  ├── public.users (Extended user data)                       │
│  ├── public.organizations                                    │
│  └── Row Level Security (RLS) Policies                       │
└─────────────────────────────────────────────────────────────┘
```

---

## User Architecture

### Account Types

Account type determines **portal access**:

| Account Type | Portal Access | Description |
|--------------|---------------|-------------|
| `personal` | `/u/*` only | Job seekers, candidates |
| `organization` | `/org/*` only | Organization members |
| `platformAdmin` | `/cmd/*` only | Platform administrators |
| `hybrid` | `/u/*` AND `/org/*` | Dual access users |

### User Roles

User role determines **permissions** within a portal:

**Personal Roles:**
- `candidate` - Default for new signups
- `premium_member` - Paid tier

**Organization Roles:**
- `organization_member` - Basic access
- `recruiter` - Can manage job postings
- `hr_manager` - HR functions
- `hiring_manager` - Hiring decisions
- `org_admin` - Full organization access

**Platform Admin Roles:**
- `super_admin` - Full platform access
- `moderator` - Content moderation
- `support` - Customer support

### Hybrid Users

Hybrid users have **dual access** to both personal and organization portals:
- `current_context` field tracks active mode (`'personal'` or `'organization'`)
- Can freely navigate between `/u/*` and `/org/*` routes
- Default dashboard determined by `current_context`
- Context switcher UI in sidebar for switching modes

### Type Definitions

**Location:** `types/auth.types.ts`

```typescript
// Account Types
type AccountType = 'personal' | 'organization' | 'platformAdmin' | 'hybrid';

// User Roles
type PersonalRole = 'candidate' | 'premium_member';
type OrganizationRole = 'organization_member' | 'recruiter' | 'hr_manager' | 'hiring_manager' | 'org_admin';
type PlatformAdminRole = 'super_admin' | 'moderator' | 'support';
type UserRole = PersonalRole | OrganizationRole | PlatformAdminRole;

// Context for hybrid users
type UserContext = 'personal' | 'organization';
```

---

## Database Schema

**Location:** `supabase/schema.sql`

### ENUMs

```sql
CREATE TYPE account_type AS ENUM ('personal', 'organization', 'platformAdmin', 'hybrid');
CREATE TYPE user_context AS ENUM ('personal', 'organization');
CREATE TYPE user_role AS ENUM (
  'candidate', 'premium_member',
  'organization_member', 'recruiter', 'hr_manager', 'hiring_manager', 'org_admin',
  'super_admin', 'moderator', 'support'
);
```

### Tables

#### `public.organizations`
```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `public.users`
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  account_type account_type NOT NULL DEFAULT 'personal',
  user_role user_role NOT NULL DEFAULT 'candidate',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  current_context user_context DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Auto-Create Trigger

When a user signs up via Supabase Auth, a trigger automatically creates their `public.users` record:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, account_type, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'personal',
    'candidate'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Row Level Security (RLS)

```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Organization members can read their organization
CREATE POLICY "Org members can read their org" ON public.organizations
  FOR SELECT USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));
```

### TypeScript Database Types

**Location:** `types/database.types.ts`

Provides full type safety for Supabase queries with `Row`, `Insert`, and `Update` types for each table.

---

## Authentication System

### Supabase Clients

| File | Usage | Environment |
|------|-------|-------------|
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | Server |
| `lib/supabase/client.ts` | Client Components | Browser |
| `lib/supabase/middleware.ts` | Route protection in proxy.ts | Edge |

### Server Actions

**Location:** `lib/auth/actions.ts`

| Action | Description |
|--------|-------------|
| `signup(data)` | Create new user (always personal/candidate) |
| `login(data)` | Authenticate user, redirect to appropriate dashboard |
| `logout()` | Sign out and redirect to login |
| `requestPasswordReset(email)` | Send password reset email |
| `updatePassword(newPassword)` | Update password after reset |
| `switchContext(context)` | Switch hybrid user context |

### Client Hook

**Location:** `lib/auth/useAuth.ts`

```typescript
interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  switchContext: (context: UserContext) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### Auth Callback

**Location:** `app/auth/callback/route.ts`

Handles OAuth callbacks and email confirmation redirects. Reads `account_type` from database to determine correct dashboard redirect.

---

## Routing & Authorization

### Route Protection (proxy.ts)

**Location:** `proxy.ts` (root level)

The proxy function handles all route protection:

```typescript
// Public routes (no auth required)
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/design-system'];

// Public prefixes (no auth required)
const publicPrefixes = ['/courses/', '/assessments/', '/auth/'];

// Protected portal prefixes
const protectedPrefixes = ['/u/', '/org/', '/cmd/'];
```

### Access Control Logic

```typescript
function canAccessPath(path: string, accountType: AccountType): boolean {
  if (path.startsWith('/u/')) {
    return accountType === 'personal' || accountType === 'hybrid';
  }
  if (path.startsWith('/org/')) {
    return accountType === 'organization' || accountType === 'hybrid';
  }
  if (path.startsWith('/cmd/')) {
    return accountType === 'platformAdmin';
  }
  return true;
}
```

### Dashboard Routing

```typescript
function getDashboardPath(accountType: AccountType, currentContext?: UserContext): string {
  switch (accountType) {
    case 'personal': return '/u/dashboard';
    case 'organization': return '/org/dashboard';
    case 'platformAdmin': return '/cmd/dashboard';
    case 'hybrid': return currentContext === 'organization' ? '/org/dashboard' : '/u/dashboard';
  }
}
```

---

## Design System

### Luna Design Tokens

**Location:** `tailwind.config.ts`

All Luna-specific colors and design tokens are defined under the `luna-*` namespace:

#### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `luna-blue` | `#0066FF` | Primary brand color |
| `luna-purple` | `#7C3AED` | Secondary accent |
| `luna-success` | `#10B981` | Success states |
| `luna-warning` | `#F59E0B` | Warning states |
| `luna-error` | `#EF4444` | Error states |

#### Gray Scale

| Token | Value |
|-------|-------|
| `luna-gray-50` | `#F9FAFB` |
| `luna-gray-100` | `#F3F4F6` |
| `luna-gray-200` | `#E5E7EB` |
| `luna-gray-300` | `#D1D5DB` |
| `luna-gray-400` | `#9CA3AF` |
| `luna-gray-500` | `#6B7280` |
| `luna-gray-600` | `#4B5563` |
| `luna-gray-700` | `#374151` |
| `luna-gray-800` | `#1F2937` |
| `luna-gray-900` | `#111827` |

#### Background Colors

| Token | Usage |
|-------|-------|
| `luna-bg-primary` | Main content background |
| `luna-bg-secondary` | Page/app background |
| `luna-bg-tertiary` | Card/section backgrounds |

#### Border Colors

| Token | Usage |
|-------|-------|
| `luna-border-default` | Default borders |
| `luna-border-subtle` | Subtle dividers |
| `luna-border-strong` | Emphasized borders |

### Context Gradients

**Location:** `lib/utils/gradients.ts`

Each portal has a unique gradient for visual distinction:

```typescript
const contextGradients = {
  personal: { from: '#0066FF', to: '#7C3AED' },      // Blue to Purple
  organization: { from: '#10B981', to: '#0066FF' }, // Green to Blue
  admin: { from: '#7C3AED', to: '#EC4899' },        // Purple to Pink
};
```

### Typography

- **Font Family:** Inter (Google Fonts)
- **Font Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## Component Library

### Luna Components

**Location:** `components/luna/`

All Luna-branded components are built on top of shadcn/ui and use Luna design tokens exclusively.

#### Button (`components/luna/button.tsx`)

```typescript
interface LunaButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}
```

**Usage:**
```tsx
<LunaButton variant="primary" size="md">Click me</LunaButton>
<LunaButton variant="outline" loading>Submitting...</LunaButton>
<LunaButton variant="ghost" icon={<PlusIcon />}>Add Item</LunaButton>
```

#### Input (`components/luna/input.tsx`)

```typescript
interface LunaInputProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage:**
```tsx
<LunaInput label="Email" required placeholder="Enter your email" />
<LunaInput label="Password" type="password" error="Password is required" />
```

#### Card (`components/luna/card.tsx`)

```typescript
interface LunaCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

**Subcomponents:** `LunaCardHeader`, `LunaCardTitle`, `LunaCardSubtitle`, `LunaCardContent`, `LunaCardFooter`

#### Badge (`components/luna/badge.tsx`)

```typescript
interface LunaBadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}
```

#### Select (`components/luna/select.tsx`)

```typescript
interface LunaSelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

**Subcomponents:** `LunaSelectItem`, `LunaSelectGroup`, `LunaSelectLabel`

#### Other Components

| Component | File | Description |
|-----------|------|-------------|
| `LunaTextarea` | `textarea.tsx` | Multi-line text input |
| `LunaCheckbox` | `checkbox.tsx` | Checkbox with label |
| `LunaRadioGroup` | `radio.tsx` | Radio button group |
| `LunaDialog` | `dialog.tsx` | Modal dialog |
| `LunaDropdownMenu` | `dropdown-menu.tsx` | Dropdown menu |
| `LunaAvatar` | `avatar.tsx` | User avatar with fallback |
| `ContextSwitcher` | `context-switcher.tsx` | Hybrid user context toggle |

### Component Index

**Location:** `components/luna/index.ts`

All components are exported from a central index for easy imports:

```tsx
import { LunaButton, LunaInput, LunaCard, LunaBadge } from '@/components/luna';
```

---

## Layout System

### MainLayout

**Location:** `components/layout/MainLayout.tsx`

The primary layout wrapper that provides sidebar, header, and content area:

```tsx
export default function DashboardPage() {
  return (
    <MainLayout pageTitle="Dashboard">
      <div>Your page content here</div>
    </MainLayout>
  );
}
```

### Layout Components

| Component | Location | Description |
|-----------|----------|-------------|
| `Sidebar` | `components/layout/Sidebar/Sidebar.tsx` | Collapsible navigation sidebar |
| `Header` | `components/layout/Header/Header.tsx` | Top header with user menu |
| `Navigation` | `components/layout/Sidebar/Navigation.tsx` | Sidebar navigation items |
| `SidebarFooter` | `components/layout/Sidebar/SidebarFooter.tsx` | Sidebar bottom section |
| `ContextSwitcher` | `components/layout/Sidebar/ContextSwitcher.tsx` | Portal context switcher |
| `ThemeToggle` | `components/layout/Header/ThemeToggle.tsx` | Dark/light mode toggle |
| `PointsTracker` | `components/layout/Header/PointsTracker.tsx` | User points display |
| `NotificationsMenu` | `components/layout/Header/NotificationsMenu.tsx` | Notifications dropdown |
| `UserMenu` | `components/layout/Header/UserMenu.tsx` | User profile dropdown |

### Layout Provider

**Location:** `components/providers/LayoutProvider.tsx`

Provides layout state (sidebar collapsed, mobile menu open) via React Context:

```tsx
const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, toggleMobileMenu } = useLayoutContext();
```

### Layout Types

**Location:** `types/layout.ts`

```typescript
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

type Context = 'personal' | 'organization' | 'admin';
```