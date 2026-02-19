# Luna Careers Platform Architecture

> Comprehensive technical architecture documentation for the Luna Careers platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Application Layers](#application-layers)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Integration Points](#integration-points)

---

## System Overview

Luna Careers is a multi-tenant SaaS platform built on a modern serverless architecture using Next.js 16 (App Router) and Supabase (PostgreSQL + Auth + Storage).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│                  Next.js 16 App Router                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Personal   │  │Organization  │  │    Admin     │     │
│  │Portal (/u/*) │  │Portal(/org/*)│  │Portal(/cmd/*)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Learning │  │   Jobs   │  │ Payments │  │
│  │   APIs   │  │   APIs   │  │   APIs   │  │   APIs   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Rate Limiting │  │  Validation  │  │   Logging    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │     Auth     │  │   Storage    │     │
│  │   Database   │  │   (JWT)      │  │  (S3-like)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Architecture

### Portal Structure

Luna Careers implements a **portal-based multi-tenancy** model with three distinct user experiences:

| Portal | Route | Account Types | Purpose |
|--------|-------|---------------|---------|
| **Personal** | `/u/*` | `personal`, `hybrid` (personal context) | Job seekers, learners |
| **Organization** | `/org/*` | `organization`, `hybrid` (org context) | Employers, recruiters |
| **Admin** | `/cmd/*` | `platformAdmin` | Platform administrators |

### Account Type System

```typescript
type AccountType = 'personal' | 'organization' | 'platformAdmin' | 'hybrid';
type CurrentContext = 'personal' | 'organization';
```

- **Personal**: Individual users (job seekers, learners)
- **Organization**: Company accounts (employers, recruiters)
- **PlatformAdmin**: Platform administrators (full access)
- **Hybrid**: Users who can switch between personal and organization contexts

### Data Isolation

- **Row Level Security (RLS)**: All database tables have RLS policies
- **Organization Scoping**: Data filtered by `organization_id` where applicable
- **User Context**: Hybrid users have `current_context` field to determine active portal
- **Admin Override**: Platform admins use service role client to bypass RLS when needed

---

## Application Layers

### 1. Presentation Layer (React Components)

**Location**: `components/luna/` and `components/ui/`

- **40+ Custom Components**: Reusable UI components (Luna Design System)
- **shadcn/ui Integration**: Base components from shadcn/ui (new-york style)
- **Server Components**: Default to server components for performance
- **Client Components**: Used only when interactivity required (`'use client'`)

### 2. Routing Layer (Next.js App Router)

**Location**: `app/`

```
app/
├── (auth)/              # Authentication pages (login, signup, reset)
├── u/                   # Personal Portal
│   ├── dashboard/
│   ├── learning/        # LMS (courses, modules, programs)
│   ├── jobs/            # Job search and applications
│   ├── profile/         # Professional profile
│   └── wallet/          # Credit wallet
├── org/[slug]/          # Organization Portal (dynamic slug)
│   ├── dashboard/
│   ├── vacancies/       # Job postings
│   ├── applicants/      # Application management
│   └── team/            # Team management
├── cmd/                 # Admin Portal
│   ├── dashboard/
│   ├── learning/        # LMS management
│   ├── employers/       # Organization management
│   └── users/           # User management
└── api/                 # API routes
    ├── auth/
    ├── learning/
    ├── jobs/
    └── payments/
```

### 3. Business Logic Layer

**Location**: `lib/`

- **Supabase Clients** (`lib/supabase/`):
  - `client.ts` - Browser client (respects RLS)
  - `server.ts` - Server client (respects RLS)
  - `admin.ts` - Admin client (bypasses RLS)

- **Validation** (`lib/validation/`):
  - `schemas.ts` - Zod validation schemas
  - `validate.ts` - Validation utilities

- **Middleware** (`lib/middleware/`):
  - `rate-limit.ts` - Rate limiting
  - `request-logger.ts` - Request logging
  - `with-rate-limit.ts` - HOC wrapper

- **Utilities** (`lib/utils/`):
  - `error-response.ts` - Error handling
  - Various helper functions

### 4. Data Layer (Supabase)

**Database**: PostgreSQL with Row Level Security
**Authentication**: Supabase Auth (JWT-based)
**Storage**: Supabase Storage (SCORM packages, uploads)

---

## Data Flow

### Example: User Enrolls in a Course

```
1. User clicks "Enroll" button
   └─> components/luna/learning/enrollment-modal.tsx

2. Modal validates input (Zod schema)
   └─> lib/validation/schemas.ts

3. API request sent to enrollment endpoint
   └─> app/api/learning/enroll/route.ts

4. Rate limiting check
   └─> lib/middleware/rate-limit.ts

5. Request validation
   └─> lib/validation/validate.ts

6. Business logic execution
   ├─> Check user credits
   ├─> Process payment (if needed)
   └─> Create enrollment record

7. Database operations (with RLS)
   └─> Supabase client (lib/supabase/server.ts)

8. Response sent back to client
   └─> Success/error handling

9. UI updates
   └─> Enrollment confirmation shown
```

---

## Security Architecture

### Defense in Depth

Luna Careers implements multiple security layers:

#### Layer 1: Network Security
- **HTTPS Only**: Enforced via HSTS headers
- **CORS Restrictions**: Limited to app domain
- **Rate Limiting**: Prevents brute force and DDoS

#### Layer 2: Application Security
- **Input Validation**: Zod schemas on all inputs
- **Output Sanitization**: Error messages sanitized
- **Security Headers**: CSP, X-Frame-Options, etc.
- **XSS Prevention**: Content Security Policy

#### Layer 3: Authentication & Authorization
- **JWT Tokens**: Supabase Auth with secure tokens
- **Session Management**: HTTP-only cookies
- **Password Policies**: Strong password requirements
- **Email Verification**: Required for account activation

#### Layer 4: Database Security
- **Row Level Security**: All tables protected
- **Prepared Statements**: SQL injection prevention
- **Encrypted Connections**: SSL/TLS required
- **Admin Client Isolation**: Separate client for privileged ops

---

## Integration Points

### Supabase Services

1. **Authentication**
   - Sign up, sign in, password reset
   - Email verification
   - Session management

2. **Database**
   - PostgreSQL with RLS
   - Real-time subscriptions (future)
   - Database functions and triggers

3. **Storage**
   - SCORM package storage
   - User uploads (resumes, certificates)
   - Organization assets (logos, covers)

### External Services (Future)

- **Email**: Mailgun/Resend for transactional emails
- **Payments**: Stripe for credit card processing
- **Analytics**: Platform usage analytics
- **Monitoring**: Error tracking and performance monitoring

---

**Last Updated**: February 14, 2026

