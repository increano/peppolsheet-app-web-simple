"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Building2, User, Plus, Loader2 } from 'lucide-react'

interface BusinessEntity {
  id?: string
  type: 'individual' | 'belgianCompany' | 'euCompany' | 'nonEuCompany' | 'dontKnow'
  companyName: string
  email: string
  phone?: string
  street?: string
  number?: string
  box?: string
  postalCode?: string
  city?: string
  country?: string
  notes?: string
  vatNumber?: string
}

interface BusinessEntitySearchProps {
  onEntitySelect: (entity: BusinessEntity) => void
  onCreateNew: () => void
  selectedEntity?: BusinessEntity
}

export function BusinessEntitySearch({ onEntitySelect, onCreateNew, selectedEntity }: BusinessEntitySearchProps) {
  const t = useTranslations('invoice')
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<BusinessEntity[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim() || !user) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      // First, get the user's tenant_id
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenantUser) {
        console.error('Unable to determine tenant context:', tenantError)
        setSearchResults([])
        return
      }

      // Search in customers table with correct field names
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantUser.tenant_id)
        .or(`name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,tax_id.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        console.error('Search error:', error)
        setSearchResults([])
        return
      }

      // Transform database results to BusinessEntity format
      const entities: BusinessEntity[] = (customers || []).map(customer => ({
        id: customer.id,
        type: 'belgianCompany', // Default type, could be enhanced
        companyName: customer.name || '',
        email: customer.email || '',

        street: customer.billing_street_address || '',
        number: '', // Will be part of street address
        box: '', // Not mapped in current schema
        postalCode: customer.billing_postal_code || '',
        city: customer.billing_city || '',
        country: customer.billing_country || '',

        vatNumber: customer.tax_id || ''
      }))

      setSearchResults(entities)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return t('entityForm.entityTypes.individual')
      case 'belgianCompany':
        return t('entityForm.entityTypes.belgianCompany')
      case 'euCompany':
        return t('entityForm.entityTypes.euCompany')
      case 'nonEuCompany':
        return t('entityForm.entityTypes.nonEuCompany')
      default:
        return t('entityForm.entityTypes.dontKnow')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input - More Compact */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('businessEntity.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchTerm.trim() || isSearching}
              className="px-6"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('businessEntity.search')
              )}
            </Button>
          </div>
          
          {/* Show selected entity indicator */}
          {selectedEntity && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">
                  Selected: {selectedEntity.companyName}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results - More Compact */}
      {hasSearched && searchResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 px-1">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {searchResults.map((entity) => (
              <Card key={entity.id} className="hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {entity.type === 'individual' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{entity.companyName}</h4>
        
                        {entity.vatNumber && (
                          <p className="text-xs text-gray-500">VAT: {entity.vatNumber}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => onEntitySelect(entity)}
                      size="sm"
                      variant="outline"
                      className="ml-2 flex-shrink-0"
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 