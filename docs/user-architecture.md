# User Architecture

## Account Types vs User Roles

### Account Type
Determines **portal access**:
- `personal` → Personal portal only
- `organization` → Organization portal only  
- `platformAdmin` → Admin portal only
- `hybrid` → Both personal and organization portals

### User Role
Determines **permissions within portal**:
- Personal: `candidate`, `premium_member`
- Organization: `organization_member`, `recruiter`, `hr_manager`, `hiring_manager`, `org_admin`
- Admin: `super_admin`, `moderator`, `support`

## Hybrid Users
Users with `account_type='hybrid'` can:
1. Access both `/u/*` and `/org/*` routes
2. Switch context via Context Switcher component
3. Have `current_context` field: `'personal'` | `'organization'`

### Context Switching
```
POST /api/auth/switch-context
{ "context": "organization" }
→ Updates user.current_context
→ Returns redirect URL
```

## Organization Relationship
- `organization_id` links users to organizations
- Required for `account_type` IN (`organization`, `hybrid`)
- Multiple users can belong to same organization

