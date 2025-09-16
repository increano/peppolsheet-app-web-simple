"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { useTenant } from '@/hooks/use-tenant'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Users, 
  Clock, 
  DollarSign,
  Upload,
  Plus,
  Download,
  FileSpreadsheet,
  Trash2,
  Building2,
  X
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PeppolDiscovery } from '@/components/peppol/peppol-discovery'
import { MultiStepInvoiceCreator } from '@/components/invoice/multi-step-invoice-creator'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

// Onboarding Popup Component
function OnboardingPopup() {
  const { createTenant, loading } = useTenant()
  const [formData, setFormData] = useState({
    companyName: '',
    businessRegistrationNumber: '',
    peppolId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName) {
      alert('Company name is required')
      return
    }

    try {
      await createTenant({
        name: formData.companyName,
        businessRegistrationNumber: formData.businessRegistrationNumber,
        peppolId: formData.peppolId
      })
      
      // Component will re-render when tenant is created
    } catch (error) {
      console.error('Failed to create tenant:', error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle>Welcome to PeppolSheet</CardTitle>
          </div>
          <CardDescription>
            Let&apos;s set up your organization to get started with invoice management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter your company name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Business Registration Number
              </label>
              <Input
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                PEPPOL ID
              </label>
              <Input
                value={formData.peppolId}
                onChange={(e) => setFormData(prev => ({ ...prev, peppolId: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { user, logout } = useAuth()
  const { tenant, loading: tenantLoading, hasTenant } = useTenant()


  // Form state cleaned up - old form removed

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/Peppolsheet_templates.xltx'
    link.download = 'Peppolsheet_Invoice_Template.xltx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Old form handlers removed - using multi-step component now

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        <DashboardSidebar />

          {/* Main Content */}
        <main className="ml-0 md:ml-64 p-4 md:p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">124.580€</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-gray-500">from last month</span>
          </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Outstanding Invoices
                </CardTitle>
                  <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">45.230€</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">-8.2%</span>
                    <span className="text-gray-500">from last month</span>
                  </div>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Partners
                </CardTitle>
                  <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+23</span>
                    <span className="text-gray-500">from last month</span>
                  </div>
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Avg. Payment Time
                </CardTitle>
                  <Clock className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18 days</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingDown className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">-2 days</span>
                    <span className="text-gray-500">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create E-Invoice Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">Create E-Invoice</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Save Draft
                  </Button>
                  <Button size="sm">
                    Send Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="template" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="template">Use File Upload</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="template" className="mt-4">
                    <div className="space-y-3">
                      {/* Step 1: Download Template */}
                      <div className="border rounded-lg p-3 bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">1</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              Download Excel Template
                            </h3>
                            <p className="text-xs text-gray-600 mb-2">
                              Pre-formatted template with all required fields
                            </p>
                          </div>
                          <Button 
                            onClick={handleDownloadTemplate}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Step 2: Fill Template */}
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-semibold text-sm">2</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              Fill Invoice Details
                            </h3>
                            <p className="text-xs text-gray-600">
                              Complete the template with customer info, items, and prices. Save as CSV.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Upload CSV */}
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-semibold text-sm">3</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              Upload CSV File
                            </h3>
                            <p className="text-xs text-gray-600">
                              Drop your completed CSV file for processing
                            </p>
                          </div>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-6" />
                          <p className="text-base text-gray-600 mb-3">
                            Drop CSV file here or click to browse
                          </p>
                          <p className="text-sm text-gray-500 mb-6">
                            Upload the CSV file created from our Excel template
                          </p>
                          <Button variant="outline">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Choose CSV File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <MultiStepInvoiceCreator
                      onComplete={(data) => {
                        console.log('Invoice completed:', data)
                        // Handle invoice completion - could save draft, redirect, etc.
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        
        {/* Conditional onboarding overlay */}
        {!tenantLoading && !hasTenant && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <OnboardingPopup />
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}