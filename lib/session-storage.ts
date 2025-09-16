import { Session } from '@supabase/supabase-js'

export class SessionStorage {
  private static readonly SESSION_KEY = 'supabase_session'
  private static readonly EXPIRY_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

  static async storeSession(session: Session): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
  }

  static async getSession(): Promise<Session | null> {
    if (typeof window === 'undefined') return null
    const sessionStr = localStorage.getItem(this.SESSION_KEY)
    if (!sessionStr) return null
    try {
      return JSON.parse(sessionStr)
    } catch (error) {
      console.error('Failed to parse session:', error)
      return null
    }
  }

  static async clearSession(): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.SESSION_KEY)
  }

  static async isSessionExpiringSoon(): Promise<boolean> {
    const session = await this.getSession()
    if (!session?.expires_at) return true
    
    const expiryTime = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    
    return expiryTime - now <= this.EXPIRY_THRESHOLD
  }
}