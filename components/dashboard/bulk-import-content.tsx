"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, FileText, CheckCircle, Eye, ArrowUpDown } from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/dashboard/data-table'
import { supabase } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'

interface BulkImportContentProps {
  onClose?: () => void
}

type ImportStep = 'upload' | 'review'

interface CSVRow {
  company_name: string
  tax_id: string
  email: string
  website: string
  company_street_address: string
  company_city: string
  company_postal_code: string
  company_country: string
  currency: string
  iban: string
  swift: string
  bank_account_number: string
  industry: string
}

export function BulkImportContent({ onClose }: BulkImportContentProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

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
    // Create a CSV template matching business_entities_staging table structure
    const csvContent = `company_name,tax_id,email,website,company_street_address,company_city,company_postal_code,company_country,currency,iban,swift,bank_account_number,industry
Example Company Ltd,BE1234567890,contact@example.com,https://example.com,123 Main Street,Brussels,1000,BE,EUR,BE68539007547034,GEBABEBB,1234567890,Technology
Another Company Inc,BE0987654321,info@another.com,https://another.com,456 Oak Avenue,Antwerp,2000,BE,EUR,BE68539007547035,GEBABEBB,0987654321,Manufacturing`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'business_entities_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleImportCompanies = async () => {
    if (csvData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please upload a CSV file with company data first.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    
    try {
      console.log('🚀 Starting bulk import of companies:', csvData.length)
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Authentication required')
      }

      // Call the bulk import API
      const response = await fetch('/api/business-entities/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companies: csvData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      console.log('✅ Import successful:', result)
      
      toast({
        title: "Import Successful",
        description: result.message || `Successfully imported ${result.results?.submitted || csvData.length} companies to staging for review.`,
      })

      // Close the modal or reset the form
      if (onClose) {
        onClose()
      } else {
        // Reset the form
        setCurrentStep('upload')
        setUploadedFile(null)
        setCsvData([])
        setUploadProgress(0)
      }

    } catch (error) {
      console.error('❌ Import error:', error)
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred during import.',
        variant: "destructive",
      })
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
            <p className="text-sm text-blue-700">Get the CSV template with the correct format for importing companies.</p>
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
          <li>• Download the template above to get the correct CSV format for business entities</li>
          <li>• Fill in your company data following the template structure</li>
          <li>• <strong>Required fields:</strong> company_name, tax_id</li>
          <li>• <strong>Optional fields:</strong> email, website, address, banking info, industry</li>
          <li>• Save the file as a CSV format</li>
          <li>• Upload the file using the upload area above</li>
          <li>• Review the preview and confirm the import (data will be added to staging for review)</li>
        </ul>
      </div>
    </div>
  )

  const renderReviewStep = () => {
    // Column definitions for the data table
    const columns: ColumnDef<CSVRow>[] = [
      {
        accessorKey: "company_name",
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
        cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("company_name")}</div>,
      },
      {
        accessorKey: "tax_id",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Tax ID
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px] font-mono">{row.getValue("tax_id") || <span className="text-gray-400">Not set</span>}</div>,
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
        accessorKey: "company_city",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              City
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("company_city") || <span className="text-gray-400">Not set</span>}</div>,
      },
      {
        accessorKey: "company_country",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Country
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("company_country") || <span className="text-gray-400">Not set</span>}</div>,
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
        cell: ({ row }) => {
          const industry = row.getValue("industry") as string
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800`}>
              {industry || 'Not set'}
            </span>
          )
        },
      },
    ]

    return (
      <div className="w-full">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Review Imported Data</h3>
          <p className="text-gray-600">Review the {csvData.length} companies that will be imported.</p>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Import Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total companies:</span>
              <span className="ml-2 font-medium text-blue-900">{csvData.length}</span>
            </div>
            <div>
              <span className="text-blue-700">With tax ID:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.tax_id).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With email:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.email).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With website:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.website).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With banking info:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.iban || row.swift || row.bank_account_number).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">With industry:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.industry).length}
              </span>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="mb-6">
          <DataTable columns={columns} data={csvData} pageSize={10} maxHeight="60vh" />
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import Companies</h2>
        <p className="text-gray-600">Import multiple companies from a CSV file.</p>
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
                onClick={async () => {
                  // Handle final import
                  console.log('Importing companies:', csvData)
                  await handleImportCompanies()
                }}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Companies'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
