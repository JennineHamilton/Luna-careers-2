# Supabase Integration

## Client Usage

### Client Components
```tsx
'use client';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('users').select();
```

### Server Components & API Routes
```tsx
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('users').select();
```

### Middleware
```tsx
import { createMiddlewareClient } from '@/lib/supabase/middleware';

const { supabase, response } = await createMiddlewareClient(request);
const { data: { user } } = await supabase.auth.getUser();
```

## Session Handling
- Sessions are managed via cookies
- Middleware refreshes sessions automatically
- User metadata includes `account_type`, `user_role`, `current_context`

## Type Safety

### Database Types
All database types are auto-generated from the live Supabase schema:

```bash
# Regenerate types from database
node scripts/generate-types.js
node scripts/generate-typescript-types.js
```

Types are located in `types/database.types.ts` and should **never be manually edited**.

### Table Queries (Strict Typing)
All `.from()` queries use proper TypeScript types with **NO type assertions**:

```typescript
// ✅ CORRECT - Properly typed
const { data, error } = await supabase
  .from('users')
  .select('id, email, account_type')
  .eq('id', userId)
  .single();

// ❌ WRONG - Never use 'as any' on table queries
const { data } = await (supabase.from('users') as any).select();
```

### RPC Function Calls (Acceptable `as any`)
Due to Supabase type generation limitations, RPC functions have `Args: Record<string, never>`.

**Acceptable Pattern:**
```typescript
// Define return type interface
interface ValidateTokenResult {
  valid: boolean;
  user_id?: string;
  email?: string;
}

// RPC call with typed parameters and return
const { data, error } = await supabase
  .rpc('validate_invitation_token', {
    p_token: token,
    p_temporary_password: password,
  } as any)  // Required for Supabase RPC typing limitation
  .returns<ValidateTokenResult>();

if (error) {
  console.error('RPC error:', error);
  // Handle error
}

// data is now typed as ValidateTokenResult
if (data && data.valid) {
  // TypeScript knows about valid, user_id, email properties
}
```

**Why This Is Acceptable:**
- ✅ Scoped to RPC parameters only (known Supabase limitation)
- ✅ Return type is explicitly defined with `.returns<Type>()`
- ✅ Documents the limitation with comment
- ✅ Maintains type safety on response data

**Examples in Codebase:**
- `app/api/admin/users/create/route.ts` - `generate_invitation_token`
- `app/api/onboarding/set-password/route.ts` - `mark_invitation_token_used`
- `app/api/onboarding/validate-token/route.ts` - `validate_invitation_token`

### Type Safety Rules

**✅ ALLOWED:**
- `as any` on RPC function parameters only
- Always followed by `.returns<ExplicitType>()`
- Must include comment: `// Required for Supabase RPC typing limitation`

**❌ NEVER ALLOWED:**
- `as any` on `.from()` table queries
- `as any` on entire query chains
- `as any` on response data
- `as any` anywhere else in the codebase

