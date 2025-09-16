import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/auth-context'

interface Tenant {
  id: string
  name: string
  business_registration_number: string | null
  storecove_peppol_identifier: string | null
}

interface TenantUser {
  tenant_id: string
  role: string
  tenants: {
    id: string
    name: string
    business_registration_number: string | null
    storecove_peppol_identifier: string | null
  }
}

export function useTenant() {
  const { user, session } = useAuth()
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
      
      console.log('🔍 Loading tenant data for user:', user.id)
      
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

      if (tenantUser && tenantUser.tenants) {
        console.log('✅ Tenant data loaded successfully:', tenantUser)
        // Handle both array and object formats from Supabase
        const tenantInfo = Array.isArray(tenantUser.tenants) ? tenantUser.tenants[0] : tenantUser.tenants
        const tenantData: Tenant = {
          id: tenantInfo.id,
          name: tenantInfo.name,
          business_registration_number: tenantInfo.business_registration_number,
          storecove_peppol_identifier: tenantInfo.storecove_peppol_identifier
        }
        setTenant(tenantData)
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

      console.log('🏢 Creating tenant:', tenantData)

      // Call signup edge function to create tenant and associate user
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          email: user?.email,
          firstName: user?.user_metadata?.first_name || '',
          lastName: user?.user_metadata?.last_name || '',
          companyName: tenantData.name,
          businessRegistrationNumber: tenantData.businessRegistrationNumber,
          peppolId: tenantData.peppolId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tenant')
      }

      const result = await response.json()
      console.log('✅ Tenant created successfully:', result)
      
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