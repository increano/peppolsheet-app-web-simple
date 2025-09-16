export type UserState = 
  | 'loading'
  | 'new_user'
  | 'no_tenant'
  | 'corrupted_account'
  | 'complete_user'

export interface ExtendedUser {
  id: string
  email: string
  email_confirmed_at?: string
  user_metadata?: any
  
  // From tenant_users table
  tenantId?: string
  tenantSlug?: string
  tenantName?: string
  firstName?: string
  lastName?: string
  role?: string
  status?: string
  
  userState: UserState
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName?: string
  businessRegistrationNumber?: string
  peppolId?: string
  invoiceVolumePerMonth?: number
}

export interface EnhancedAuthContextType {
  user: ExtendedUser | null
  session: any
  loading: boolean
  error: string | null
  userState: UserState
  signIn: (email: string, password: string) => Promise<any>
  signUp: (userData: SignUpData) => Promise<any>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  login: (email: string, password: string) => Promise<any>
  signup: (userData: SignUpData) => Promise<any>
}
