"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { FileText, User, CreditCard, Check, Trash2 } from 'lucide-react'
import { PageSidebar, SidebarItem } from '@/components/ui/page-sidebar'
import { DataTable } from '@/components/dashboard/data-table'
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from '@/lib/auth-context'
import { useAuth } from '@/lib/auth-context'

interface AddNewInvoiceContentProps {
  onClose?: () => void
  onSaveSuccess?: () => void
}

type ManualStepType = 'invoice-details' | 'customer-info' | 'line-items' | 'payment-terms' | 'review-save'


export function AddNewInvoiceContent({ onClose, onSaveSuccess }: AddNewInvoiceContentProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ManualStepType>('invoice-details')
  const [formData, setFormData] = useState({
    // Document Details
    documentType: 'invoice',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    
    // Customer Info
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    customerAddress2: '',
    customerPostbox: '',
    customerCity: '',
    customerPostalCode: '',
    customerCountry: '',
    
    // Line Items
    lineItems: [
      { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 0, tax: 0, amount: 0 }
    ],
    
    // Payment Terms
    paymentTerms: 'net-30',
    notes: '',
    terms: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Manual form steps
  const steps: SidebarItem[] = [
    { id: 'invoice-details', name: 'Document Details', icon: FileText, description: '' },
    { id: 'customer-info', name: 'Customer Information', icon: User, description: '' },
    { id: 'line-items', name: 'Line Items', icon: FileText, description: '' },
    { id: 'payment-terms', name: 'Payment Terms', icon: CreditCard, description: '' },
    { id: 'review-save', name: 'Review & Save', icon: Check, description: '' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const newLineItems = [...formData.lineItems]
    newLineItems[index] = { ...newLineItems[index], [field]: value }
    
    // Calculate amounts when quantity, unitPrice, or taxRate changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const quantity = field === 'quantity' ? Number(value) : newLineItems[index].quantity
      const unitPrice = field === 'unitPrice' ? Number(value) : newLineItems[index].unitPrice
      const taxRate = field === 'taxRate' ? Number(value) : newLineItems[index].taxRate
      
      const subtotal = quantity * unitPrice
      const tax = subtotal * (taxRate / 100)
      const total = subtotal + tax
      
      newLineItems[index].tax = tax
      newLineItems[index].amount = total
    }
    
    setFormData(prev => ({
      ...prev,
      lineItems: newLineItems
    }))
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 0, tax: 0, amount: 0 }]
    }))
  }

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }))
    }
  }

  const saveInvoice = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    
    try {
      console.log('Saving invoice:', formData)
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Validate required fields
      if (!formData.invoiceNumber) {
        throw new Error('Invoice number is required')
      }

      if (!formData.invoiceDate) {
        throw new Error('Invoice date is required')
      }

      // Calculate totals from line items
      const lineItems = formData.lineItems || []
      const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      const totalTax = lineItems.reduce((sum, item) => sum + (item.tax || 0), 0)
      const total = subtotal + totalTax

      // Get the user's tenant_id from tenant_users table
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenantUser) {
        throw new Error('User is not associated with any active tenant. Please complete onboarding.')
      }

      // Prepare document data for insertion
      const documentData = {
        tenant_id: tenantUser.tenant_id,
        document_type: formData.documentType?.toUpperCase() || 'INVOICE',
        state: 'DRAFT',
        direction: 'OUTBOUND',
        
        // Invoice identification
        invoice_id: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        
        // Customer information
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_address: [
          formData.customerAddress,
          formData.customerCity,
          formData.customerPostalCode,
          formData.customerCountry
        ].filter(Boolean).join(', '),
        
        // Financial information
        currency: formData.currency || 'EUR',
        subtotal: subtotal,
        total_tax: totalTax,
        invoice_total: total,
        amount_due: total,
        payment_term: formData.paymentTerms,
        
        // Additional information
        note: [formData.notes, formData.terms].filter(Boolean).join('\n\n'),
        
        // Line items as JSONB
        items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          tax: item.tax,
          amount: item.amount
        }))
      }

      console.log('Creating document with data:', documentData)

      // Insert the document using the authenticated supabase client
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert(documentData)
        .select('*')
        .single()

      if (documentError) {
        console.error('Error creating document:', documentError)
        throw new Error(`Failed to create document: ${documentError.message}`)
      }

      // Line items are stored in the items JSONB field with all details

      console.log('Document saved successfully:', document.id)
      setSaveSuccess(true)
      
      // Trigger parent component refresh
      if (onSaveSuccess) {
        onSaveSuccess()
      }
      
      // Optionally close the form after a delay
      setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, 2000)

    } catch (error) {
      console.error('Error saving invoice:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const renderInvoiceDetailsStep = () => {
    return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-6">Document Type & Number</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Document Type</p>
              <p className="text-sm text-gray-600">Choose the type of document you're creating</p>
            </div>
            <div className="w-48">
              <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="credit-note">Credit Note</SelectItem>
                  <SelectItem value="debit-note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Document Number</p>
              <p className="text-sm text-gray-600">Unique identifier for this document</p>
            </div>
            <div className="w-48">
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder={formData.documentType === 'invoice' ? 'e.g., INV-2025-001' : formData.documentType === 'credit-note' ? 'e.g., CN-2025-001' : 'e.g., DN-2025-001'}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold mb-6">Dates</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Document Date</p>
              <p className="text-sm text-gray-600">The date when this document was issued</p>
            </div>
            <div className="w-48">
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Due Date</p>
              <p className="text-sm text-gray-600">The date when payment is due</p>
            </div>
            <div className="w-48">
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold mb-6">Currency</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Currency</p>
              <p className="text-sm text-gray-600">The currency for all amounts in this document</p>
            </div>
            <div className="w-48">
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  const renderCustomerInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-6">Name & Email</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Customer Name</p>
              <p className="text-sm text-gray-600">Full name of the customer or company</p>
            </div>
            <div className="w-48">
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Customer Email</p>
              <p className="text-sm text-gray-600">Email address for sending the document</p>
            </div>
            <div className="w-48">
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter customer email"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold mb-6">Billing Address</h2>
        
        <div className="space-y-6">
            <div>
              <p className="font-medium text-sm mb-2">Street Address</p>
              <p className="text-sm text-gray-600 mb-3">Complete billing street address for the customer</p>
              <div className="space-y-3">
                <Input
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                  placeholder="Enter street address line 1"
                />
                <Input
                  id="customerAddress2"
                  value={formData.customerAddress2 || ''}
                  onChange={(e) => handleInputChange('customerAddress2', e.target.value)}
                  placeholder="Enter street address line 2 (optional)"
                />
              </div>
            </div>

          <div>
            <p className="font-medium text-sm mb-2">Postbox</p>
            <p className="text-sm text-gray-600 mb-3">Postbox or PO Box number</p>
            <Input
              id="customerPostbox"
              value={formData.customerPostbox || ''}
              onChange={(e) => handleInputChange('customerPostbox', e.target.value)}
              placeholder="Enter postbox number"
            />
          </div>

          <div>
            <p className="font-medium text-sm mb-2">Postal Code</p>
            <p className="text-sm text-gray-600 mb-3">Postal or ZIP code for the address</p>
            <Input
              id="customerPostalCode"
              value={formData.customerPostalCode}
              onChange={(e) => handleInputChange('customerPostalCode', e.target.value)}
              placeholder="Enter postal code"
            />
          </div>

          <div>
            <p className="font-medium text-sm mb-2">City</p>
            <p className="text-sm text-gray-600 mb-3">City where the customer is located</p>
            <Input
              id="customerCity"
              value={formData.customerCity}
              onChange={(e) => handleInputChange('customerCity', e.target.value)}
              placeholder="Enter city"
            />
          </div>

          <div>
            <p className="font-medium text-sm mb-2">Country</p>
            <p className="text-sm text-gray-600 mb-3">Country where the customer is located</p>
            <Input
              id="customerCountry"
              value={formData.customerCountry}
              onChange={(e) => handleInputChange('customerCountry', e.target.value)}
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderLineItemsStep = () => {
    // Column definitions for the line items data table
    const columns: ColumnDef<any>[] = [
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row, table }) => {
          const index = row.index
          return (
            <Input
              value={formData.lineItems[index]?.description || ''}
              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
              placeholder="Enter item description"
              className="min-w-[200px]"
            />
          )
        },
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const index = row.index
          return (
            <Input
              type="number"
              min="1"
              value={formData.lineItems[index]?.quantity || 1}
              onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
              className="w-20"
            />
          )
        },
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => {
          const index = row.index
          return (
            <Input
              value={formData.lineItems[index]?.unit || 'pcs'}
              onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
              placeholder="pcs, hrs, kg, etc."
              className="w-20"
            />
          )
        },
      },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ row }) => {
          const index = row.index
          return (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.lineItems[index]?.unitPrice || 0}
              onChange={(e) => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
              className="w-24"
            />
          )
        },
      },
      {
        accessorKey: "taxRate",
        header: "Tax Rate (%)",
        cell: ({ row }) => {
          const index = row.index
          return (
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.lineItems[index]?.taxRate || 0}
              onChange={(e) => handleLineItemChange(index, 'taxRate', Number(e.target.value))}
              className="w-20"
            />
          )
        },
      },
      {
        accessorKey: "amount",
        header: "Total Amount",
        cell: ({ row }) => {
          const index = row.index
          const item = formData.lineItems[index]
          return (
            <div className="p-2 bg-gray-50 rounded border text-sm font-medium min-w-[100px]">
              {formData.currency} {item?.amount?.toFixed(2) || '0.00'}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const index = row.index
          return (
            <Button
              onClick={() => removeLineItem(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={formData.lineItems.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        },
      },
    ]

    return (
      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <DataTable 
              columns={columns} 
              data={formData.lineItems} 
              pageSize={10} 
              maxHeight="400px"
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={addLineItem} variant="outline" size="sm">
              Add Item
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-lg font-medium">
              Total: {formData.currency} {formData.lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPaymentTermsStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="net-30">Net 30</SelectItem>
            <SelectItem value="net-60">Net 60</SelectItem>
            <SelectItem value="net-90">Net 90</SelectItem>
            <SelectItem value="immediate">Immediate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes for the customer"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          value={formData.terms}
          onChange={(e) => handleInputChange('terms', e.target.value)}
          placeholder="Terms and conditions"
          rows={4}
        />
      </div>
    </div>
  )

  const renderReviewSaveStep = () => {
    const total = formData.lineItems.reduce((sum, item) => sum + item.amount, 0)
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Invoice Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Invoice Number:</span>
              <span className="ml-2 font-medium">{formData.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Currency:</span>
              <span className="ml-2 font-medium">{formData.currency}</span>
            </div>
            <div>
              <span className="text-gray-600">Invoice Date:</span>
              <span className="ml-2 font-medium">{formData.invoiceDate}</span>
            </div>
            <div>
              <span className="text-gray-600">Due Date:</span>
              <span className="ml-2 font-medium">{formData.dueDate}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Customer:</span>
              <span className="ml-2 font-medium">{formData.customerName}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{formData.customerEmail || 'Not provided'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Address:</span>
              <span className="ml-2 font-medium">{formData.customerAddress || 'Not provided'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Line Items Summary</h4>
          <div className="space-y-2">
            {formData.lineItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description || `Item ${index + 1}`}</span>
                <span>{formData.currency} {item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total:</span>
              <span>{formData.currency} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {saveError && (
          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-900 mb-2">Error Saving Document</h4>
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}
        
        {saveSuccess && (
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-900 mb-2">Document Saved Successfully!</h4>
            <p className="text-sm text-green-700">
              Your document has been created and saved to the database. Redirecting...
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Ready to Save</h4>
          <p className="text-sm text-blue-700">
            Review the information above. Click "Save Invoice" to create this invoice in your system.
          </p>
        </div>
      </div>
    )
  }

  const renderManualStep = () => {
    switch (currentStep) {
      case 'invoice-details':
        return renderInvoiceDetailsStep()
      case 'customer-info':
        return renderCustomerInfoStep()
      case 'line-items':
        return renderLineItemsStep()
      case 'payment-terms':
        return renderPaymentTermsStep()
      case 'review-save':
        return renderReviewSaveStep()
      default:
        return renderInvoiceDetailsStep()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Create New Document</h1>
        <p className="text-sm text-gray-600 mt-1">Create a new invoice, credit note or debit note</p>
      </div>

      <PageSidebar
        title="Create Document"
        items={steps}
        activeItem={currentStep}
        onItemClick={(itemId) => setCurrentStep(itemId as ManualStepType)}
      >
        <div className="space-y-4 p-4">
          <div>
            <h2 className="text-sm font-semibold mb-6">
              {steps[currentStepIndex]?.name}
            </h2>
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
                  // Save invoice
                  saveInvoice()
                }
              }}
              disabled={isSaving}
            >
              {currentStepIndex === steps.length - 1 
                ? (isSaving ? 'Saving...' : 'Save Invoice') 
                : 'Next'
              }
            </Button>
          </div>
        </div>
      </PageSidebar>
    </div>
  )
}
