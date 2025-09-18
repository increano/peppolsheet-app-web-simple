"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (!loading && !hasRedirected) {
      console.log('🏠 HomePage - Auth state:', { 
        user: user ? { 
          email: user.email, 
          userState: user.userState, 
          tenantId: user.tenantId 
        } : null,
        loading,
        currentPath: window.location.pathname
      })
      
      if (!user) {
        // No authentication
        console.log('🏠 HomePage - Redirecting to login')
        setHasRedirected(true)
        router.push(`/${locale}/login`)
        
      } else if (user.userState === 'new_user') {
        // Genuine new user - redirect to onboarding
        console.log('🏠 HomePage - New user, redirecting to onboarding')
        setHasRedirected(true)
        router.push(`/${locale}/onboarding`)
        
      } else if (user.userState === 'corrupted_account') {
        // Corrupted account - redirect to account recovery
        console.log('🏠 HomePage - Corrupted account, redirecting to account recovery')
        setHasRedirected(true)
        router.push(`/${locale}/account-recovery`)
        
      } else if (user.userState === 'no_tenant') {
        // User exists but no active tenant - redirect to signup completion
        console.log('🏠 HomePage - User needs tenant setup, redirecting to signup')
        setHasRedirected(true)
        router.push(`/${locale}/signup`)
        
      } else if (user.userState === 'complete_user') {
        // Complete user - redirect to e-invoice overview
        console.log('🏠 HomePage - Complete user, redirecting to e-invoice overview')
        setHasRedirected(true)
        router.push(`/${locale}/dashboard/overview`)
        
      } else {
        // Loading state - wait for classification
        console.log('🏠 HomePage - User state still loading, waiting...')
      }
    }
  }, [user, loading, router, locale, hasRedirected])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading spinner while redirecting
  if (hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render anything while redirecting
  return null
}