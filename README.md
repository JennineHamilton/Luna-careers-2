# Luna Careers Platform

> A comprehensive multi-tenant career development and job placement platform built with Next.js 16 and Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)
- [Security](#security)

---

## 🎯 Overview

Luna Careers is a full-featured career development platform serving three distinct user types through dedicated portals:

- **Personal Portal** (`/u/*`) - For job seekers and learners
- **Organization Portal** (`/org/*`) - For employers and recruiters
- **Admin Portal** (`/cmd/*`) - For platform administrators

The platform combines a comprehensive Learning Management System (LMS), job board, professional profile management, and payment processing into a unified experience.

---

## ✨ Features

### 🎓 Learning Management System (LMS)
- **Content Hierarchy**: Programs → Courses → Modules → Lessons
- **SCORM Support**: Full SCORM 1.2 player with progress tracking
- **Learning Credits**: Earn credits on completion, spend on enrollment
- **Scholarships**: Application-based financial assistance system
- **Progress Tracking**: Comprehensive enrollment and completion tracking

### 💼 Job Board & Recruitment
- **Vacancy Management**: Create and manage job postings
- **Application System**: Track applications with status workflow
- **Interview Scheduling**: Coordinate interviews with candidates
- **Organization Profiles**: Verified employer profiles

### 👤 Professional Profiles
- **Experience Tracking**: Work history with verification
- **Education Records**: Academic credentials with verification
- **Certifications**: Professional certifications with verification
- **Skills Management**: Comprehensive skills taxonomy

### 💳 Payment & Credits System
- **Credit Wallet**: Earn and spend learning credits
- **Bank Transfers**: Manual payment submission and approval workflow
- **Purchase Tracking**: Complete transaction history
- **Receipt Management**: Upload and track payment receipts

### 🔐 Security & Authentication
- **Multi-tenant Architecture**: Isolated data per organization
- **Row Level Security (RLS)**: Database-level access control
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Zod-based schema validation
- **Security Headers**: CSP, HSTS, and more

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x (Strict) |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Authentication** | Supabase Auth | v2 |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui | new-york |
| **Icons** | Lucide React | Latest |
| **Validation** | Zod | Latest |
| **Storage** | Supabase Storage | Latest |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LunaCareers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_url
   ```

4. **Run database migrations**
   ```bash
   # Migrations are in supabase/migrations/
   # Apply them through Supabase Dashboard or CLI
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
LunaCareers/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── u/                        # Personal Portal (/u/*)
│   ├── org/                      # Organization Portal (/org/*)
│   ├── cmd/                      # Admin Portal (/cmd/*)
│   └── api/                      # API routes
├── components/
│   ├── luna/                     # Custom component library (40+ components)
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── validation/               # Zod schemas and validators
│   ├── middleware/               # Rate limiting, logging
│   ├── utils/                    # Utility functions
│   └── navigation/               # Navigation configurations
├── supabase/
│   └── migrations/               # Database migrations
├── types/                        # TypeScript type definitions
└── docs/                         # Documentation
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Phase 1 Overview](docs/Phase_1_overview.md)** - Platform architecture and core systems
- **[Database Schema](docs/database-schema.md)** - Complete database documentation
- **[Phase 2 Specifications](docs/phase-2-specifications.md)** - LMS system specifications
- **[SCORM Architecture](docs/SCORM_ARCHITECTURE.md)** - SCORM player implementation
- **[Security Fixes](docs/SECURITY_FIXES_SUMMARY.md)** - Security enhancements applied
- **[Components](docs/components.md)** - Component library reference
- **[Design Tokens](docs/design-tokens.md)** - Design system tokens
- **[Multi-tenancy](docs/multi-tenancy.md)** - Portal structure and routing
- **[User Architecture](docs/user-architecture.md)** - User types and permissions
- **[Supabase Integration](docs/supabase-integration.md)** - Supabase setup guide
- **[Storage Buckets](docs/storage-buckets-implementation.md)** - File storage implementation
- **[Setup Guide](docs/setup.md)** - Detailed setup instructions

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:types         # Generate TypeScript types from Supabase schema
```

### Development Workflow

1. **Create a new feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript strict mode
   - Use existing Luna components from `components/luna/`
   - Add Zod validation for new API routes
   - Update RLS policies if adding new tables

3. **Test your changes**
   ```bash
   npm run build    # Ensure production build works
   npm run lint     # Check for linting errors
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

---

## 🔐 Security

Luna Careers implements multiple layers of security:

### Application Security
- ✅ **Rate Limiting**: Prevents API abuse (5 req/15min for auth, 100 req/min for API)
- ✅ **Input Validation**: Zod schemas on all API routes
- ✅ **Error Sanitization**: No sensitive data in error messages
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **CORS Restrictions**: Limited to app domain only

### Database Security
- ✅ **Row Level Security (RLS)**: All tables have RLS policies
- ✅ **Admin Client**: Separate client for privileged operations
- ✅ **Prepared Statements**: Protection against SQL injection
- ✅ **Encrypted Connections**: SSL/TLS for all database connections

### Authentication
- ✅ **Supabase Auth**: Industry-standard authentication
- ✅ **JWT Tokens**: Secure session management
- ✅ **Password Reset**: Secure password recovery flow
- ✅ **Email Verification**: Email confirmation required

### Dependency Management
- ✅ **Regular Updates**: Dependencies kept up-to-date
- ✅ **Vulnerability Scanning**: `npm audit` run regularly
- ✅ **No Hardcoded Secrets**: All credentials in environment variables

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

[Your Contributing Guidelines Here]

---

## 📧 Support

For support, email support@lunacareers.com or open an issue in the repository.

---

**Built with ❤️ by the Luna Careers Team**
