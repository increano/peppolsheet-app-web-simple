"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Building2, User, AlertCircle } from 'lucide-react'
import { BusinessEntityForm } from '../business-entity/business-entity-form'
import { BusinessEntitySearch } from '../business-entity/business-entity-search'

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

interface BusinessEntityStepProps {
  data?: BusinessEntity
  onUpdate: (data: BusinessEntity) => void
}

type ViewMode = 'select' | 'search' | 'create'

export function BusinessEntityStep({ data, onUpdate }: BusinessEntityStepProps) {
  const t = useTranslations('invoice')
  const [selectedEntity, setSelectedEntity] = useState<BusinessEntity | undefined>(data)

  const handleEntitySelect = (entity: BusinessEntity) => {
    setSelectedEntity(entity)
    onUpdate(entity)
  }

  const handleEntityCreate = (entity: BusinessEntity) => {
    setSelectedEntity(entity)
    onUpdate(entity)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Section */}
      <BusinessEntitySearch
        onEntitySelect={handleEntitySelect}
        onCreateNew={() => {}} // Not needed since form is always visible
        selectedEntity={selectedEntity}
      />
      
      {/* Create/Edit Form - Always Visible */}
      <BusinessEntityForm
        data={selectedEntity}
        onSubmit={handleEntityCreate}
        onCancel={() => {
          setSelectedEntity(undefined)
          onUpdate(undefined as any) // Clear selection
        }}
        isCompact={true}
      />
    </div>
  )
} 