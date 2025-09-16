"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, FileText, CheckCircle, Eye, ArrowUpDown } from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/dashboard/data-table'

interface BulkImportInvoiceContentProps {
  onClose?: () => void
}

type ImportStep = 'upload' | 'review'

interface CSVRow {
  invoice_number: string
  invoice_date: string
  due_date: string
  customer_name: string
  customer_email: string
  currency: string
  total_amount: string
  status: string
  payment_terms: string
}

export function BulkImportInvoiceContent({ onClose }: BulkImportInvoiceContentProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [csvData, setCsvData] = useState<CSVRow[]>([])

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
    // Create a simple CSV template for invoices
    const csvContent = `invoice_number,invoice_date,due_date,customer_name,customer_email,currency,total_amount,status,payment_terms
INV-2025-001,2025-01-15,2025-02-15,Acme Corporation,john@acme.com,USD,1500.00,draft,net-30
INV-2025-002,2025-01-16,2025-02-16,TechStart Inc,sarah@techstart.com,USD,2500.00,sent,net-30`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const renderUploadStep = () => (
    <div className="w-full">
      {/* Template Download */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Download Template</h3>
            <p className="text-sm text-blue-700">Get the CSV template with the correct format for importing invoices.</p>
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
          <li>• Fill in your invoice data following the template structure</li>
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
        accessorKey: "invoice_number",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Invoice Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("invoice_number")}</div>,
      },
      {
        accessorKey: "customer_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Customer
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("customer_name")}</div>,
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const amount = row.getValue("total_amount") as string
          const currency = row.getValue("currency") as string
          return <div className="text-xs leading-[18px]">{currency} {amount}</div>
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              status === 'draft' 
                ? 'bg-gray-100 text-gray-800' 
                : status === 'sent'
                ? 'bg-blue-100 text-blue-800'
                : status === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: "due_date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-medium"
            >
              Due Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("due_date")}</div>,
      },
    ]

    return (
      <div className="w-full">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Review Imported Data</h3>
          <p className="text-gray-600">Review the {csvData.length} invoices that will be imported.</p>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Import Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total invoices:</span>
              <span className="ml-2 font-medium text-blue-900">{csvData.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Draft:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.status === 'draft').length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Sent:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.filter(row => row.status === 'sent').length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Total amount:</span>
              <span className="ml-2 font-medium text-blue-900">
                {csvData.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0).toFixed(2)}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import Invoices</h2>
        <p className="text-gray-600">Import multiple invoices from a CSV file.</p>
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
                onClick={() => {
                  // Handle final import
                  console.log('Importing invoices:', csvData)
                }}
              >
                Import Invoices
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
