"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  UserCheck,
  Building2,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Edit,
  Trash2,
  Grid3X3,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  Globe
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { BusinessEntityForm } from '@/components/invoice/business-entity/business-entity-form'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { useDebounce } from 'use-debounce'
import { CompanySearchV2Response, CompanyV2 } from '@/shared/types/company-search-v2'


interface Partner {
  id: string
  name: string
  business_name?: string
  email?: string
  phone?: string
  tax_id?: string
  billing_country?: string
  billing_city?: string
  billing_street_address?: string
  status: string
  created_at: string
}



export default function PartnersPage() {
  const t = useTranslations('partners')
  const { user } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)

  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPartners()
    }
  }, [user])

  // Only search existing partners - company search moved to Add Partner modal

  const fetchPartners = async () => {
    if (!user) return

    try {
      setLoading(true)
      
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

      // Fetch partners (customers) for this tenant
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantUser.tenant_id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setPartners(data || [])
    } catch (error) {
      console.error('Error fetching partners:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch partners')
    } finally {
      setLoading(false)
    }
  }

  // Belgian company search function for Add Partner modal  
  const searchCompanies = async (searchTerm: string, countries: string[] = ['BE']) => {
    const params = new URLSearchParams({
      q: searchTerm,
      country: countries.join(','),
      limit: '10'
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    try {
      // Use Next.js v2 API route to avoid CORS issues
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
      
      // Handle the v2 API response format
      const companies: CompanyV2[] = data.companies || []
      const totalCount = data.total_count || companies.length
      const queryTime = data.query_time_ms || 0
      const cacheHit = data.cache_hit || false
      const dataSource = data.data_source || 'unknown'
      
      console.log(`✅ Found ${companies.length} companies (${totalCount} total) in ${queryTime}ms (cache: ${cacheHit}, source: ${dataSource})`)
    
    // Transform v2 response to consistent format for the UI
    return companies.map((company: CompanyV2) => ({
      unified_id: company.tax_id,
      company_name: company.names?.[0]?.name || 'Unknown Company',
      vat_number: company.tax_id, // Belgian VAT number from tax_id
      registration_number: company.tax_id,
      source_country: company.company_country,
      legal_form: company.names?.[0]?.company_type || '',
      status: 'Active',
      address: {
        street: company.company_street,
        city: company.company_city,
        postal_code: company.company_postal_code,
        country: company.company_country,
        country_code: company.company_country
      },
      contact: {
        phone: company.phone || null,
        email: company.email || null,
        website: company.website || null
      },
      business_info: {
        industry_code: company.industries?.[0]?.industry_code || 0,
        industry_description: company.industries?.[0]?.industry_name || 'No description available',
        employee_count: null, // Not provided in v2 API response
        founding_date: company.created_at
      },
      peppol_info: {
        is_registered: Boolean(company.peppol_data?.[0]?.participant_id),
        participant_id: company.peppol_data?.[0]?.participant_id || null,
        supported_document_types: company.peppol_data?.[0]?.document_types || []
      },
      data_quality: {
        completeness_score: 0.8,
        source_reliability: 'high' // Official government data
      },
      // Additional fields from v2 API
      source_system: 'v2_api',
      processed_at: company.updated_at
    }))
    
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Search timed out. Please try again with a more specific search term.')
        } else if (error.message.includes('fetch')) {
          throw new Error('Cannot connect to company search service. Please try again.')
        } else {
          throw error
        }
      }
      
      throw new Error('An unexpected error occurred during search. Please try again.')
    }
  }

  const handleAddPartner = (partnerData: any) => {
    // Refresh the partners list
    fetchPartners()
    setShowAddForm(false)
  }



  // Filtering logic
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCountry = countryFilter === 'all' || partner.billing_country === countryFilter
    
    return matchesSearch && matchesCountry
  })

  // Sorting logic
  const sortedPartners = [...filteredPartners].sort((a, b) => {
    let aValue = ''
    let bValue = ''
    
    switch (sortField) {
      case 'name':
        aValue = a.name || ''
        bValue = b.name || ''
        break
      case 'email':
        aValue = a.email || ''
        bValue = b.email || ''
        break
      case 'country':
        aValue = a.billing_country || ''
        bValue = b.billing_country || ''
        break
      case 'tax_id':
        aValue = a.tax_id || ''
        bValue = b.tax_id || ''
        break
      case 'created_at':
        aValue = a.created_at || ''
        bValue = b.created_at || ''
        break
      default:
        aValue = a.name || ''
        bValue = b.name || ''
    }
    
    const comparison = aValue.localeCompare(bValue)
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Get unique countries for filter
  const availableCountries = Array.from(new Set(partners.map(p => p.billing_country).filter(Boolean)))

  // Sort function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const getPartnerTypeLabel = (partner: Partner) => {
    if (partner.billing_country === 'BE') return 'Belgian Company'
    if (['DE', 'FR', 'NL', 'IT', 'ES', 'AT', 'DK', 'SE', 'FI'].includes(partner.billing_country || '')) return 'EU Company'
    return 'International Company'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="ml-0 md:ml-64 p-4 md:p-6">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                <p className="text-gray-600 mt-1">
                  Manage your business partners and customers
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-3"
                  >
                    <TableIcon className="w-4 h-4 mr-1" />
                    Table
                  </Button>
                </div>
                
                {/* Add Partner Button */}
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </div>
            </div>



            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search your partners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </Button>
                  <Badge variant="secondary">
                    {sortedPartners.length} partners
                  </Badge>
                </div>


                
                 {/* Advanced Filters */}
                {showFilters && (
                  <div className="flex items-center space-x-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="country-filter" className="text-sm font-medium text-gray-700">
                        Country:
                      </label>
                      <Select
                        value={countryFilter}
                        onValueChange={(value) => setCountryFilter(value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Countries</SelectItem>
                          {availableCountries.sort().map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label htmlFor="sort-field" className="text-sm font-medium text-gray-700">
                        Sort by:
                      </label>
                      <Select
                        value={sortField}
                        onValueChange={(value) => setSortField(value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="tax_id">VAT Number</SelectItem>
                          <SelectItem value="created_at">Date Added</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center space-x-1"
                    >
                      {getSortIcon('')}
                      <span>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partners List */}
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Loading partners...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={fetchPartners}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : sortedPartners.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No partners found' : 'No partners yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Start by adding your first business partner'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Partner
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4">
                {sortedPartners.map((partner) => (
                  <Card key={partner.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {partner.name}
                              </h3>
                            </div>
                            <Badge variant="outline">
                              {getPartnerTypeLabel(partner)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">


                            {partner.tax_id && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Receipt className="w-4 h-4" />
                                <span>VAT: {partner.tax_id}</span>
                              </div>
                            )}

                            {(partner.billing_street_address || partner.billing_city) && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600 md:col-span-2">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {partner.billing_street_address && `${partner.billing_street_address}, `}
                                  {partner.billing_city}
                                  {partner.billing_country && ` (${partner.billing_country})`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Table View
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('name')}
                        >
                          Company
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>

                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('billing_country')}
                        >
                          Country
                          {getSortIcon('country')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort('tax_id')}
                        >
                          VAT Number
                          {getSortIcon('tax_id')}
                        </Button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{partner.name}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{partner.billing_country}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">{partner.tax_id || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getPartnerTypeLabel(partner)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Add Partner Modal/Form */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Add New Partner</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAddForm(false)}
                        >
                          ×
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BusinessEntityForm
                        onSubmit={handleAddPartner}
                        onCancel={() => setShowAddForm(false)}
                        isCompact={false}
                        searchCompanies={searchCompanies}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </main>
      </div>
    </ProtectedRoute>
  )
} 