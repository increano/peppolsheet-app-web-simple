# CheckAuth() Calls Analysis

This document lists all instances of `checkAuth()` calls found in the project directory.

## Active Code Files

### 1. `frontend/web/lib/auth-context.tsx`

#### Line 57: Initial Auth Check
```typescript
useEffect(() => {
  checkAuth()  // ✅ ACTIVE - Initial authentication check on component mount
```
**Purpose:** Initial authentication check when the auth context provider mounts  
**Status:** ✅ Active and necessary  
**Trigger:** Component mount, locale changes

#### Line 288: Manual Profile Refresh
```typescript
const refreshUserProfile = async () => {
  if (session?.user) {
    await checkAuth()  // ✅ ACTIVE - Manual profile refresh
  }
}
```
**Purpose:** Manual refresh of user profile data  
**Status:** ✅ Active and necessary  
**Trigger:** Called explicitly by `refreshUserProfile()` function

#### Lines 66 & 75: Commented Out Auth State Changes
```typescript
// Don't call checkAuth() here as it triggers loading state unnecessarily
// Don't call checkAuth() here as it triggers loading state
```
**Purpose:** Previously called on SIGNED_IN and TOKEN_REFRESHED events  
**Status:** 🚫 Disabled - Removed to prevent unnecessary loading states  
**Previous Issue:** Was causing loading spinner to appear every 5 minutes during token refresh

## Documentation Files (Reference Only)

### 2. `frontend/docs/AUTH_ENHANCEMENT_PLAN.md`
#### Line 78: Documentation Reference
```markdown
1. **Enhanced checkAuth()** - Load tenant_users + tenants data
```
**Purpose:** Documentation describing checkAuth() functionality  
**Status:** 📚 Documentation only

### 3. `frontend/web/lib/auth-context.tsx.backup`
#### Line 63: Backup File
```typescript
checkAuth()
```
**Purpose:** Backup copy of original implementation  
**Status:** 🗃️ Backup file - not active

### 4. `frontend/web/docs/auth/AUTH_REFACTOR_PLAN.md`
#### Line 74: Documentation Reference
```typescript
checkAuth()
```
**Purpose:** Documentation showing planned implementation  
**Status:** 📚 Documentation only

## Summary

- **Total Active Calls:** 2
- **Disabled/Removed Calls:** 2 (to fix loading issues)
- **Documentation References:** 3

## Recent Changes

### Fixed Loading Issues
The following `checkAuth()` calls were **removed** to prevent unnecessary loading states:

1. **SIGNED_IN Event Handler** - Previously triggered on sign-in events
2. **TOKEN_REFRESHED Event Handler** - Previously triggered every ~5 minutes during token refresh

These removals fixed the issue where users would see loading spinners randomly appearing every few minutes.

## Current Behavior

The auth system now only calls `checkAuth()` when:
1. The app initially loads (necessary for authentication)
2. User manually refreshes their profile (via `refreshUserProfile()`)

This ensures a smooth user experience without unnecessary loading interruptions.
