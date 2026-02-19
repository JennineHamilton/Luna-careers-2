# Multi-Tenancy & Portal Structure

## Portals
| Portal | Path | Account Types |
|--------|------|---------------|
| Personal | `/u/*` | personal, hybrid (personal context) |
| Organization | `/org/*` | organization, hybrid (org context) |
| Admin | `/cmd/*` | platformAdmin |

## Routing Logic
1. Root `/` → redirects to `/login`
2. Auth check in middleware
3. Portal access based on `account_type` + `current_context`

## Public Routes
- `/courses/[id]` - Course details
- `/login`, `/signup`, `/forgot-password`, `/reset-password`

## Post-Login Redirect
| Account Type | Redirect |
|--------------|----------|
| personal | `/u/dashboard` |
| organization | `/org/dashboard` |
| platformAdmin | `/cmd/dashboard` |
| hybrid | `/u/dashboard` (personal context default) |

