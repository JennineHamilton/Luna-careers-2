# API Documentation

> Complete API reference for Luna Careers platform endpoints.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)

---

## Overview

All API routes are located in `app/api/` and follow RESTful conventions.

### Base URL
```
Development: http://localhost:3000/api
Production: https://app.lunacareers.com/api
```

### Request Format
- **Content-Type**: `application/json`
- **Authentication**: JWT token in cookies (managed by Supabase Auth)

### Response Format
```json
{
  "data": {},           // Success response data
  "error": "message",   // Error message (if error)
  "message": "success"  // Success message (if applicable)
}
```

---

## Authentication

### Authentication Flow

1. **Sign Up**: `POST /api/auth/signup`
2. **Sign In**: `POST /api/auth/signin`
3. **Sign Out**: `POST /api/auth/signout`
4. **Password Reset Request**: `POST /api/auth/forgot-password`
5. **Password Reset**: `POST /api/auth/reset-password`

### Sign Up

**Endpoint**: `POST /api/auth/signup`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "accountType": "personal"
}
```

**Validation**:
- Email: Valid email format
- Password: Min 8 characters, 1 uppercase, 1 lowercase, 1 number
- First/Last Name: 2-50 characters
- Account Type: `personal` | `organization` | `platformAdmin`

**Response** (201):
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "message": "Password reset email sent"
}
```

### Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "password": "NewSecurePassword123!"
}
```

**Headers**:
- Requires valid reset token in URL or cookies

**Response** (200):
```json
{
  "message": "Password reset successful"
}
```

---

## Rate Limiting

### Rate Limit Tiers

| Tier | Limit | Endpoints |
|------|-------|-----------|
| **AUTH** | 5 requests / 15 minutes | `/api/auth/*` |
| **API** | 100 requests / minute | Most API endpoints |
| **READ** | 300 requests / minute | GET endpoints |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded Response (429)

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | OK | Successful GET/POST/PATCH |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid input/validation error |
| **401** | Unauthorized | Not authenticated |
| **403** | Forbidden | Not authorized |
| **404** | Not Found | Resource not found |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |

### Validation Errors

All validation errors include field-level details:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/signup` | Create new account | AUTH |
| POST | `/api/auth/signin` | Sign in to account | AUTH |
| POST | `/api/auth/signout` | Sign out | AUTH |
| POST | `/api/auth/forgot-password` | Request password reset | AUTH |
| POST | `/api/auth/reset-password` | Reset password | AUTH |

### Learning Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/learning/courses` | List all courses | READ |
| GET | `/api/learning/courses/[id]` | Get course details | READ |
| POST | `/api/learning/enroll` | Enroll in content | API |
| GET | `/api/learning/enrollments` | User's enrollments | READ |
| POST | `/api/learning/complete` | Mark content complete | API |

### Scholarship Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/scholarships/apply` | Apply for scholarship | API |
| GET | `/api/scholarships/user` | User's applications | READ |
| PATCH | `/api/scholarships/[id]/withdraw` | Withdraw application | API |
| GET | `/api/scholarships/admin/list` | Admin: List all | READ |
| PATCH | `/api/scholarships/[id]/review` | Admin: Review application | API |

### Payment Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/payments/bank-transfer/submit` | Submit bank transfer | API |
| GET | `/api/payments/bank-transfer/submissions` | List submissions | READ |
| POST | `/api/payments/bank-transfer/approve` | Admin: Approve transfer | API |
| POST | `/api/payments/bank-transfer/reject` | Admin: Reject transfer | API |

### Job Board Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/jobs/vacancies` | List job vacancies | READ |
| GET | `/api/jobs/vacancies/[id]` | Get vacancy details | READ |
| POST | `/api/jobs/apply` | Apply to job | API |
| GET | `/api/jobs/applications` | User's applications | READ |

### SCORM Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/scorm/[...path]` | Serve SCORM files | READ |
| POST | `/api/scorm/upload` | Upload SCORM package | API |

---

**Last Updated**: February 14, 2026

