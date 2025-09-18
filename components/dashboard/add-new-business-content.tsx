"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Check,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from './data-table'
import { useRoleAuth } from '@/lib/role-auth-context'
import { CompanySearchV2Response, CompanyV2 } from '@/shared/types/company-search-v2'
import { useRouter } from 'next/navigation'

// Company type definition
type Company = {
  id: string
  name: string
  logo?: string
  domain?: string
  industry?: string
  location: string
  peppolEnabled: boolean
  createdOn: string
  vatNumber?: string
  legalForm?: string
  status?: string
  employeeCount?: string
  // PEPPOL data preservation
  peppolId?: string
  peppolData?: any
}

interface AddNewBusinessContentProps {
  onClose?: () => void
}

type TabType = 'search' | 'manual'
type ManualStepType = 'company-details' | 'contact-info' | 'business-details' | 'billing-preferences' | 'review-save'

export function AddNewBusinessContent({ onClose }: AddNewBusinessContentProps) {
  const { supabase } = useRoleAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMultiSelect, setIsMultiSelect] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAddingCompanies, setIsAddingCompanies] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Manual form state
  const [currentStep, setCurrentStep] = useState<ManualStepType>('company-details')
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    streetAddress: '',
    city: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    taxId: '',
    website: '',
    currency: 'USD',
    preferredContact: 'Email'
  })
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)


  // Real API search function for European companies using v2 endpoint
  const searchCompanies = async (query: string): Promise<Company[]> => {
    if (!query.trim()) return []
    
    setIsSearching(true)
    
    try {
      // Log the exact query being sent
      console.log(`🔍 Searching for: "${query}" (length: ${query.length})`)
      
      const params = new URLSearchParams({
        q: query.trim(), // Ensure query is trimmed
        country: 'BE',
        limit: '10',
        page: '1'
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch(`/api/v2/companies/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Search failed: ${response.status === 500 ? 'Service temporarily unavailable' : 'Please try a different search term'}`)
      }

      const data: CompanySearchV2Response = await response.json()
      console.log('🔍 V2 API Response:', data)
      
      const companies: CompanyV2[] = data.companies || []
      const totalCount = data.total_count || companies.length
      const queryTime = data.query_time_ms || 0
      const cacheHit = data.cache_hit || false
      const dataSource = data.data_source || 'unknown'
      
      console.log(`✅ Found ${companies.length} companies (${totalCount} total) in ${queryTime}ms (cache: ${cacheHit}, source: ${dataSource})`)
      
      // Log first few results for debugging
      if (companies.length > 0) {
        console.log('📋 Sample results:', companies.slice(0, 3).map(c => ({
          name: c.names?.[0]?.name || 'Unknown Company',
          vat: c.tax_id,
          industry: c.industries?.[0]?.industry_name || 'Unknown Industry'
        })))
      }
    
      return companies.map((company: CompanyV2) => ({
        id: company.tax_id || Math.random().toString(),
        name: company.names?.[0]?.name || 'Unknown Company',
        logo: (company.names?.[0]?.name || 'U').charAt(0).toUpperCase(),
        domain: company.website || '',
        industry: company.industries?.[0]?.industry_name || 'Unknown Industry',
        location: `${company.company_city || 'Unknown City'}, ${company.company_country || 'Unknown Country'}`,
        peppolEnabled: Boolean(company.peppol_data?.[0]?.participant_id),
        createdOn: company.created_at || 'Unknown Date',
        vatNumber: company.tax_id || '',
        legalForm: company.names?.[0]?.company_type || '',
        status: 'Active',
        employeeCount: 'Unknown',
        // Preserve original PEPPOL data
        peppolId: company.peppol_data?.[0]?.participant_id || '',
        peppolData: company.peppol_data || []
      }))
    
    } catch (error) {
      console.error('Company search failed:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Search timed out. Please try again with a more specific search term.')
        } else if (error.message.includes('fetch')) {
          throw new Error('Cannot connect to company search service. Please try again.')
        } else {
          throw error
        }
      }
      
      throw new Error('An unexpected error occurred during search.')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Trim the query to handle trailing spaces
    const trimmedQuery = query.trim()
    
    if (trimmedQuery.length >= 3) {
      setShowDropdown(true)
      try {
        const results = await searchCompanies(trimmedQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
        // You could add a toast notification here for user feedback
      }
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  // Handle company selection
  const handleCompanySelect = (company: Company, isSelected: boolean) => {
    console.log(`handleCompanySelect called for ${company.name}:`, isSelected)
    
    if (!isMultiSelect) {
      // Single select mode - always replace current selection
      setSelectedCompanies([company])
      console.log('Single select mode - new selection:', [company.name])
    } else {
      // Multi-select mode - toggle selection
      if (isSelected) {
        setSelectedCompanies(prev => {
          const newSelection = [...prev, company]
          console.log('Multi-select mode - new selection:', newSelection.map(c => c.name))
          return newSelection
        })
      } else {
        setSelectedCompanies(prev => {
          const newSelection = prev.filter(c => c.id !== company.id)
          console.log('Multi-select mode - new selection:', newSelection.map(c => c.name))
          return newSelection
        })
      }
    }
  }

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (!isMultiSelect) {
      // Single select mode - select all is not available
      return
    }
    
    if (isSelected) {
      setSelectedCompanies(searchResults)
    } else {
      setSelectedCompanies([])
    }
  }

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedCompanies([])
  }

  // Handle adding selected companies (Direct Business Entity Creation - No Staging)
  const handleAddSelected = async () => {
    if (selectedCompanies.length === 0) {
      console.log('No companies selected')
      return
    }

    setIsAddingCompanies(true)
    console.log(`🔄 Adding ${selectedCompanies.length} companies directly as business entities`)
    
    try {
      // Prepare companies for direct import with correct field mappings
      const companiesForImport = selectedCompanies.map(company => ({
        // Core company information
        name: company.name,
        vatNumber: company.vatNumber || '',
        email: '', // Will be filled later
        phone: '', // Will be filled later
        domain: company.domain || '',
        industry: company.industry || '',
        
        // Address fields (extracted from location)
        city: company.location.split(',')[0]?.trim() || '',
        country: company.location.split(',')[1]?.trim() || 'BE',
        
        // PEPPOL information - preserve original data
        peppolEnabled: company.peppolEnabled,
        peppolId: company.peppolId || '', // Use preserved original PEPPOL ID
        peppolData: company.peppolData || [], // Preserve full PEPPOL data structure
        peppolDocuments: company.peppolEnabled ? ['INVOICE'] : [],
        
        // Legal form (from company type)
        legalForm: company.legalForm || 'Unknown'
      }))

      console.log('📋 Prepared companies for direct import:', companiesForImport)

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Call the direct import API to create business entities immediately
      const response = await fetch('/api/business-entities/direct-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companies: companiesForImport
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to add companies: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Companies added successfully:', result)

      // Clear selections after successful addition
      setSelectedCompanies([])
      
      // Show success message (you can add a toast notification here)
      alert(`Successfully added ${result.results.submitted} companies as business entities. They are now available for use.`)
      
      // Optionally close the modal or navigate to next step
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error('❌ Failed to add companies:', error)
      alert(`Failed to add companies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAddingCompanies(false)
    }
  }

  // Handle manual form submission
  const handleManualFormSubmit = async () => {
    if (!formData.companyName.trim()) {
      alert('Please enter a company name')
      return
    }

    setIsSubmittingManual(true)

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Prepare data for business_entities_staging table
      const stagingData = {
        names: [{ name: formData.companyName }], // JSONB array with company name
        tax_id: formData.taxId || null,
        email: formData.email || null,
        website: formData.website || null,
        industries: formData.industry ? [{ industry_name: formData.industry }] : null, // JSONB array with industry
        company_street_address: formData.streetAddress || null,
        company_city: formData.city || null,
        company_postal_code: formData.zipCode || null,
        company_country: formData.country || 'BE',
        currency: formData.currency || 'USD', // Default from schema
        submitted_by: session.user.id,
        verification_status: 'pending',
        source_type: 'manual'
      }

      console.log('Submitting to business_entities_staging:', stagingData)
      console.log('Field names being sent:', Object.keys(stagingData))

      // Insert into business_entities_staging table
      const { data, error } = await supabase
        .from('business_entities_staging')
        .insert(stagingData)
        .select()

      if (error) {
        console.error('Error saving to staging:', error)
        throw new Error(`Failed to save company: ${error.message}`)
      }

      console.log('Successfully saved to staging:', data)

      // Show success message
      alert('Company successfully submitted for review! It has been saved to the staging area and will be reviewed by administrators.')

      // Redirect to Company List section
      router.push('/en/dashboard/e-invoice/companies')

    } catch (error) {
      console.error('Error submitting manual form:', error)
      alert(`Error saving company: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmittingManual(false)
    }
  }

  // Function to trim text to specified length
  const trimText = (text: string, maxLength: number = 30) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // Table columns definition for search results
  const searchColumns: ColumnDef<Company>[] = useMemo(() => [
    // Only show select column in multi-select mode
    ...(isMultiSelect ? [{
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            handleSelectAll(!!value)
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            handleCompanySelect(row.original, !!value)
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }] : []),
    {
      accessorKey: 'name',
      header: 'Company',
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
              {company.logo}
            </div>
            <div>
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-gray-500">
                {company.domain} • {company.industry} • {company.location}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'employeeCount',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{row.getValue('employeeCount')}</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      ),
    },
  ], [])

  // Table columns definition for selected companies
  const selectedColumns: ColumnDef<Company>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
              {company.logo}
            </div>
            <div>
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-gray-500">{company.domain}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => <div className="text-sm">{row.getValue('location')}</div>,
    },
    {
      accessorKey: 'peppolEnabled',
      header: 'E-invoice Enabled',
      cell: ({ row }) => (
        <Badge variant={row.getValue('peppolEnabled') ? 'default' : 'secondary'}>
          {row.getValue('peppolEnabled') ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'vatNumber',
      header: 'Tax ID',
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue('vatNumber')}</div>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCompanySelect(row.original, false)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ], [])

  // Manual form steps
  const steps = [
    { id: 'company-details', name: 'Company Details', icon: Building2, description: 'Basic company information' },
    { id: 'contact-info', name: 'Contact Information', icon: MapPin, description: 'Address and contact details' },
    { id: 'business-details', name: 'Business Details', icon: FileText, description: 'Tax ID and registration' },
            { id: 'billing-preferences', name: 'Billing Preferences', icon: CreditCard, description: 'Currency and contact preferences' },
    { id: 'review-save', name: 'Review & Save', icon: Check, description: 'Final confirmation' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

    // Render search tab content
  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Mode and Selection Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
              isMultiSelect 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Checkbox
              checked={isMultiSelect}
              onCheckedChange={(checked) => {
                console.log('Multi-select checkbox clicked, new value:', checked)
                setIsMultiSelect(checked as boolean)
              }}
              className="flex-shrink-0"
            />
            <span className={`text-sm font-medium ${
              isMultiSelect ? 'text-blue-700' : 'text-gray-700'
            }`}>
              Multi-Select Mode
            </span>
          </div>
          {selectedCompanies.length > 0 && (
            <span className="text-sm text-gray-600">
              {isMultiSelect ? `${selectedCompanies.length} companies selected` : '1 company selected'}
            </span>
          )}
        </div>
        {selectedCompanies.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllSelections}>
            Clear All
          </Button>
        )}
      </div>

      {/* Search Input with Dropdown */}
      <div className="relative max-w-2xl" ref={searchContainerRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={isMultiSelect ? "Search and select multiple organizations..." : "Search and select an organization..."}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4 py-3 text-base"
        />
        
        {/* Search Results Dropdown */}
        {showDropdown && searchQuery.length >= 3 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div>
                {searchResults.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      if (!isMultiSelect) {
                        // Single select mode - replace current selection
                        setSelectedCompanies([company])
                      } else {
                        // Multi-select mode - toggle selection
                        handleCompanySelect(company, !selectedCompanies.some(c => c.id === company.id))
                      }
                    }}
                  >
                    {/* Checkbox - only show in multi-select mode */}
                    {isMultiSelect && (
                      <Checkbox
                        checked={selectedCompanies.some(c => c.id === company.id)}
                        onCheckedChange={(checked) => {
                          const isCurrentlySelected = selectedCompanies.some(c => c.id === company.id)
                          handleCompanySelect(company, !isCurrentlySelected)
                        }}
                        className="flex-shrink-0"
                      />
                    )}
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {company.logo}
                    </div>
                                         <div className="flex-1 min-w-0">
                       <div className="font-medium text-sm truncate">{company.name}</div>
                       <div className="text-xs text-gray-500 truncate">
                         {company.domain && `${company.domain} • `}{trimText(company.industry)} • {company.location}
                         {company.vatNumber && (
                           <span className="ml-1 font-mono">• {company.vatNumber.replace(/[^0-9]/g, '').slice(-10)}</span>
                         )}
                       </div>
                     </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {company.employeeCount !== 'Unknown' && (
                        <span className="text-xs text-gray-600">{company.employeeCount}</span>
                      )}
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {/* Manual Add Link at Bottom */}
                <div className="p-3 border-t border-gray-100">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="w-full justify-center text-sm"
                    onClick={() => setActiveTab('manual')}
                  >
                    Not found? Add company manually →
                  </Button>
                </div>
              </div>
            )}
            
            {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">No companies found for "{searchQuery}"</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setActiveTab('manual')}
                >
                  Add company manually →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Companies */}
      {selectedCompanies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Companies ({selectedCompanies.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAllSelections}>
                Clear All
              </Button>
              <Button size="sm" onClick={handleAddSelected} disabled={isAddingCompanies}>
                {isAddingCompanies ? "Adding..." : (isMultiSelect ? "Add All Selected" : "Add Selected")}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden">
            <DataTable 
              columns={selectedColumns} 
              data={selectedCompanies} 
              pageSize={15} 
            />
          </div>
        </div>
      )}
    </div>
  )

  // Render manual form step
  const renderManualStep = () => {
    switch (currentStep) {
      case 'company-details':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <Input
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <Input
                placeholder="e.g., Technology, Healthcare"
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              />
            </div>

          </div>
        )
      
      case 'contact-info':
                return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <Input
                placeholder="Enter street address"
                value={formData.streetAddress}
                onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <Input
                  placeholder="ZIP Code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>
        )

      case 'business-details':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN
              </label>
              <Input
                placeholder="Enter tax identification number"
                value={formData.taxId}
                onChange={(e) => setFormData({...formData, taxId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <Input
                placeholder="https://company-website.com"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>
          </div>
        )

      case 'billing-preferences':
        return (
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.preferredContact}
                onChange={(e) => setFormData({...formData, preferredContact: e.target.value})}
              >
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Mail">Mail</option>
              </select>
            </div>
          </div>
        )

      case 'review-save':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Review Company Information</h4>
              <p className="text-sm text-gray-600">
                Please review all the information you've entered before saving the company profile.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium">{formData.companyName || '[Company Name]'}</span>
              </div>
                            <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industry:</span>
                <span className="text-sm font-medium">{formData.industry || '[Industry]'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Address:</span>
                <span className="text-sm font-medium">
                  {[formData.streetAddress, formData.city, formData.zipCode, formData.country].filter(Boolean).join(', ') || '[Full Address]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Contact:</span>
                <span className="text-sm font-medium">
                  {[formData.email, formData.phone].filter(Boolean).join(' & ') || '[Email & Phone]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax ID:</span>
                <span className="text-sm font-medium">{formData.taxId || '[Tax ID]'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Currency:</span>
                <span className="text-sm font-medium">{formData.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search Organization
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Add Manually
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'search' ? (
          renderSearchTab()
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar - Steps */}
            <div className="w-64 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Company Steps</h3>
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const IconComponent = step.icon
                  const isActive = currentStep === step.id
                  const isCompleted = index < currentStepIndex
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id as ManualStepType)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : isCompleted
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{step.name}</div>
                          <div className={`text-sm ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                            {step.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Content - Form */}
            <div className="flex-1">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {steps[currentStepIndex]?.name}
                </h3>
                <p className="text-gray-600">{steps[currentStepIndex]?.description}</p>
              </div>
              
              {renderManualStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStepIndex > 0) {
                      setCurrentStep(steps[currentStepIndex - 1].id as ManualStepType)
                    }
                  }}
                  disabled={currentStepIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    if (currentStepIndex < steps.length - 1) {
                      setCurrentStep(steps[currentStepIndex + 1].id as ManualStepType)
                    } else {
                      // Save company
                      handleManualFormSubmit()
                    }
                  }}
                  disabled={isSubmittingManual}
                >
                  {isSubmittingManual ? 'Saving...' : currentStepIndex === steps.length - 1 ? 'Save Company' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
