"use client"

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { Search, Building2, CheckCircle, XCircle, Loader2, MapPin, Hash, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BelgianCompany {
  entity_number: string
  denomination: string
  nace_code?: string
  description?: string
  municipality_fr?: string
  business_type?: string
  status?: string
  type_enterprise_mapped?: string
  // PEPPOL fields
  full_identifier?: string | null
  participant_scheme?: string | null
  participant_value?: string | null
  supported_documents?: string | null
  has_peppol: boolean
}

interface BelgianCompanySearchProps {
  onCompanySelect: (company: BelgianCompany) => void
  placeholder?: string
  className?: string
}

export function BelgianCompanySearch({ 
  onCompanySelect, 
  placeholder = "Search Belgian companies by name or entity number...",
  className = "" 
}: BelgianCompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [results, setResults] = useState<BelgianCompany[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search function - direct API call
  const searchCompanies = async (term: string) => {
    if (term.length < 2) {
      setResults([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Direct API call to business directory
      const apiUrl = process.env.NEXT_PUBLIC_BUSINESS_DIRECTORY_API_URL || 'http://localhost:8000/api/v2'
      const accessToken = process.env.NEXT_PUBLIC_BUSINESS_DIRECTORY_ACCESS_TOKEN
      
      const params = new URLSearchParams({
        q: term,
        country: 'BE',
        limit: '10',
        include_peppol: 'true'
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${apiUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      const companies = data.data?.companies || data.companies || []
      
      // Transform to expected format
      const transformedCompanies = companies.map((company: any) => ({
        entity_number: company.vat_number || company.registration_number || company.unified_id || company.id,
        denomination: company.company_name || company.name,
        nace_code: company.activity_code || company.business_info?.industry_code,
        description: company.activity_description || company.business_info?.industry_description,
        municipality_fr: company.city || company.address?.city,
        business_type: company.legal_form || company.type,
        status: 'Actief',
        type_enterprise_mapped: company.legal_form || company.type,
        full_identifier: company.peppol_id || company.peppol_info?.participant_id,
        participant_scheme: company.peppol_id ? 'BE:CBE' : null,
        participant_value: company.vat_number || company.registration_number,
        supported_documents: company.peppol_documents || company.peppol_info?.supported_document_types?.join(', '),
        has_peppol: Boolean(company.peppol_enabled || company.peppol_info?.is_registered)
      }))
      
      setResults(transformedCompanies)
    } catch (err) {
      console.error('Belgian company search failed:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    searchCompanies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  const handleCompanySelect = (company: BelgianCompany) => {
    setSearchTerm(company.denomination)
    setIsOpen(false)
    onCompanySelect(company)
  }

  const formatSupportedDocuments = (documents: string | null) => {
    if (!documents) return null
    const docList = documents.split(', ')
    if (docList.length <= 3) return documents
    return `${docList.slice(0, 3).join(', ')} +${docList.length - 3} more`
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Error State */}
          {error && (
            <div className="p-4 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => searchCompanies(debouncedSearchTerm)}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* No Results */}
          {!error && !isLoading && searchTerm.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No Belgian companies found matching "{searchTerm}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching by company name or entity number
              </p>
            </div>
          )}

          {/* Results */}
          {results.map((company) => (
            <div
              key={company.entity_number}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handleCompanySelect(company)}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {company.denomination}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">{company.entity_number}</span>
                        </div>
                        {company.municipality_fr && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{company.municipality_fr}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Business Details */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {company.description && (
                      <p className="line-clamp-2">{company.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {company.type_enterprise_mapped && (
                        <span>{company.type_enterprise_mapped}</span>
                      )}
                      {company.business_type && (
                        <span>• {company.business_type}</span>
                      )}
                      {company.nace_code && (
                        <Badge variant="outline" className="text-xs">
                          NACE {company.nace_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* PEPPOL Status */}
                  {company.has_peppol ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      PEPPOL
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-gray-500">
                      <XCircle className="w-3 h-3 mr-1" />
                      No PEPPOL
                    </Badge>
                  )}
                  
                  {/* Active Status */}
                  {company.status === 'Actief' && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* PEPPOL Details */}
              {company.has_peppol && company.supported_documents && (
                <div className="mt-3 p-2 bg-green-50 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-800">
                      PEPPOL Documents:
                    </span>
                  </div>
                  <p className="text-xs text-green-700">
                    {formatSupportedDocuments(company.supported_documents)}
                  </p>
                  {company.full_identifier && (
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      ID: {company.full_identifier}
                    </p>
                  )}
                </div>
              )}

              {/* No PEPPOL Message */}
              {!company.has_peppol && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  This company is not registered in the PEPPOL network
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 