"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTenant } from '@/hooks/use-tenant'
import { supabase } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { 
  ChevronDown, 
  Building2, 
  Check, 
  Plus,
  Loader2
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  role: string
  created_at: string
}

export function TenantSwitcher() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  const fetchUserTenants = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          created_at,
          tenants (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tenants:', error)
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive"
        })
        return
      }

      const userTenants = data.map(item => ({
        id: item.tenant_id,
        name: (item.tenants as any).name,
        role: item.role,
        created_at: item.created_at
      }))

      setTenants(userTenants)
    } catch (error) {
      console.error('Error fetching tenants:', error)
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    fetchUserTenants()
  }, [user, fetchUserTenants]) // Include fetchUserTenants in dependencies

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === tenant?.id) return // Already selected
    
    // TODO: Implement tenant switching with new architecture
    toast({
      title: "Info",
      description: "Tenant switching not yet implemented in new architecture",
    })
  }

  const getShortcut = (index: number) => {
    return `⌘${index + 1}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No organization selected
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start px-3 py-2 h-auto text-left hover:bg-gray-50"
          disabled={switching}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tenant.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || 'Member'}
              </p>
            </div>
            {switching ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Organizations
        </DropdownMenuLabel>
        
        {tenants.map((t, index) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => handleTenantSwitch(t.id)}
            className="cursor-pointer"
            disabled={switching}
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {t.name}
                </span>
                <span className="text-xs text-gray-500 block">
                  {t.role}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {tenant.id === t.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
                <DropdownMenuShortcut>
                  {getShortcut(index)}
                </DropdownMenuShortcut>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            router.push(`/${locale}/create-organization`)
          }}
          className="cursor-pointer"
          disabled={switching}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                <Plus className="w-3 h-3 text-gray-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              Create organization
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 