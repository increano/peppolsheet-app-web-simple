"use client"

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'

// Initialize Supabase client (singleton pattern)
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
})()

// Role types
export type SystemRole = 'admin' | 'support' | 'editor' | 'technical' | null

// Role state types
export type RoleState = 'loading' | 'no_role' | 'has_role' | 'error'

// Extended user with role information
export interface RoleUser {
  id: string
  email: string
  role: SystemRole
  permissions: string[]
  lastAccess?: Date
}

// Role auth context type
export interface RoleAuthContextType {
  roleUser: RoleUser | null
  roleState: RoleState
  loading: boolean
  error: string | null
  hasRole: (role: SystemRole) => boolean
  hasAnyRole: () => boolean
  getRolePermissions: () => string[]
  logout: () => Promise<void>
  supabase: ReturnType<typeof createBrowserClient>
}

const RoleAuthContext = createContext<RoleAuthContextType | undefined>(undefined)

export function useRoleAuth() {
  const context = useContext(RoleAuthContext)
  if (!context) {
    throw new Error('useRoleAuth must be used within a RoleAuthProvider')
  }
  return context
}

// Role detection function (same as before but centralized)
function detectUserRole(userEmail: string): SystemRole {
  if (!userEmail) return null

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_USER_EMAIL
  const supportEmails = process.env.NEXT_PUBLIC_SUPPORT_USER_EMAILS?.split(',').map(email => email.trim()) || []
  const editorEmails = process.env.NEXT_PUBLIC_EDITOR_USER_EMAILS?.split(',').map(email => email.trim()) || []
  const technicalEmails = process.env.NEXT_PUBLIC_TECHNICAL_USER_EMAILS?.split(',').map(email => email.trim()) || []

  console.log('🔐 RoleAuth - Role detection:', {
    userEmail,
    adminEmail,
    supportEmails,
    editorEmails,
    technicalEmails,
    NEXT_PUBLIC_ADMIN_USER_EMAIL: process.env.NEXT_PUBLIC_ADMIN_USER_EMAIL
  })

  // Fallback: if environment variables are not set, treat as admin for development
  if (!adminEmail && !supportEmails.length && !editorEmails.length && !technicalEmails.length) {
    console.log('🔐 RoleAuth - No environment variables set, treating as admin for development')
    return 'admin'
  }

  if (userEmail === adminEmail) {
    console.log('🔐 RoleAuth - Admin role detected')
    return 'admin'
  }
  if (supportEmails.includes(userEmail)) {
    console.log('🔐 RoleAuth - Support role detected')
    return 'support'
  }
  if (editorEmails.includes(userEmail)) {
    console.log('🔐 RoleAuth - Editor role detected')
    return 'editor'
  }
  if (technicalEmails.includes(userEmail)) {
    console.log('🔐 RoleAuth - Technical role detected')
    return 'technical'
  }

  console.log('🔐 RoleAuth - No role detected')
  return null
}

// Role permissions mapping
const rolePermissions = {
  admin: [
    'canReviewEntities',
    'canManageSystem',
    'canViewAuditLogs',
    'canAccessAdminDashboard',
    'canApproveEntities',
    'canRejectEntities',
    'canMergeEntities',
    'canFlagEntities',
    'canViewUserData',
    'canResetPasswords',
    'canDisableAccounts',
    'canAccessSupportDashboard',
    'canViewUserAccounts',
    'canManageSupportTickets',
    'canUpdateContent',
    'canManageTemplates'
  ],
  support: [
    'canViewUserData',
    'canResetPasswords',
    'canDisableAccounts',
    'canAccessSupportDashboard',
    'canViewUserAccounts',
    'canManageSupportTickets'
  ],

}

export function RoleAuthProvider({ children }: { children: React.ReactNode }) {
  const [roleUser, setRoleUser] = useState<RoleUser | null>(null)
  const [roleState, setRoleState] = useState<RoleState>('loading')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Check role authentication
  const checkRoleAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔐 RoleAuth - Checking role authentication...')

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('🔐 RoleAuth - Session error:', sessionError)
        setError('Session error: ' + sessionError.message)
        setRoleState('error')
        setLoading(false)
        return
      }

      if (!session) {
        console.log('🔐 RoleAuth - No session found')
        setRoleState('no_role')
        setRoleUser(null)
        setLoading(false)
        return
      }

      const userEmail = session.user.email!
      console.log('🔐 RoleAuth - Checking role for user:', userEmail)

      // Detect user role
      const userRole = detectUserRole(userEmail)

      if (!userRole) {
        console.log('🔐 RoleAuth - No role assigned to user')
        setRoleState('no_role')
        setRoleUser(null)
        setLoading(false)
        return
      }

      // Get role permissions
      const permissions = rolePermissions[userRole] || []

      // Create role user object
      const roleUserData: RoleUser = {
        id: session.user.id,
        email: userEmail,
        role: userRole,
        permissions,
        lastAccess: new Date()
      }

      console.log('🔐 RoleAuth - Role user authenticated:', {
        email: userEmail,
        role: userRole,
        permissions: permissions.length
      })

      setRoleUser(roleUserData)
      setRoleState('has_role')
      setLoading(false)

    } catch (error) {
      console.error('🔐 RoleAuth - Error checking role auth:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setRoleState('error')
      setLoading(false)
    }
  }

  useEffect(() => {
    checkRoleAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 RoleAuth - Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session) {
          console.log('🔐 RoleAuth - User signed in, checking role...')
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => checkRoleAuth(), 0)
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 RoleAuth - User signed out, clearing role data')
          setRoleUser(null)
          setRoleState('no_role')
          setError(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Remove locale dependency to prevent infinite loops

  // Helper functions
  const hasRole = (role: SystemRole): boolean => {
    if (!roleUser) return false
    // Admin users have access to all roles
    if (roleUser.role === 'admin') return true
    return roleUser.role === role
  }

  const hasAnyRole = (): boolean => {
    return roleUser !== null
  }

  const getRolePermissions = (): string[] => {
    return roleUser?.permissions || []
  }

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      setRoleUser(null)
      setRoleState('no_role')
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error('🔐 RoleAuth - Logout error:', error)
      setError('Logout failed')
    }
  }

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔐 RoleAuth - State changed:', {
      roleState,
      loading,
      error,
      roleUser: roleUser ? { email: roleUser.email, role: roleUser.role } : null
    })
  }, [roleState, loading, error, roleUser?.id])

  // Memoized context value
  const contextValue = useMemo(() => ({
    roleUser,
    roleState,
    loading,
    error,
    hasRole,
    hasAnyRole,
    getRolePermissions,
    logout,
    supabase
  }), [roleUser, roleState, loading, error])

  return (
    <RoleAuthContext.Provider value={contextValue}>
      {children}
    </RoleAuthContext.Provider>
  )
}
