"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRoleAuth, SystemRole } from '@/lib/role-auth-context'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: SystemRole
  fallback?: React.ReactNode
}

export function RoleProtectedRoute({ 
  children, 
  requiredRole,
  fallback = <RoleAccessDenied />
}: RoleProtectedRouteProps) {
  const { roleUser, roleState, loading, error } = useRoleAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Debug logging
  useEffect(() => {
    console.log('🛡️ RoleProtectedRoute - Role auth state:', { 
      roleUser: roleUser ? { email: roleUser.email, role: roleUser.role } : null, 
      roleState, 
      loading, 
      error,
      requiredRole
    })
  }, [roleUser?.id, roleState, loading, error, requiredRole])

  useEffect(() => {
    if (!loading && roleState === 'no_role') {
      console.log('🚨 User has no role, redirecting to e-invoice overview')
      router.push(`/${locale}/dashboard/e-invoice/overview`)
    }
  }, [roleState, loading, router, locale])



  // Show loading spinner while checking role authentication
  if (loading) {
    console.log('⏳ RoleProtectedRoute - Loading...')
    return <RoleLoadingSpinner />
  }

  // Show error if there's a role authentication error
  if (error) {
    console.log('❌ RoleProtectedRoute - Role auth error:', error)
    return <RoleAuthError error={error} />
  }

  // Don't render children if user has no role
  if (roleState === 'no_role') {
    console.log('🚫 RoleProtectedRoute - No role, showing fallback')
    return fallback
  }

  // Check if user has the required role
  if (requiredRole && roleUser && roleUser.role !== requiredRole) {
    console.log('🚫 RoleProtectedRoute - Insufficient role:', {
      userRole: roleUser.role,
      requiredRole: requiredRole
    })
    return <RoleAccessDenied requiredRole={requiredRole} userRole={roleUser.role} />
  }

  // User has appropriate role, render children
  console.log('✅ RoleProtectedRoute - Role access granted, rendering children')
  return <>{children}</>
}

// Helper components
function RoleLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking role permissions...</p>
      </div>
    </div>
  )
}

function RoleAuthError({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Role Authentication Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleAccessDenied({ 
  requiredRole, 
  userRole 
}: { 
  requiredRole?: SystemRole
  userRole?: SystemRole 
}) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    console.log('🔄 RoleAccessDenied - Redirecting to e-invoice overview')
    router.push(`/${locale}/dashboard/e-invoice/overview`)
  }, [router, locale])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Access Denied</h3>
            <p className="mt-1 text-sm text-yellow-700">
              {requiredRole && userRole 
                ? `You need ${requiredRole} role to access this page. Your current role is ${userRole}.`
                : 'You do not have the required role to access this page.'
              }
            </p>
            <p className="mt-2 text-sm text-yellow-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Public route for role users (redirects if they have a role)
export function RolePublicRoute({ children }: { children: React.ReactNode }) {
  const { roleUser, loading, roleState } = useRoleAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    if (!loading && roleState === 'has_role' && roleUser) {
      console.log('🔄 RolePublicRoute - Role user detected, redirecting to appropriate dashboard')
      
      // Redirect to role-specific dashboard
      const dashboardRoutes = {
        admin: '/dashboard/admin',
        support: '/dashboard/support'
      }
      
      const dashboardRoute = dashboardRoutes[roleUser.role] || '/dashboard/e-invoice/overview'
      router.push(`/${locale}${dashboardRoute}`)
    }
  }, [roleUser, loading, roleState, router, locale])

  // Show loading spinner while checking role authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render children if user has a role (they should be redirected)
  if (roleState === 'has_role' && roleUser) {
    return null
  }

  return <>{children}</>
}
