"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  Plus,
  Upload,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from './data-table'
import { useRoleAuth } from '@/lib/role-auth-context'
import { CompanySearchV2Response, CompanyV2 } from '@/shared/types/company-search-v2'

// Company type definition
type Company = {
  id: string
  name: string
  industry: string
  location: string
  peppolEnabled: boolean
  createdOn: string
  vatNumber?: string
  legalForm?: string
  status?: string
  // Additional fields for CSV import
  businessName?: string
  taxId?: string
  email?: string
  phone?: string
  website?: string
  relationshipType?: string
  customerNumber?: string
  supplierNumber?: string
  paymentTerms?: string
  creditLimit?: string
  billingAddress?: string
  billingCity?: string
  billingState?: string
  billingPostalCode?: string
  billingCountry?: string
  peppolScheme?: string
  currency?: string
  preferredPaymentMethod?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  bankName?: string
  creditRating?: string
  storecoveReceiverIdentifier?: string
  storecoveSenderIdentifier?: string
}

interface AddNewBusinessProps {
  isOpen: boolean
  onClose: () => void
}

// Non-modal version for direct page integration
export function AddNewBusinessContent({ onClose }: { onClose?: () => void }) {
  const { supabase } = useRoleAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [importStep, setImportStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Company[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Real API search function for European companies
  const searchCompanies = async (query: string): Promise<Company[]> => {
    if (!query.trim()) return []
    
    setIsSearching(true)
    
    try {
      const params = new URLSearchParams({
        q: query,
        country: 'BE',
        limit: '10'
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      // Use the v2 company search API
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
    
      // Transform v2 response to Company format for the UI
      return companies.map((company: CompanyV2) => ({
        id: company.tax_id || Math.random().toString(),
        name: company.names?.[0]?.name || 'Unknown Company',
        industry: company.industries?.[0]?.industry_name || 'Unknown Industry',
        location: `${company.company_city || 'Unknown City'}, ${company.company_country || 'Unknown Country'}`,
        peppolEnabled: Boolean(company.peppol_data?.[0]?.participant_id),
        createdOn: company.created_at || 'Unknown Date',
        vatNumber: company.tax_id || '',
        legalForm: company.names?.[0]?.company_type || '',
        status: 'Active'
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

  // Real-time search effect
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        const results = await searchCompanies(searchQuery)
        setSearchResults(results)
      } else {
        setSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    const isAlreadySelected = selectedCompanies.some(c => c.id === company.id)
    if (!isAlreadySelected) {
      setSelectedCompanies(prev => [...prev, company])
    }
  }

  // Handle company deselection
  const handleCompanyDeselect = (companyId: string) => {
    setSelectedCompanies(prev => prev.filter(c => c.id !== companyId))
  }

  // Handle confirmation
  const handleConfirmSelection = async () => {
    console.log('Selected companies:', selectedCompanies)
    
    if (selectedCompanies.length === 0) {
      alert('Please select at least one company before confirming.')
      return
    }

    setIsConfirming(true)

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Transform selected companies to business entities format
      const businessEntities = selectedCompanies.map(company => ({
        name: company.name,
        tax_id: company.vatNumber || company.taxId || null,
        billing_country: company.billingCountry || 'BE',
        billing_city: company.billingCity || company.location.split(',')[0]?.trim() || null,
        billing_street_address: company.billingAddress || null,
        billing_postal_code: company.billingPostalCode || null,
        relationship_type: 'customer', // Default to customer, can be changed later
      }))

      console.log('Saving business entities:', businessEntities)

      // Save to business_entities table
      const { data, error } = await supabase
        .from('business_entities')
        .insert(businessEntities)
        .select()

      if (error) {
        console.error('Error saving business entities:', error)
        throw new Error(`Failed to save companies: ${error.message}`)
      }

      console.log('Successfully saved business entities:', data)

      // Close the dialog and reset state
      onClose()
      setSelectedCompanies([])
      setSearchResults([])
      setSearchQuery('')

      // Show success message
      alert(`Successfully added ${businessEntities.length} companies to your business entities! They are now available in your contacts.`)

    } catch (error) {
      console.error('Error confirming selection:', error)
      
      let errorMessage = 'Error saving companies. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setIsConfirming(false)
    }
  }

  // Handle CSV file upload and processing
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    
    try {
      const csvData = await parseCSVFile(file)
      setPreviewData(csvData)
      setImportStep(2)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      alert('Error parsing CSV file. Please ensure the file is properly formatted.')
    }
  }

  // Parse CSV file and convert to Company format
  const parseCSVFile = async (file: File): Promise<Company[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string
          const lines = csvText.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          
          // Validate required headers
          const requiredHeaders = ['company_name', 'relationship_type']
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
          }
          
          const companies: Company[] = []
          
          // Skip header row and process data rows
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue // Skip empty lines
            
            // Parse CSV line (handling quoted values)
            const values = parseCSVLine(line)
            
            if (values.length >= headers.length) {
              const company: Company = {
                id: `csv-${i}`,
                name: values[headers.indexOf('company_name')] || '',
                industry: values[headers.indexOf('industry')] || '',
                location: `${values[headers.indexOf('billing_city')] || ''}, ${values[headers.indexOf('billing_state')] || ''}`.trim(),
                peppolEnabled: !!(values[headers.indexOf('peppol_scheme')] || values[headers.indexOf('storecove_receiver_identifier')] || values[headers.indexOf('storecove_sender_identifier')]),
                createdOn: 'Today',
                // Add additional fields for display
                businessName: values[headers.indexOf('business_name')] || '',
                taxId: values[headers.indexOf('tax_id')] || '',
                email: values[headers.indexOf('email')] || '',
                phone: values[headers.indexOf('phone')] || '',
                website: values[headers.indexOf('website')] || '',
                relationshipType: values[headers.indexOf('relationship_type')] || '',
                customerNumber: values[headers.indexOf('customer_number')] || '',
                supplierNumber: values[headers.indexOf('supplier_number')] || '',
                paymentTerms: values[headers.indexOf('payment_terms')] || '',
                creditLimit: values[headers.indexOf('credit_limit')] || '',
                billingAddress: values[headers.indexOf('billing_address')] || '',
                billingCity: values[headers.indexOf('billing_city')] || '',
                billingState: values[headers.indexOf('billing_state')] || '',
                billingPostalCode: values[headers.indexOf('billing_postal_code')] || '',
                billingCountry: values[headers.indexOf('billing_country')] || '',
                peppolScheme: values[headers.indexOf('peppol_scheme')] || '',
                currency: values[headers.indexOf('currency')] || '',
                preferredPaymentMethod: values[headers.indexOf('preferred_payment_method')] || '',
                bankAccountNumber: values[headers.indexOf('bank_account_number')] || '',
                bankRoutingNumber: values[headers.indexOf('bank_routing_number')] || '',
                bankName: values[headers.indexOf('bank_name')] || '',
                creditRating: values[headers.indexOf('credit_rating')] || '',
                storecoveReceiverIdentifier: values[headers.indexOf('storecove_receiver_identifier')] || '',
                storecoveSenderIdentifier: values[headers.indexOf('storecove_sender_identifier')] || ''
              }
              
              companies.push(company)
            }
          }
          
          resolve(companies)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())
    return values.map(v => v.replace(/^"|"$/g, '')) // Remove surrounding quotes
  }

  // Handle import confirmation
  const handleConfirmImport = async () => {
    console.log('Importing companies:', previewData)
    
    setIsImporting(true)
    
    try {
      // Process each company based on relationship_type
      const customers = previewData.filter(company => company.relationshipType === 'customer')
      const suppliers = previewData.filter(company => company.relationshipType === 'supplier')
      
      console.log(`Importing ${customers.length} customers and ${suppliers.length} suppliers`)
      
      let totalSubmitted = 0
      
      // Import customers via API
      if (customers.length > 0) {
        console.log('Importing customers:', customers)
        const customerResult = await importCustomers(customers)
        console.log('Customer result:', customerResult)
        totalSubmitted += customerResult.results?.submitted || customerResult.submitted || 0
      }
      
      // Import suppliers via API
      if (suppliers.length > 0) {
        console.log('Importing suppliers:', suppliers)
        const supplierResult = await importSuppliers(suppliers)
        console.log('Supplier result:', supplierResult)
        totalSubmitted += supplierResult.results?.submitted || supplierResult.submitted || 0
      }
      
      // Close the dialog and reset state
      onClose()
      setShowBulkImport(false)
      setImportStep(1)
      setUploadedFile(null)
      setPreviewData([])
      setSelectedCompanies([])
      
      // Show success message for staging submission
      alert(`Successfully submitted ${totalSubmitted} companies for admin review! They will be available for approval in the admin dashboard.`)
      
    } catch (error) {
      console.error('Error importing companies:', error)
      
      // Show more specific error message
      let errorMessage = 'Error submitting companies for review. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  // Reset import flow
  const resetImportFlow = () => {
    setShowBulkImport(false)
    setImportStep(1)
    setUploadedFile(null)
    setPreviewData([])
  }

  // API functions to import customers and suppliers
  const importCustomers = async (customers: Company[]) => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/business-entities/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companies: customers,
          relationshipType: 'customer'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import customers: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Customers imported successfully:', result)
      return result
    } catch (error) {
      console.error('Error importing customers:', error)
      throw error
    }
  }

  const importSuppliers = async (suppliers: Company[]) => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/business-entities/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companies: suppliers,
          relationshipType: 'supplier'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import suppliers: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Suppliers imported successfully:', result)
      return result
    } catch (error) {
      console.error('Error importing suppliers:', error)
      throw error
    }
  }

  // Column definitions
  const columns: ColumnDef<Company>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => {
        // Check if all visible companies are selected
        const allVisibleSelected = searchResults.length > 0 && searchResults.every(company => 
          selectedCompanies.some(selected => selected.id === company.id)
        )
        // Check if some (but not all) visible companies are selected
        const someVisibleSelected = searchResults.some(company => 
          selectedCompanies.some(selected => selected.id === company.id)
        )
        
        return (
          <Checkbox
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected
            }}
            onCheckedChange={(value) => {
              if (value) {
                searchResults.forEach(company => {
                  handleCompanySelect(company)
                })
              } else {
                searchResults.forEach(company => {
                  handleCompanyDeselect(company.id)
                })
              }
            }}
            aria-label="Select all"
          />
        )
      },
      cell: ({ row }) => {
        const company = row.original
        const isSelected = selectedCompanies.some(c => c.id === company.id)
        
        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              if (value) {
                handleCompanySelect(company)
              } else {
                handleCompanyDeselect(company.id)
              }
            }}
            aria-label="Select row"
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium text-xs leading-[20px]">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "industry",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("industry")}</div>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "peppolEnabled",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            PEPPOL Enabled
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const enabled = row.getValue("peppolEnabled") as boolean
        return (
          <div className="text-xs leading-[20px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {enabled ? 'Yes' : 'No'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "vatNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            VAT Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const vatNumber = row.getValue("vatNumber") as string
        return (
          <div className="text-xs leading-[20px] font-mono">
            {vatNumber || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: "relationshipType",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const type = row.getValue("relationshipType") as string
        return (
          <div className="text-xs leading-[20px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              type === 'customer' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {type === 'customer' ? 'Customer' : type === 'supplier' ? 'Supplier' : type}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("email") || '-'}</div>,
    },
    {
      accessorKey: "paymentTerms",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Payment Terms
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("paymentTerms") || '-'}</div>,
    },

  ], [selectedCompanies, searchResults])

  // Column definitions for selected companies table
  const selectedCompaniesColumns: ColumnDef<Company>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium text-xs leading-[20px]">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "industry",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("industry")}</div>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[20px]">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "peppolEnabled",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            PEPPOL Enabled
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const enabled = row.getValue("peppolEnabled") as boolean
        return (
          <div className="text-xs leading-[20px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {enabled ? 'Yes' : 'No'}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Remove",
      cell: ({ row }) => {
        const company = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCompanyDeselect(company.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ], [selectedCompanies])

  return (
    <Dialog open={false} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Customers or Vendors</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search European companies by name, VAT number, or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
            {searchQuery && !isSearching && (
              <p className="text-sm text-gray-500">
                Found {searchResults.length} companies
              </p>
            )}
          </div>

          {/* Search Results Table */}
          {searchQuery.trim() && (
            <div className="space-y-4">
              <h4 className="text-md font-medium">Search Results</h4>
              <DataTable 
                key={selectedCompanies.map(c => c.id).join(',')}
                columns={columns} 
                data={searchResults} 
                pageSize={3} 
              />
            </div>
          )}

          {/* Selected Companies */}
          {selectedCompanies.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Selected Companies ({selectedCompanies.length})</h4>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={isConfirming}
                  className="flex items-center gap-2"
                >
                  {isConfirming ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isConfirming ? 'Saving...' : 'Confirm Selection'}
                </Button>
              </div>
              <DataTable 
                key={`selected-${selectedCompanies.length}`}
                columns={selectedCompaniesColumns} 
                data={selectedCompanies} 
                pageSize={3} 
              />
            </div>
          )}

          {/* Manual Form */}
          {showManualForm && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Add Company Manually</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowManualForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <form className="space-y-4">
                {/* First Row - Company Name and Tax ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter company name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Tax ID / EIN
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter tax ID or EIN"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Second Row - Street Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Enter street address"
                    className="w-full"
                  />
                </div>

                {/* Third Row - City, State, ZIP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter city"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter state"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter ZIP code"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowManualForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Company
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk Import Flow */}
          {showBulkImport && (
            <div className="space-y-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Bulk Import Companies</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetImportFlow}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Step Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Import Steps</span>
                  <span className="text-gray-600">Step {importStep} of 2</span>
                </div>
                <Progress value={(importStep / 2) * 100} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span className={importStep >= 1 ? "text-blue-600 font-medium" : ""}>1. Upload CSV</span>
                  <span className={importStep >= 2 ? "text-blue-600 font-medium" : ""}>2. Preview & Confirm</span>
                </div>
              </div>

              {/* Step 1: Upload Area */}
              {importStep === 1 && (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose a CSV file with company information to import multiple companies at once
                    </p>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                          <Upload className="w-4 h-4" />
                          Choose File
                        </div>
                      </label>
                      <p className="text-xs text-gray-400">
                        Supported format: CSV (max 10MB)
                      </p>
                    </div>
                  </div>

                  {/* Template Download */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900">Need a template?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Download our CSV template to ensure your data is formatted correctly.
                        </p>
                        <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 mt-2 h-auto">
                          Download CSV Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Preview Area */}
              {importStep === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">File uploaded successfully!</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        {uploadedFile?.name} - {previewData.length} companies found
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        All companies will be imported. Preview shows first 10 companies per page.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-md font-medium mb-3">Preview Companies to Import</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-blue-800 text-sm">
                          Showing preview of {previewData.length} companies. Use the pagination controls below to navigate through all companies.
                        </p>
                      </div>
                      <DataTable 
                        columns={columns.filter(col => col.id !== 'select')} // Remove select column for preview
                        data={previewData} 
                        pageSize={10} 
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetImportFlow}
                >
                  Cancel
                </Button>
                {importStep === 1 && (
                  <Button disabled>
                    Upload File First
                  </Button>
                )}
                {importStep === 2 && (
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setImportStep(1)}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleConfirmImport}
                      disabled={isImporting}
                    >
                      {isImporting ? 'Importing...' : `Import ${previewData.length} Companies`}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Add Companies Manually - Bottom Section */}
          {!showManualForm && !showBulkImport && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Alternative Options</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 flex-1"
                  onClick={() => setShowManualForm(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Companies Manually
                </Button>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 flex-1"
                  onClick={() => setShowBulkImport(true)}
                >
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
