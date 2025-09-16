"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  fallback = <LoginRedirect />
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Debug logging (reduced frequency)
  useEffect(() => {
    console.log('🛡️ ProtectedRoute - Auth state:', { 
      user: user ? { email: user.email, id: user.id } : null, 
      loading, 
      error 
    })
  }, [user?.id, loading, error]) // Only log when these specific values change

  useEffect(() => {
    if (!loading && !user) {
      console.log('🚨 Unauthenticated user accessing protected route, redirecting to login')
      router.push(`/${locale}/login`)
    }
  }, [user, loading, router, locale])

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('⏳ ProtectedRoute - Loading...')
    return <LoadingSpinner />
  }

  // Show error if there's an authentication error
  if (error) {
    console.log('❌ ProtectedRoute - Auth error:', error)
    return <AuthError error={error} />
  }

  // Don't render children if user is not authenticated
  if (!user) {
    console.log('🚫 ProtectedRoute - No user, showing fallback')
    return fallback
  }

  // No tenant checks here - just render if user is authenticated
  console.log('✅ ProtectedRoute - User authenticated, rendering children')
  return <>{children}</>
}

// Helper components
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function LoginRedirect() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    console.log('🔄 LoginRedirect - Redirecting to login page')
    router.push(`/${locale}/login`)
  }, [router, locale])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}

function AuthError({ error }: { error: string }) {
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
            <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userState } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 PublicRoute - Authenticated user detected, userState:', userState)
      
      // Handle different user states
      if (userState === 'new_user' || userState === 'no_tenant') {
        console.log('🔄 PublicRoute - User needs onboarding, redirecting to login/onboarding')
        router.push(`/${locale}/login/onboarding`)
      } else if (userState === 'corrupted_account') {
        console.log('🔄 PublicRoute - Corrupted account, redirecting to account recovery')
        router.push(`/${locale}/login/recovery`)
      } else if (userState === 'complete_user') {
        console.log('🔄 PublicRoute - Complete user, redirecting to e-invoice overview')
        router.push(`/${locale}/dashboard/e-invoice/overview`)
      }
      // If userState is 'loading', don't redirect yet
    }
  }, [user, loading, userState, router, locale])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render children if user is authenticated (they should be redirected)
  if (user) {
    return null
  }

  return <>{children}</>
}