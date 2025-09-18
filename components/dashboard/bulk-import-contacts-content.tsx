"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, FileText, CheckCircle, Eye, ArrowUpDown } from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/dashboard/data-table'
import { supabase } from '@/lib/auth-context'

interface BulkImportContactsContentProps {
  onClose?: () => void
}

type ImportStep = 'upload' | 'review'

interface CSVRow {
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  address: string
  city: string
  postal_code: string
  country: string
  remittance_street_address: string
  remittance_city: string
  remittance_postal_code: string
  remittance_country: string
  service_street_address: string
  service_city: string
  service_postal_code: string
  service_country: string
}

export function BulkImportContactsContent({ onClose }: BulkImportContactsContentProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const steps = [
    { id: 'upload' as ImportStep, name: 'Upload CSV', icon: Upload, description: 'Upload and process your CSV file' },
    { id: 'review' as ImportStep, name: 'Review Data', icon: Eye, description: 'Review and confirm imported data' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // Simulate upload progress
      setIsUploading(true)
      setUploadProgress(0)
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            // Parse CSV data when upload is complete
            parseCSVFile(file)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      const data: CSVRow[] = []
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',')
          const row: any = {}
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || ''
          })
          data.push(row as CSVRow)
        }
      }
      
      setCsvData(data)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    // Create a simple CSV template for contacts
    const csvContent = `first_name,last_name,email,phone,job_title,department,address,city,postal_code,country,remittance_street_address,remittance_city,remittance_postal_code,remittance_country,service_street_address,service_city,service_postal_code,service_country
John,Smith,john.smith@acme.com,+1234567890,Manager,Sales,123 Main St,Example City,12345,US,456 Remittance St,Remittance City,54321,US,789 Service St,Service City,67890,US
Sarah,Johnson,sarah.johnson@techstart.com,+0987654321,Director,Finance,456 Oak Ave,Another City,54321,US,789 Remittance Ave,Remittance City,67890,US,123 Service Ave,Service City,12345,US
Michael,Brown,m.brown@globalsolutions.com,+1555123456,CEO,Executive,789 Business Blvd,Metro City,67890,US,123 Remittance Blvd,Remittance City,12345,US,456 Service Blvd,Service City,54321,US`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const importContacts = async () => {
    if (csvData.length === 0) {
      alert('No contacts to import.')
      return
    }

    setIsImporting(true)
    try {
      console.log('🚀 Starting contact import process...')
      console.log('📊 CSV data to import:', csvData.length, 'contacts')
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('❌ Error getting current user:', userError)
        alert('Authentication error. Please try again.')
        return
      }

      console.log('✅ User authenticated:', currentUser.email)

      // Get tenant_id for the user
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', currentUser.id)
        .single()

      if (tenantError || !tenantUser) {
        console.error('❌ Error getting tenant:', tenantError)
        alert('Error getting user information. Please try again.')
        return
      }

      console.log('✅ Tenant ID:', tenantUser.tenant_id)

      // Test database access
      console.log('🔍 Testing database access...')
      const { data: testContacts, error: testError } = await supabase
        .from('contacts')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Database access test failed:', testError)
        alert(`Database access error: ${testError.message}`)
        setIsImporting(false)
        return
      }
      console.log('✅ Database access confirmed')

      // Validate CSV data
      const validationErrors: string[] = []
      csvData.forEach((row, index) => {
        if (!row.first_name || !row.last_name) {
          validationErrors.push(`Row ${index + 1}: Missing first_name or last_name`)
        }
        if (!row.email) {
          validationErrors.push(`Row ${index + 1}: Missing email`)
        }
      })

      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors)
        alert(`Please fix the following errors in your CSV:\n${validationErrors.join('\n')}`)
        setIsImporting(false)
        return
      }

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Create a default business entity for contacts without company information
      let defaultBusinessEntityId: string | null = null
      
      // Try to find existing default business entity
      const { data: existingDefaultEntity, error: findDefaultError } = await supabase
        .from('business_entities')
        .select('id')
        .eq('tenant_id', tenantUser.tenant_id)
        .ilike('names->0->>name', 'Default Company')
        .single()

      if (existingDefaultEntity) {
        defaultBusinessEntityId = existingDefaultEntity.id
        console.log(`✅ Found existing default business entity: ${defaultBusinessEntityId}`)
      } else {
        // Create default business entity
        const { data: newDefaultEntity, error: createDefaultError } = await supabase
          .from('business_entities')
          .insert([{
            names: [{ name: 'Default Company', language: 'en' }],
            tax_id: 'DEFAULT-001',
            industry: 'General',
            company_street_address: 'Default Address',
            company_city: 'Default City',
            company_state: 'Default State',
            company_postal_code: '00000',
            company_country: 'US',
            currency: 'USD',
            tenant_id: tenantUser.tenant_id
          }])
          .select('id')
          .single()

        if (createDefaultError) {
          console.error('❌ Error creating default business entity:', createDefaultError)
          alert(`Error creating default business entity: ${createDefaultError.message}`)
          setIsImporting(false)
          return
        }

        defaultBusinessEntityId = newDefaultEntity.id
        console.log(`✅ Created default business entity: ${defaultBusinessEntityId}`)
      }

      // Process each contact
      for (let i = 0; i < csvData.length; i++) {
        const contactRow = csvData[i]
        console.log(`📝 Processing contact ${i + 1}/${csvData.length}: ${contactRow.first_name} ${contactRow.last_name}`)
        
        try {
          // Use the default business entity for all contacts
          const businessEntityId = defaultBusinessEntityId

          // Create the contact
          console.log(`📝 Creating contact: ${contactRow.first_name} ${contactRow.last_name}`)
          const { error: contactError } = await supabase
            .from('contacts')
            .insert([{
              tenant_id: tenantUser.tenant_id,
              business_entity_id: businessEntityId,
              first_name: contactRow.first_name,
              last_name: contactRow.last_name,
              email: contactRow.email || null,
              phone: contactRow.phone || null,
              job_title: contactRow.job_title || null,
              department: contactRow.department || null,
              shipping_street_address: contactRow.address || null,
              shipping_city: contactRow.city || null,
              shipping_postal_code: contactRow.postal_code || null,
              shipping_country: contactRow.country || null,
              remittance_street_address: contactRow.remittance_street_address || null,
              remittance_city: contactRow.remittance_city || null,
              remittance_postal_code: contactRow.remittance_postal_code || null,
              remittance_country: contactRow.remittance_country || null,
              service_street_address: contactRow.service_street_address || null,
              service_city: contactRow.service_city || null,
              service_postal_code: contactRow.service_postal_code || null,
              service_country: contactRow.service_country || null,
              iban: null,
              swift: null,
              bank_account_number: null,
              is_primary: false,
              status: 'active',
              notes: null
            }])

          if (contactError) {
            console.error('❌ Error creating contact:', contactError)
            errors.push(`Failed to create contact ${contactRow.first_name} ${contactRow.last_name}: ${contactError.message}`)
            errorCount++
          } else {
            console.log(`✅ Successfully created contact: ${contactRow.first_name} ${contactRow.last_name}`)
            successCount++
          }

        } catch (error) {
          console.error('Error processing contact:', error)
          errors.push(`Error processing ${contactRow.first_name} ${contactRow.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          errorCount++
        }
      }

      // Show results
      console.log(`🎉 Import completed! Success: ${successCount}, Errors: ${errorCount}`)
      
      if (successCount > 0) {
        alert(`Successfully imported ${successCount} contacts!${errorCount > 0 ? ` ${errorCount} contacts failed to import.` : ''}`)
      } else {
        alert(`Failed to import any contacts. ${errorCount} errors occurred.`)
      }

      if (errors.length > 0) {
        console.error('❌ Import errors:', errors)
      }

      // Close the import dialog
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error('Error importing contacts:', error)
      alert('An unexpected error occurred during import. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const renderUploadStep = () => (
    <div className="w-full">
      {/* Template Download */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Download Template</h3>
            <p className="text-sm text-blue-700">Get the CSV template with the correct format for importing contacts.</p>
          </div>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            Download Template
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!uploadedFile ? (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-4">Drag and drop your CSV file here, or click to browse</p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">File Uploaded</h3>
              <p className="text-gray-600 mb-2">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500 mb-4">File size: {(uploadedFile.size / 1024).toFixed(1)} KB</p>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Processing file... {uploadProgress}%</p>
                </div>
              )}
              
              {!isUploading && uploadProgress === 100 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">File processed successfully!</span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => setUploadedFile(null)} variant="outline">
                  Remove File
                </Button>
                {!isUploading && uploadProgress === 100 && (
                  <Button onClick={() => setCurrentStep('review')}>
                    Review Data
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Download the template above to get the correct CSV format</li>
          <li>• Fill in your contact data following the template structure</li>
          <li>• Save the file as a CSV format</li>
          <li>• Upload the file using the upload area above</li>
          <li>• Review the preview and confirm the import</li>
        </ul>
      </div>
    </div>
  )

  const renderReviewStep = () => {
    // Column definitions for the data table
    const columns: ColumnDef<CSVRow>[] = [
      {
        accessorKey: "first_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              First Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("first_name")}</div>,
      },
      {
        accessorKey: "last_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Last Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("last_name")}</div>,
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
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("email") || <span className="text-gray-400">Not set</span>}</div>,
      },
      {
        accessorKey: "position",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Position
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("position") || <span className="text-gray-400">Not set</span>}</div>,
      },
      {
        accessorKey: "company_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Company
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("company_name") || <span className="text-gray-400">Not set</span>}</div>,
      },
      {
        accessorKey: "relationship_type",
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
          const type = row.getValue("relationship_type") as string
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              type === 'customer' 
                ? 'bg-blue-100 text-blue-800' 
                : type === 'supplier'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {type}
            </span>
          )
        },
      },
    ]

    return (
      <div className="w-full">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Review Imported Data</h3>
          <p className="text-gray-600">Review the {csvData.length} contacts that will be imported.</p>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Import Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total contacts:</span>
              <span className="ml-2 font-medium text-blue-900">{csvData.length}</span>
            </div>
            <div>
              <span className="text-blue-700">With email:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.email).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With phone:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.phone).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With job title:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.job_title).length}
              </span>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="mb-6">
          <DataTable columns={columns} data={csvData} pageSize={15} maxHeight="60vh" />
        </div>
    </div>
  )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep()
      case 'review':
        return renderReviewStep()
      default:
        return renderUploadStep()
    }
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import Contacts</h2>
        <p className="text-gray-600">Import multiple contacts from a CSV file.</p>
      </div>

      <div className="flex gap-8">
        {/* Left Sidebar - Steps */}
        <div className="w-64 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Steps</h3>
          <div className="space-y-2">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isActive = currentStep === step.id
              const isCompleted = index < currentStepIndex
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
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

        {/* Right Content */}
        <div className="flex-1">
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStepIndex > 0) {
                  setCurrentStep(steps[currentStepIndex - 1].id)
                }
              }}
              disabled={currentStepIndex === 0}
            >
              Previous
            </Button>
            {currentStep === 'review' && (
              <Button
                onClick={importContacts}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Contacts'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
