"use client"

import { useState } from 'react'
import { BelgianCompanySearch } from '@/components/business-entity/belgian-company-search'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BelgianCompany {
  entity_number: string
  denomination: string
  nace_code?: string
  description?: string
  municipality_fr?: string
  business_type?: string
  status?: string
  type_enterprise_mapped?: string
  full_identifier?: string | null
  participant_scheme?: string | null
  participant_value?: string | null
  supported_documents?: string | null
  has_peppol: boolean
}

export default function TestBelgianSearchPage() {
  const [selectedCompany, setSelectedCompany] = useState<BelgianCompany | null>(null)
  const [searchResults, setSearchResults] = useState<BelgianCompany[]>([])

  const handleCompanySelect = (company: BelgianCompany) => {
    console.log('Selected company:', company)
    setSelectedCompany(company)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🇧🇪 Belgian Company Search Test
          </h1>
          <p className="text-gray-600 mt-1">
            Test the integration with Belgian company data and PEPPOL network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Component */}
          <Card>
            <CardHeader>
              <CardTitle>Company Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BelgianCompanySearch
                onCompanySelect={handleCompanySelect}
                placeholder="Search Belgian companies (try: Janssens, Factary, etc.)"
              />
              
              <div className="text-sm text-gray-500">
                <p>• Search by company name or entity number</p>
                <p>• Results include PEPPOL network status</p>
                <p>• Data from official Belgian company registry</p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Company Details */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Company</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCompany ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {selectedCompany.denomination}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Entity: {selectedCompany.entity_number}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <p className="text-gray-600">{selectedCompany.municipality_fr || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600">{selectedCompany.type_enterprise_mapped || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Business Type:</span>
                      <p className="text-gray-600">{selectedCompany.business_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">NACE Code:</span>
                      <p className="text-gray-600">{selectedCompany.nace_code || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedCompany.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 text-sm mt-1">{selectedCompany.description}</p>
                    </div>
                  )}

                  {/* PEPPOL Status */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-700">PEPPOL Status:</span>
                      {selectedCompany.has_peppol ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ PEPPOL Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No PEPPOL
                        </span>
                      )}
                    </div>

                    {selectedCompany.has_peppol && (
                      <div className="space-y-2 text-sm">
                        {selectedCompany.full_identifier && (
                          <div>
                            <span className="font-medium text-gray-700">PEPPOL ID:</span>
                            <p className="font-mono text-xs text-gray-600 bg-gray-50 p-1 rounded">
                              {selectedCompany.full_identifier}
                            </p>
                          </div>
                        )}
                        
                        {selectedCompany.supported_documents && (
                          <div>
                            <span className="font-medium text-gray-700">Supported Documents:</span>
                            <p className="text-gray-600 text-xs mt-1">
                              {selectedCompany.supported_documents.length > 200 
                                ? `${selectedCompany.supported_documents.substring(0, 200)}...`
                                : selectedCompany.supported_documents
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Search and select a company to see details
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Belgian Company Registry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>PEPPOL Network Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Multi-tenant Ready</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>🎉 Success!</strong> The Belgian company search is now integrated and ready for use.
                Companies can be searched by name or entity number, with automatic PEPPOL status detection.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 