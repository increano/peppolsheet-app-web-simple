import { useEffect, useRef } from 'react'
import { SessionStorage } from '@/lib/session-storage'
import { supabase } from '@/lib/auth-context'

/**
 * Custom hook for automatic session refresh
 */
export const useSessionRefresh = () => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, storing session')
          await SessionStorage.storeSession(session)
          startRefreshTimer()
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session')
          await SessionStorage.clearSession()
          stopRefreshTimer()
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed, updating stored session')
          await SessionStorage.storeSession(session)
        }
      }
    )

    // Start refresh timer if user is already signed in
    checkExistingSession()

    return () => {
      subscription.unsubscribe()
      stopRefreshTimer()
    }
  }, [])

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await SessionStorage.storeSession(session)
      startRefreshTimer()
    }
  }

  const startRefreshTimer = () => {
    // Clear existing timer
    stopRefreshTimer()
    
    // Set up periodic refresh check (every 30 seconds)
    refreshIntervalRef.current = setInterval(async () => {
      try {
        const isExpiringSoon = await SessionStorage.isSessionExpiringSoon()
        
        if (isExpiringSoon) {
          console.log('Session expiring soon, attempting refresh...')
          
          const { data: { session }, error } = await supabase.auth.refreshSession()
          
          if (error) {
            console.error('Failed to refresh session:', error)
            await SessionStorage.clearSession()
            stopRefreshTimer()
            return
          }
          
          if (session) {
            console.log('Session refreshed successfully')
            await SessionStorage.storeSession(session)
          }
        }
      } catch (error) {
        console.error('Error during session refresh check:', error)
      }
    }, 30000) // Check every 30 seconds
  }

  const stopRefreshTimer = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  const forceRefresh = async () => {
    try {
      console.log('Force refreshing session...')
      
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Failed to force refresh session:', error)
        await SessionStorage.clearSession()
        throw error
      }
      
      if (session) {
        console.log('Session force refreshed successfully')
        await SessionStorage.storeSession(session)
        return session
      }
      
      return null
    } catch (error) {
      console.error('Error during force refresh:', error)
      throw error
    }
  }

  return {
    forceRefresh
  }
}

/**
 * Hook for getting session refresh status
 */
export const useSessionStatus = () => {
  const getSessionInfo = async () => {
    try {
      const session = await SessionStorage.getSession()
      // TODO: Implement these methods in SessionStorage
      // const expiryTime = await SessionStorage.getSessionExpiry()
      // const timeUntilExpiry = await SessionStorage.getTimeUntilExpiry()
      // const isExpiringSoon = await SessionStorage.isSessionExpiringSoon()
      // const isValid = await SessionStorage.isSessionValid()
      
      return {
        session,
        expiryTime: null,
        timeUntilExpiry: null,
        isExpiringSoon: false,
        isValid: !!session,
        expiryDate: null
      }
    } catch (error) {
      console.error('Failed to get session info:', error)
      return {
        session: null,
        expiryTime: null,
        timeUntilExpiry: null,
        isExpiringSoon: false,
        isValid: false,
        expiryDate: null
      }
    }
  }

  return {
    getSessionInfo
  }
}