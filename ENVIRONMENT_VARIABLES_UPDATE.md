# Environment Variables Migration Summary

## Overview
All hardcoded domain references (`fisica.cat` and `https://mail.fisica.cat`) have been replaced with environment variables from `.env.local`.

## Environment Variables Used

### In `.env.local`:
```env
APEX_DOMAIN=fisica.cat
SITE_URL=https://mail.fisica.cat
```

### For Client-Side Components:
You may need to add these to `.env.local` with `NEXT_PUBLIC_` prefix for client-side access:
```env
NEXT_PUBLIC_APEX_DOMAIN=fisica.cat
NEXT_PUBLIC_SITE_URL=https://mail.fisica.cat
```

## Files Modified

### 1. **Server-Side Files** (use `process.env.APEX_DOMAIN` and `process.env.SITE_URL`)
- `src/lib/cloudflare.ts`
- `src/lib/smtp2go.ts`
- `src/app/api/test-webhook/route.ts`
- `src/app/api/webhooks/incomingMail/route.ts`
- `src/app/api/forwarding/route.ts`
- `src/app/sign-up/page.tsx`

### 2. **Client-Side Files** (use `process.env.NEXT_PUBLIC_APEX_DOMAIN` and `process.env.NEXT_PUBLIC_SITE_URL`)
- `src/app/dashboard/monitor/page.tsx`
- `src/app/dashboard/test/page.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/sign-up/SignUpForm.tsx`
- `src/components/Sidebar.tsx`

### 3. **Database Files** (manual update required)
- `database-setup.sql` - Added comment about needing to manually update the domain in the generated column if you change `APEX_DOMAIN`

## Changes Made

### Pattern Used:
```typescript
// Server-side (API routes, lib files)
const APEX_DOMAIN = process.env.APEX_DOMAIN || 'fisica.cat';
const SITE_URL = process.env.SITE_URL || 'https://mail.fisica.cat';

// Client-side (React components)
const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || process.env.APEX_DOMAIN || 'fisica.cat';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://mail.fisica.cat';
```

### Replacements:
1. **`fisica.cat`** → `${APEX_DOMAIN}` or `{APEX_DOMAIN}`
2. **`https://mail.fisica.cat`** → `${SITE_URL}` or `{SITE_URL}`
3. **`alias@fisica.cat`** → `` `alias@${APEX_DOMAIN}` `` or `` `alias@{APEX_DOMAIN}` ``
4. **`test@mail.fisica.cat`** → `` `test@mail.${APEX_DOMAIN}` ``

## Important Database Note

The `profiles` table in `database-setup.sql` has a **GENERATED COLUMN** for the email field:

```sql
email TEXT GENERATED ALWAYS AS (alias || '@fisica.cat') STORED
```

⚠️ **This is hardcoded in the database schema and cannot use environment variables.**

### If You Change Your Domain:
1. Drop the existing profiles table:
   ```sql
   DROP TABLE profiles CASCADE;
   ```
2. Update the domain in `database-setup.sql`:
   ```sql
   email TEXT GENERATED ALWAYS AS (alias || '@yourdomain.com') STORED
   ```
3. Re-run the SQL to recreate the table
4. Existing user data will be lost unless you backup and migrate

## Testing

After making these changes, test the following:

1. **Sign Up** - Verify new users get `alias@yourdomain.com`
2. **Sign In** - Verify existing users can still sign in
3. **Webhook URL** - Check that `${SITE_URL}/api/webhooks/incomingMail` displays correctly
4. **Email Display** - Verify all UI elements show the correct domain
5. **DNS Records** - Verify Cloudflare DNS records are created with the correct domain

## Benefits

✅ Single source of truth for domain configuration
✅ Easy to rebrand or test with different domains
✅ No hardcoded values scattered throughout the codebase
✅ Fallback values ensure the app works even if env vars are missing
