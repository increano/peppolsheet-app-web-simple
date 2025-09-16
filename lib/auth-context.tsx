"use client"

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import { ExtendedUser, UserState, EnhancedAuthContextType } from '../shared/types/auth'

// Initialize Supabase client
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// User State Classification Function
function classifyUserState(authUser: any, tenantUser: any, tenant: any): UserState {
  if (!authUser) return 'loading'
  
  // No tenant_users record = new user
  if (!tenantUser) return 'new_user'
  
  // Has tenant_users but no tenant = corrupted
  if (tenantUser && !tenant) return 'corrupted_account'
  
  // Missing critical profile data = corrupted
  if (!tenantUser.first_name || !tenantUser.last_name || !tenantUser.email) {
    return 'corrupted_account'
  }
  
  // Inactive tenant_users status = needs tenant
  if (tenantUser.status !== 'active') return 'no_tenant'
  
  // All good
  return 'complete_user'
}

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userState, setUserState] = useState<UserState>('loading')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔑 Auth state changed:', event, session ? 'Session exists' : 'No session')
        
        if (event === 'SIGNED_IN' && session) {
          console.log('🔑 SIGNED_IN event - updating session silently')
          setSession(session)
          // Don't call checkAuth here to prevent infinite loops
          // The session update will trigger a re-render and the component will handle redirects
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setUserState('loading')
          console.log('🔑 SIGNED_OUT event - user logged out')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔑 TOKEN_REFRESHED event - updating session silently')
          setSession(session)
          // Don't call checkAuth() here as it triggers loading state
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [locale])

  // Helper function to load user profile from session
  const loadUserProfile = async (session: any) => {
    try {
      console.log('🔄 Loading user profile...')
      
      // Step 1: Load tenant_users profile with tenant data
      const { data: tenantUser, error: profileError } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenants (
            id,
            name,
            slug,
            subscription_status
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile load error:', profileError)
        // Continue with basic auth data if profile load fails
      }
      
      // Step 2: Classify user state
      const currentUserState = classifyUserState(session.user, tenantUser, tenantUser?.tenants)
      
      // Step 3: Build extended user object
      const extendedUser: ExtendedUser = {
        id: session.user.id,
        email: session.user.email!,
        email_confirmed_at: session.user.email_confirmed_at,
        user_metadata: session.user.user_metadata,
        
        // From tenant_users table
        tenantId: tenantUser?.tenant_id,
        tenantSlug: tenantUser?.tenants?.slug,
        tenantName: tenantUser?.tenants?.name,
        firstName: tenantUser?.first_name,
        lastName: tenantUser?.last_name,
        role: tenantUser?.role,
        status: tenantUser?.status,
        
        userState: currentUserState
      }
      
      console.log('✅ Profile loaded:', { 
        userState: currentUserState, 
        tenantId: extendedUser.tenantId,
        email: extendedUser.email
      })
      
      setUser(extendedUser)
      setUserState(currentUserState)
      
    } catch (error) {
      console.error('Profile load error:', error)
      setError(error instanceof Error ? error.message : 'Profile loading failed')
    }
  }

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      setUserState('loading')
      
      // Step 1: Get Supabase auth session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth check error:', error)
        setError(error.message)
        setSession(null)
        setUser(null)
        setUserState('loading')
        return
      }
      
      if (!session) {
        console.log('❌ Auth check - No session found')
        setSession(null)
        setUser(null)
        setUserState('loading')
        return
      }
      
      console.log('✅ Auth check - Session found, loading profile...')
      setSession(session)
      
      // Load user profile
      await loadUserProfile(session)
      
    } catch (error) {
      console.error('Auth check error:', error)
      setError(error instanceof Error ? error.message : 'Authentication check failed')
      setSession(null)
      setUser(null)
      setUserState('loading')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔑 Attempting to sign in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      if (data.user && data.session) {
        console.log('✅ Sign in successful - loading user profile')
        setSession(data.session)
        
        // Load user profile immediately after successful sign in
        await loadUserProfile(data.session)
      }
      
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error instanceof Error ? error.message : 'Sign in failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    companyName?: string
    businessRegistrationNumber?: string
    peppolId?: string
    invoiceVolumePerMonth?: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔑 Attempting to sign up user:', userData.email)
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            company_name: userData.companyName,
            business_registration_number: userData.businessRegistrationNumber,
            peppol_id: userData.peppolId,
            invoice_volume_per_month: userData.invoiceVolumePerMonth
          }
        }
      })
      
      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
      
      console.log('✅ Sign up successful - check email for confirmation')
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error instanceof Error ? error.message : 'Sign up failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      console.log('🔑 Attempting to sign out user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      console.log('✅ Sign out successful')
      setSession(null)
      setUser(null)
      setUserState('loading')
      
      // Redirect to login page
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error instanceof Error ? error.message : 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  // Add refreshUserProfile method
  const refreshUserProfile = async () => {
    if (session?.user) {
      await checkAuth()
    }
  }

  // Legacy method names for backward compatibility
  const login = signIn
  const signup = signUp

  const value = useMemo(() => ({
    user,
    session,
    loading,
    error,
    userState,
    signIn,
    signUp,
    logout,
    checkAuth,
    refreshUserProfile,
    login,
    signup
  }), [user, session, loading, error, userState])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}