# Authentication Refactor Implementation Plan

**Status:** 📋 **PLANNED** - Ready for implementation  
**Priority:** 🔥 **HIGH** - Fixes critical UX issue  
**Timeline:** 2-3 hours implementation  

## 🎯 Problem Statement

The current authentication flow has a **backwards design** that creates poor user experience and technical complexity:

### Current Flow (Problematic):
```
Signup → Email Confirmation → Check if user has tenant → If no tenant: onboarding → Dashboard
Login → Check if user has tenant → If no tenant: onboarding → Dashboard
```

### Issues with Current Approach:
1. **Circular dependency** in RLS policies (tenant_users table needs user_has_tenant_access function, which queries tenant_users)
2. **Confusing UX** - users expect login to work regardless of tenant setup
3. **Mixed concerns** - authentication and tenant management are tightly coupled
4. **Complex debugging** - hard to tell if issue is auth-related or tenant-related
5. **Poor separation of concerns** - auth context handles both authentication AND tenant management

## 🚀 Proposed Solution

### New Flow (Clean & Logical):
```
Signup → Email Confirmation → Login Success → Dashboard → Onboarding component (if no tenant)
Login → Login Success → Dashboard → Onboarding component (if no tenant)
```

### Benefits of New Approach:
1. **Separation of concerns** - authentication is separate from tenant management
2. **Better UX** - login always works, tenant setup is a dashboard feature
3. **Simpler debugging** - auth issues vs tenant issues are completely separate
4. **Progressive disclosure** - users see the app first, then set up their organization
5. **No RLS circular dependencies** - tenant checks happen after authentication
6. **Cleaner architecture** - each component has a single responsibility

## 📋 Implementation Steps

### Step 1: Simplify Auth Context
**File:** `lib/auth-context.tsx`

**Changes:**
- Remove `tenant` state from auth context
- Remove `loadTenantData` function
- Remove tenant-related logic from auth state changes
- Simplify auth context to handle ONLY authentication

**New Implementation:**
```typescript
// lib/auth-context.tsx - Simplified version
interface AuthContextType {
  user: any
  session: any
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (userData: SignUpData) => Promise<any>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  // Remove: tenant, switchTenant, loadTenantData
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Remove: tenant state

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        if (event === 'SIGNED_IN' && session) {
          await SessionStorage.storeSession(session)
          setSession(session)
          setUser(session.user)
          
          // Always redirect to dashboard after successful login
          console.log('🔑 SIGNED_IN event - redirecting to dashboard')
          router.push(`/${locale}/dashboard`)
        } else if (event === 'SIGNED_OUT') {
          await SessionStorage.clearSession()
          setSession(null)
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (session) {
        await SessionStorage.storeSession(session)
        setSession(session)
        setUser(session.user)
        // Remove: loadTenantData call
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setError(error instanceof Error ? error.message : 'Authentication check failed')
    } finally {
      setLoading(false)
    }
  }

  // Remove: loadTenantData, switchTenant functions
  // Keep: signIn, signUp, logout functions (unchanged)
}
```

### Step 2: Simplify Protected Route
**File:** `components/auth/protected-route.tsx`

**Changes:**
- Remove all tenant-related checks
- Remove `requireOnboarding` prop
- Simplify to only check authentication status
- Remove tenant-related helper components

**New Implementation:**
```typescript
// components/auth/protected-route.tsx - Simplified version
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  // Remove: requiredRole, requireOnboarding
}

export function ProtectedRoute({ 
  children, 
  fallback = <LoginRedirect />
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    if (!loading && !user) {
      console.log('🚨 Unauthenticated user accessing protected route, redirecting to login')
      router.push(`/${locale}/login`)
    }
  }, [user, loading, router, locale])

  if (loading) return <LoadingSpinner />
  if (error) return <AuthError error={error} />
  if (!user) return fallback

  // No tenant checks here - just render if user is authenticated
  console.log('✅ ProtectedRoute - User authenticated, rendering children')
  return <>{children}</>
}

// Remove: TenantSelector, AccessDenied components
// Keep: LoadingSpinner, LoginRedirect, AuthError components
```

### Step 3: Simplify Public Route
**File:** `components/auth/protected-route.tsx`

**Changes:**
- Remove tenant-related redirect logic
- Always redirect authenticated users to dashboard

**New Implementation:**
```typescript
// components/auth/protected-route.tsx - Simplified PublicRoute
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated - always redirect to dashboard
      console.log('🔄 PublicRoute - Authenticated user, redirecting to dashboard')
      router.push(`/${locale}/dashboard`)
    }
  }, [user, loading, router, locale])

  if (loading) return <LoadingSpinner />
  if (user) return null // Will redirect

  return <>{children}</>
}
```

### Step 4: Create Tenant Management Hook
**File:** `hooks/use-tenant.ts` (NEW)

**Purpose:** Separate tenant management from authentication

**Implementation:**
```typescript
// hooks/use-tenant.ts - New tenant management hook
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/auth-context'

interface Tenant {
  id: string
  name: string
  business_registration_number: string | null
  peppol_id: string | null
}

interface TenantUser {
  tenant_id: string
  role: string
  tenants: Tenant
}

export function useTenant() {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTenantData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadTenantData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: tenantUser, error } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          tenants (
            id,
            name,
            business_registration_number,
            storecove_peppol_identifier
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (tenantUser) {
        console.log('✅ Tenant data loaded successfully:', tenantUser)
        setTenant(tenantUser.tenants)
      } else {
        console.log('❌ No tenant found for user')
        setTenant(null)
      }
    } catch (error) {
      console.error('Error loading tenant data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tenant data')
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  const createTenant = async (tenantData: {
    name: string
    businessRegistrationNumber?: string
    peppolId?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      // Call signup edge function to create tenant and associate user
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          companyName: tenantData.name,
          businessRegistrationNumber: tenantData.businessRegistrationNumber,
          peppolId: tenantData.peppolId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create tenant')
      }

      const result = await response.json()
      
      // Reload tenant data after creation
      await loadTenantData()
      
      return result
    } catch (error) {
      console.error('Error creating tenant:', error)
      setError(error instanceof Error ? error.message : 'Failed to create tenant')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    tenant,
    loading,
    error,
    loadTenantData,
    createTenant,
    hasTenant: !!tenant
  }
}
```

### Step 5: Refactor Dashboard Page
**File:** `app/[locale]/dashboard/page.tsx`

**Changes:**
- Use new `useTenant` hook
- Show conditional onboarding within dashboard
- Remove tenant checks from route level

**New Implementation:**
```typescript
// app/[locale]/dashboard/page.tsx - New approach
'use client'

import { useTenant } from '@/hooks/use-tenant'
import { useAuth } from '@/lib/auth-context'
import { OnboardingComponent } from '@/components/onboarding/onboarding-component'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default function DashboardPage() {
  const { user } = useAuth()
  const { tenant, loading, error, hasTenant } = useTenant()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  // Show onboarding if no tenant, otherwise show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {!hasTenant ? (
        <div className="container mx-auto py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to PeppolSheet!
              </h1>
              <p className="text-gray-600">
                Let's set up your organization to get started with invoice management.
              </p>
            </div>
            <OnboardingComponent />
          </div>
        </div>
      ) : (
        <DashboardContent tenant={tenant} user={user} />
      )}
    </div>
  )
}
```

### Step 6: Create Onboarding Component
**File:** `components/onboarding/onboarding-component.tsx` (NEW)

**Purpose:** Handle tenant creation within dashboard context

**Implementation:**
```typescript
// components/onboarding/onboarding-component.tsx - Dashboard-level onboarding
'use client'

import { useState } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function OnboardingComponent() {
  const { createTenant, loading } = useTenant()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    companyName: '',
    businessRegistrationNumber: '',
    peppolId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      })
      return
    }

    try {
      await createTenant({
        name: formData.companyName,
        businessRegistrationNumber: formData.businessRegistrationNumber,
        peppolId: formData.peppolId
      })
      
      toast({
        title: "Success",
        description: "Organization created successfully!"
      })
      
      // Component will re-render with tenant data automatically
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Your Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter your company name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
            <Input
              id="businessRegistrationNumber"
              value={formData.businessRegistrationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          
          <div>
            <Label htmlFor="peppolId">PEPPOL ID</Label>
            <Input
              id="peppolId"
              value={formData.peppolId}
              onChange={(e) => setFormData(prev => ({ ...prev, peppolId: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Step 7: Update Route Definitions
**Files:** Various page files

**Changes:**
- Remove `requireOnboarding` props from ProtectedRoute usage
- Simplify route protection to only check authentication

**Examples:**
```typescript
// Before (complex)
<ProtectedRoute requireOnboarding={true}>
  <DashboardContent />
</ProtectedRoute>

// After (simple)
<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>
```

### Step 8: Update Middleware
**File:** `middleware.ts`

**Changes:**
- Remove tenant-related redirects
- Focus only on authentication

**New Implementation:**
```typescript
// middleware.ts - Simplified version
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Handle internationalization
  const locale = req.nextUrl.pathname.split('/')[1]
  if (!locales.includes(locale)) {
    return NextResponse.redirect(new URL('/en', req.url))
  }

  // Handle authentication
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/dashboard', '/invoices', '/customers', '/settings']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.includes(path)
  )

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  // Remove: tenant validation logic
  // All tenant management happens at component level

  return res
}
```

## 🧪 Testing Plan

### Test Cases to Verify:

1. **New User Flow:**
   - Sign up → Email confirmation → Login → Dashboard → Onboarding component shown
   - Create tenant → Dashboard content shown

2. **Existing User Flow:**
   - Login → Dashboard → Dashboard content shown (no onboarding)

3. **Authentication Only:**
   - Login/logout works regardless of tenant status
   - Protected routes redirect to login when not authenticated
   - Public routes redirect to dashboard when authenticated

4. **Tenant Management:**
   - Tenant creation works from dashboard
   - Dashboard shows appropriate content based on tenant status
   - No circular RLS dependencies

### Manual Testing Steps:

1. **Test New User:**
   ```
   1. Sign up with new email
   2. Confirm email
   3. Login → Should go to dashboard
   4. Should see onboarding component
   5. Fill out tenant form
   6. Should see dashboard content
   ```

2. **Test Existing User:**
   ```
   1. Login with existing account
   2. Should go directly to dashboard
   3. Should see dashboard content (no onboarding)
   ```

3. **Test Authentication:**
   ```
   1. Try accessing /dashboard without login → Should redirect to login
   2. Login → Should redirect to dashboard
   3. Logout → Should redirect to login
   ```

## 🚀 Deployment Steps

1. **Create backup of current files**
2. **Implement changes in order:**
   - Step 1: Auth context
   - Step 2: Protected route
   - Step 3: Public route
   - Step 4: Tenant hook
   - Step 5: Dashboard page
   - Step 6: Onboarding component
   - Step 7: Route updates
   - Step 8: Middleware
3. **Test thoroughly**
4. **Deploy incrementally**

## 📊 Expected Outcomes

### User Experience:
- ✅ Login always works and goes to dashboard
- ✅ Tenant setup is a clear, separate step
- ✅ Progressive disclosure of app features
- ✅ No confusing onboarding redirects

### Technical Benefits:
- ✅ Clean separation of concerns
- ✅ No RLS circular dependencies
- ✅ Easier debugging and maintenance
- ✅ More testable components
- ✅ Better error handling

### Code Quality:
- ✅ Single responsibility principle
- ✅ Reduced coupling between auth and tenant logic
- ✅ More maintainable codebase
- ✅ Clearer component boundaries

## 🔄 Rollback Plan

If issues arise:
1. **Revert auth-context.tsx** to include tenant loading
2. **Revert protected-route.tsx** to include tenant checks
3. **Remove new tenant hook and onboarding component**
4. **Revert dashboard page** to simple content

All changes are isolated and can be reverted independently.

---

**This refactor addresses the core UX issue and creates a much cleaner, more maintainable architecture. The separation of authentication and tenant management is the correct approach for a multi-tenant SaaS application.** 