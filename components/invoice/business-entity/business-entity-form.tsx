"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Building2, Search, Plus } from 'lucide-react'

interface BusinessEntity {
  id?: string
  type: 'individual' | 'belgianCompany' | 'euCompany' | 'nonEuCompany' | 'dontKnow'
  companyName: string
  street?: string
  number?: string
  box?: string
  postalCode?: string
  city?: string
  country?: string
  vatNumber?: string
}

const createBusinessEntitySchema = (t: any) => z.object({
  type: z.enum(['individual', 'belgianCompany', 'euCompany', 'nonEuCompany', 'dontKnow']).optional(),
  companyName: z.string().min(1, t('entityForm.companyNameRequired')),
  street: z.string().optional(),
  number: z.string().optional(),
  box: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, t('entityForm.countryRequired')),
  vatNumber: z.string().min(1, t('entityForm.entityNumberRequired'))
})

interface BusinessEntityFormProps {
  data?: BusinessEntity
  onSubmit: (data: BusinessEntity) => void
  onCancel: () => void
  isCompact?: boolean
  searchCompanies?: (searchTerm: string, countries?: string[]) => Promise<any[]>
}

export function BusinessEntityForm({ data, onSubmit, onCancel, isCompact = false, searchCompanies }: BusinessEntityFormProps) {
  const t = useTranslations('invoice')
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Company search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const businessEntitySchema = createBusinessEntitySchema(t)
  type BusinessEntityFormData = z.infer<typeof businessEntitySchema>

  const form = useForm<BusinessEntityFormData>({
    resolver: zodResolver(businessEntitySchema),
    defaultValues: {
      type: data?.type || 'belgianCompany',
      companyName: data?.companyName || '',
      street: data?.street || '',
      number: data?.number || '',
      box: data?.box || '',
      postalCode: data?.postalCode || '',
      city: data?.city || '',
      country: data?.country || 'BE', // Required field with default
      vatNumber: data?.vatNumber || '' // Required field
    }
  })

  const handleSubmit = async (formData: BusinessEntityFormData) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Save to database if this is a new entity
      if (!data?.id) {
        // First, get the user's tenant_id
        const { data: tenantUser, error: tenantError } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (tenantError || !tenantUser) {
          throw new Error('Unable to determine tenant context')
        }

        const customerData = {
          tenant_id: tenantUser.tenant_id,
          name: formData.companyName, // Map companyName to name field
          tax_id: formData.vatNumber,
          company_street_address: formData.street && formData.number ? 
            `${formData.street} ${formData.number}` : 
            formData.street || formData.number || null,
          company_city: formData.city || null,
          company_postal_code: formData.postalCode || null,
          company_country: formData.country,
          status: 'active'
        }

        const { data: savedCustomer, error: saveError } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single()

        if (saveError) {
          throw saveError
        }

                 // Return the saved entity with database ID
         onSubmit({
           ...formData,
           id: savedCustomer.id
         } as BusinessEntity)
       } else {
         // Return existing entity with updates
         onSubmit({
           ...formData,
           id: data.id
         } as BusinessEntity)
      }
    } catch (error) {
      console.error('Save error:', error)
      setError(error instanceof Error ? error.message : 'Failed to save business entity')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Company search function
  const handleCompanySearch = async () => {
    if (!searchCompanies || !searchTerm.trim()) return

    try {
      setSearchLoading(true)
      setSearchError(null)
      setSearchResults([])
      
      const results = await searchCompanies(searchTerm.trim())
      setSearchResults(results || [])
      
      if (!results || results.length === 0) {
        setSearchError('No companies found. Try a different search term.')
      }
    } catch (error) {
      console.error('Company search failed:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Fill form from selected company
  const fillFormFromCompany = (company: any) => {
    // Map company data to form fields
    form.setValue('companyName', company.company_name || '')
    form.setValue('street', company.address?.street || '')
    form.setValue('city', company.address?.city || '')
    form.setValue('postalCode', company.address?.postal_code || '')
    form.setValue('country', company.source_country || company.address?.country || 'BE')
    form.setValue('vatNumber', company.vat_number || company.registration_number || '')
    
    // Set company type based on country
    if (company.source_country === 'BE') {
      form.setValue('type', 'belgianCompany')
    } else if (['DE', 'FR', 'NL', 'IT', 'ES', 'AT', 'DK', 'SE', 'FI'].includes(company.source_country)) {
      form.setValue('type', 'euCompany')
    } else {
      form.setValue('type', 'nonEuCompany')
    }
    

    
    // Clear search results
    setSearchResults([])
    setSearchTerm('')
  }

  return (
    <div className="w-full">
      <Card>
        {!isCompact && (
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('entityForm.title')}</CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  {t('entityForm.subtitle')}
                </p>
              </div>
            </div>
          </CardHeader>
        )}
        
        <CardContent className={isCompact ? "p-4" : ""}>
          {isCompact && (
            <div className="mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('entityForm.title')}</h3>
              <p className="text-sm text-blue-600 mt-1">
                {t('entityForm.subtitle')}
              </p>
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className={isCompact ? "space-y-4" : "space-y-6"}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Company Search Section */}
            {searchCompanies && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Search European Companies</h4>
                </div>
                <div className="flex space-x-2 mb-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by company name, VAT number, or registration number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCompanySearch}
                    disabled={searchLoading || !searchTerm.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {searchLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
                
                {searchError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}
                
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700 font-medium">Found {searchResults.length} companies:</p>
                    {searchResults.map((company, index) => (
                      <div
                        key={company.unified_id || index}
                        className="flex items-start justify-between p-3 bg-white border border-blue-100 rounded hover:border-blue-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-gray-900">{company.company_name}</h5>
                            <span className="text-sm text-gray-500">({company.source_country})</span>
                            {company.peppol_info?.is_registered && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                ⚡ PEPPOL
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {company.vat_number && (
                              <div>VAT: {company.vat_number}</div>
                            )}
                            {company.address?.city && (
                              <div>📍 {company.address.city}, {company.address.country}</div>
                            )}
                            {company.business_info?.industry_description && (
                              <div className="italic">{company.business_info.industry_description}</div>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => fillFormFromCompany(company)}
                          className="bg-green-600 hover:bg-green-700 text-white ml-3"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Country, Type, and Entity Number - First Line */}
            <div className={`grid gap-4 ${isCompact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Country - Always First */}
              <div className="space-y-2">
                <Label htmlFor="country">{t('entityForm.country')} *</Label>
                <Select
                  value={form.watch('country')}
                  onValueChange={(value) => form.setValue('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BE">Belgium</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="NL">Netherlands</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                    <SelectItem value="ES">Spain</SelectItem>
                    <SelectItem value="AT">Austria</SelectItem>
                    <SelectItem value="DK">Denmark</SelectItem>
                    <SelectItem value="SE">Sweden</SelectItem>
                    <SelectItem value="NO">Norway</SelectItem>
                    <SelectItem value="FI">Finland</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600">{form.formState.errors.country.message}</p>
                )}
              </div>

              {/* Type Selection - Middle */}
              <div className="space-y-2">
                <Label htmlFor="type">{t('entityForm.type')}</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => form.setValue('type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t('entityForm.entityTypes.individual')}</SelectItem>
                    <SelectItem value="belgianCompany">{t('entityForm.entityTypes.belgianCompany')}</SelectItem>
                    <SelectItem value="euCompany">{t('entityForm.entityTypes.euCompany')}</SelectItem>
                    <SelectItem value="nonEuCompany">{t('entityForm.entityTypes.nonEuCompany')}</SelectItem>
                    <SelectItem value="dontKnow">{t('entityForm.entityTypes.dontKnow')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Number (Optional) - Last */}
              <div className="space-y-2">
                <Label htmlFor="vatNumber">{t('entityForm.entityNumber')} *</Label>
                <Input
                  id="vatNumber"
                  {...form.register('vatNumber')}
                  placeholder="1111.222.333"
                />
                {form.formState.errors.vatNumber && (
                  <p className="text-sm text-red-600">{form.formState.errors.vatNumber.message}</p>
                )}
              </div>
            </div>

            {/* Basic Information Grid */}
            <div className={`grid gap-4 ${isCompact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('entityForm.companyName')} *</Label>
                <Input
                  id="companyName"
                  {...form.register('companyName')}
                  placeholder=""
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                )}
              </div>


            </div>

            {/* Address Section - Compact Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Address</h3>
              
              <div className={`grid gap-4 ${isCompact ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                {/* Street - Full Width */}
                <div className={`space-y-2 ${isCompact ? 'md:col-span-4' : 'md:col-span-2'}`}>
                  <Label htmlFor="street">{t('entityForm.street')}</Label>
                  <Input
                    id="street"
                    {...form.register('street')}
                  />
                </div>

                {/* Number */}
                <div className="space-y-2">
                  <Label htmlFor="number">{t('entityForm.number')}</Label>
                  <Input
                    id="number"
                    {...form.register('number')}
                  />
                </div>
                
                {/* Box */}
                <div className="space-y-2">
                  <Label htmlFor="box">{t('entityForm.box')}</Label>
                  <Input
                    id="box"
                    {...form.register('box')}
                  />
                </div>

                {/* Postal Code */}
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('entityForm.postalCode')}</Label>
                  <Input
                    id="postalCode"
                    {...form.register('postalCode')}
                  />
                </div>
                
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">{t('entityForm.city')}</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                  />
                </div>
              </div>
            </div>



            {/* Action Buttons */}
            <div className={`flex items-center ${isCompact ? 'justify-between' : 'justify-end'} space-x-4 pt-4`}>
              {isCompact && (
                <div className="text-sm text-gray-600">
                  * Required fields
                </div>
              )}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  size={isCompact ? "sm" : "default"}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                  size={isCompact ? "sm" : "default"}
                >
                  {isSubmitting ? 'Saving...' : (isCompact ? 'Save' : t('entityForm.next'))}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 