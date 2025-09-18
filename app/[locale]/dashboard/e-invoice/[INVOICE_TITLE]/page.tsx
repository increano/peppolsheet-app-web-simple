"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Building2, 
  Calendar, 
  DollarSign, 
  Mail, 
  MapPin, 
  CheckCircle,
  FileText,
  Send,
  Download,
  Copy,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import { Document } from '@/components/e-invoice/document-card'

interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
  tax?: number
  amount: number
}

interface InvoiceData {
  id: string
  documentId: string
  customerName: string
  customerEmail?: string
  customerAddress?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
  issueDate: string
  dueDate?: string
  subtotal: number
  vatRate: number
  vatAmount: number
  discount?: number
  total: number
  currency: string
  status: string
  lineItems: InvoiceLineItem[]
  companyName?: string
  companyAddress?: string
  companyEmail?: string
  companyPhone?: string
  bankDetails?: {
    swift: string
    accountNumber: string
    bankName: string
    paymentReference: string
  }
  terms?: string
  paymentInstructions?: string
}

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText,
    iconColor: 'text-gray-500'
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Calendar,
    iconColor: 'text-yellow-500'
  },
  validated: {
    label: 'Validated',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500'
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800',
    icon: Send,
    iconColor: 'text-blue-500'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500'
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: X,
    iconColor: 'text-red-500'
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800',
    icon: DollarSign,
    iconColor: 'text-green-500'
  }
}

const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(amount)
}

export default function InvoiceDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)

  const documentId = params.INVOICE_TITLE as string
  const isCreditNote = documentId?.startsWith('CN-')
  const documentType = isCreditNote ? 'Credit Note' : 'Invoice'

  // Mock data - in a real app, this would fetch from your API
  const mockDocuments: Document[] = [
    // Invoices
    {
      id: 'INV-2024-001',
      documentId: 'INV-2024-001',
      customerName: 'Acme Corporation',
      customerEmail: 'billing@acme.com',
      customerAddress: '123 Business Street',
      customerCity: 'London',
      customerPostalCode: 'SW1A 1AA',
      customerCountry: 'UK',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      amount: 1500.00,
      currency: 'EUR',
      status: 'sent',
      businessName: 'Your Company Ltd',
      streetAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
      contactEmail: 'hello@company.com',
      contactPhone: '0712345678',
      swift: 'SWIFT123',
      bankAccountNumber: '12345678',
      bankName: 'Example Bank',
      items: [
        { id: '1', description: 'Consulting Services', quantity: 10, unit_price: 100, tax_rate: 20, tax: 200, amount: 1200 },
        { id: '2', description: 'Software License', quantity: 1, unit_price: 250, tax_rate: 20, tax: 50, amount: 300 }
      ]
    },
    {
      id: 'INV-2024-002',
      documentId: 'INV-2024-002',
      customerName: 'Tech Solutions Inc',
      customerEmail: 'finance@techsolutions.com',
      customerAddress: '456 Innovation Drive',
      customerCity: 'Manchester',
      customerPostalCode: 'M1 1AA',
      customerCountry: 'UK',
      issueDate: '2024-01-20',
      dueDate: '2024-02-20',
      amount: 2750.00,
      currency: 'EUR',
      status: 'delivered',
      businessName: 'Your Company Ltd',
      streetAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
      contactEmail: 'hello@company.com',
      contactPhone: '0712345678',
      swift: 'SWIFT123',
      bankAccountNumber: '12345678',
      bankName: 'Example Bank',
      items: [
        { id: '1', description: 'Development Services', quantity: 20, unit_price: 100, tax_rate: 20, tax: 400, amount: 2400 },
        { id: '2', description: 'Project Management', quantity: 5, unit_price: 50, tax_rate: 20, tax: 50, amount: 300 },
        { id: '3', description: 'Testing Services', quantity: 1, unit_price: 50, tax_rate: 20, tax: 10, amount: 60 }
      ]
    },
    {
      id: 'INV-2024-003',
      documentId: 'INV-2024-003',
      customerName: 'Global Enterprises',
      customerEmail: 'accounts@globalent.com',
      customerAddress: '789 Corporate Plaza',
      customerCity: 'Birmingham',
      customerPostalCode: 'B1 1AA',
      customerCountry: 'UK',
      issueDate: '2024-01-25',
      dueDate: '2024-02-25',
      amount: 4200.00,
      currency: 'EUR',
      status: 'paid',
      businessName: 'Your Company Ltd',
      streetAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
      contactEmail: 'hello@company.com',
      contactPhone: '0712345678',
      swift: 'SWIFT123',
      bankAccountNumber: '12345678',
      bankName: 'Example Bank',
      items: [
        { id: '1', description: 'Enterprise Software', quantity: 1, unit_price: 3000, tax_rate: 20, tax: 600, amount: 3600 },
        { id: '2', description: 'Implementation', quantity: 1, unit_price: 500, tax_rate: 20, tax: 100, amount: 600 }
      ]
    },
    // Credit Notes
    {
      id: 'CN-2024-001',
      documentId: 'CN-2024-001',
      customerName: 'Acme Corporation',
      customerEmail: 'billing@acme.com',
      customerAddress: '123 Business Street',
      customerCity: 'London',
      customerPostalCode: 'SW1A 1AA',
      customerCountry: 'UK',
      issueDate: '2024-01-20',
      dueDate: undefined,
      amount: -500.00,
      currency: 'EUR',
      status: 'sent',
      businessName: 'Your Company Ltd',
      streetAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
      contactEmail: 'hello@company.com',
      contactPhone: '0712345678',
      swift: 'SWIFT123',
      bankAccountNumber: '12345678',
      bankName: 'Example Bank',
      items: [
        { id: '1', description: 'Refund for cancelled consulting', quantity: 1, unit_price: -500, tax_rate: 20, tax: -100, amount: -600 }
      ]
    },
    {
      id: 'CN-2024-002',
      documentId: 'CN-2024-002',
      customerName: 'Tech Solutions Inc',
      customerEmail: 'finance@techsolutions.com',
      customerAddress: '456 Innovation Drive',
      customerCity: 'Manchester',
      customerPostalCode: 'M1 1AA',
      customerCountry: 'UK',
      issueDate: '2024-02-01',
      dueDate: undefined,
      amount: -250.00,
      currency: 'EUR',
      status: 'delivered',
      businessName: 'Your Company Ltd',
      streetAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
      contactEmail: 'hello@company.com',
      contactPhone: '0712345678',
      swift: 'SWIFT123',
      bankAccountNumber: '12345678',
      bankName: 'Example Bank',
      items: [
        { id: '1', description: 'Discount applied for early payment', quantity: 1, unit_price: -250, tax_rate: 20, tax: -50, amount: -300 }
      ]
    }
  ]

  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Find document by ID (extracted from the URL parameter)
      const foundDocument = mockDocuments.find(doc => doc.id === documentId)
      
      if (!foundDocument) {
        console.error('Document not found:', documentId)
        // Redirect to overview if document not found
        router.push('/dashboard/overview')
        return
      }

      setDocument(foundDocument)

      // Transform the document data to our InvoiceData interface
      const transformedData: InvoiceData = {
        id: foundDocument.id,
        documentId: foundDocument.documentId,
        customerName: foundDocument.customerName,
        customerEmail: foundDocument.customerEmail,
        customerAddress: foundDocument.customerAddress,
        customerCity: foundDocument.customerCity,
        customerPostalCode: foundDocument.customerPostalCode,
        customerCountry: foundDocument.customerCountry,
        issueDate: foundDocument.issueDate,
        dueDate: foundDocument.dueDate,
        subtotal: foundDocument.items && Array.isArray(foundDocument.items) ? 
          foundDocument.items.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unit_price || 0)), 0) : 
          foundDocument.amount * 0.8,
        vatRate: foundDocument.items && Array.isArray(foundDocument.items) && foundDocument.items.length > 0 ? 
          foundDocument.items[0].tax_rate || 0 : 20,
        vatAmount: foundDocument.items && Array.isArray(foundDocument.items) ? 
          foundDocument.items.reduce((sum: number, item: any) => sum + (item.tax || 0), 0) : 
          foundDocument.amount * 0.2,
        discount: 0,
        total: foundDocument.amount,
        currency: foundDocument.currency || 'EUR',
        status: foundDocument.status,
        lineItems: foundDocument.items && Array.isArray(foundDocument.items) ? foundDocument.items.map((item: any, index: number) => ({
          id: item.id || index.toString(),
          description: item.description || `Item ${index + 1}`,
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || 0,
          taxRate: item.tax_rate || 0,
          tax: item.tax || 0,
          amount: item.amount || 0
        })) : [],
        companyName: foundDocument.businessName,
        companyAddress: foundDocument.streetAddress,
        companyEmail: foundDocument.contactEmail,
        companyPhone: foundDocument.contactPhone,
        bankDetails: {
          swift: foundDocument.swift,
          accountNumber: foundDocument.bankAccountNumber,
          bankName: foundDocument.bankName,
          paymentReference: foundDocument.documentId
        },
        terms: 'Payment due within 30 days of invoice date. Late payments may incur additional charges.',
        paymentInstructions: 'Please include the invoice number as payment reference.'
      }

      setInvoiceData(transformedData)
    } catch (error) {
      console.error('Error fetching document data:', error)
      router.push('/dashboard/overview')
    } finally {
      setLoading(false)
    }
  }, [documentId, router])

  useEffect(() => {
    if (documentId) {
      fetchDocumentData()
    }
  }, [documentId, fetchDocumentData])

  const handleBack = () => {
    router.push('/dashboard/overview')
  }

  const handleEdit = () => {
    // Implement edit functionality
    console.log('Edit invoice:', document?.id)
  }

  const handleSend = () => {
    // Implement send functionality
    console.log('Send invoice:', document?.id)
  }

  const handleDuplicate = () => {
    // Implement duplicate functionality
    console.log('Duplicate invoice:', document?.id)
  }

  const handleDownloadUBL = () => {
    // Implement UBL download functionality
    console.log('Download UBL for invoice:', document?.id)
  }

  const handleViewUBL = () => {
    // Implement UBL view functionality
    console.log('View UBL for invoice:', document?.id)
  }

  const handleDelete = () => {
    // Implement delete functionality
    console.log('Delete invoice:', document?.id)
  }

  const getActionButtons = () => {
    if (!document) return []

    const buttons = []

    // Edit button - available for draft and failed statuses
    if (['draft', 'failed'].includes(document.status)) {
      buttons.push(
        <Button
          key="edit"
          variant="outline"
          onClick={handleEdit}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      )
    }

    // Send button - available for draft, validated, and failed statuses
    if (['draft', 'validated', 'failed'].includes(document.status)) {
      buttons.push(
        <Button
          key="send"
          variant="default"
          onClick={handleSend}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      )
    }

    // Duplicate button - always available
    buttons.push(
      <Button
        key="duplicate"
        variant="outline"
        onClick={handleDuplicate}
        className="flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        Duplicate
      </Button>
    )

    // View UBL button - available for validated, sent, delivered, paid
    if (['validated', 'sent', 'delivered', 'paid'].includes(document.status)) {
      buttons.push(
        <Button
          key="view-ubl"
          variant="outline"
          onClick={handleViewUBL}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View UBL
        </Button>
      )
    }

    // Download UBL button - available for validated, sent, delivered, paid
    if (['validated', 'sent', 'delivered', 'paid'].includes(document.status)) {
      buttons.push(
        <Button
          key="download-ubl"
          variant="outline"
          onClick={handleDownloadUBL}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download UBL
        </Button>
      )
    }

    return buttons
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {documentType.toLowerCase()} data...</p>
        </div>
      </div>
    )
  }

  // Show not found state
  if (!document || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{documentType} Not Found</h1>
          <p className="text-gray-600 mb-6">The requested {documentType.toLowerCase()} could not be found.</p>
          <Button onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(document.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Overview
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{documentType} {document.documentId}</h1>
              <p className="text-sm text-gray-600">{document.customerName}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge className={`${statusConfig.color} border-0 text-sm px-4 py-2`}>
            <StatusIcon className={`w-4 h-4 mr-2 ${statusConfig.iconColor}`} />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Company Info and Logo */}
          <div className="flex justify-between items-start mb-8">
            {/* Company Info */}
            <div>
              <h1 className="text-2xl font-bold text-black mb-2">{invoiceData.companyName}</h1>
              <div className="text-sm text-black space-y-1">
                {invoiceData.companyAddress?.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                )) || (
                  <>
                    <div>12 Example Avenue</div>
                    <div>Pontefract</div>
                    <div>WF8 4LS</div>
                  </>
                )}
                <div className="mt-2">{invoiceData.companyEmail}</div>
                <div>{invoiceData.companyPhone}</div>
              </div>
            </div>
            
            {/* Logo Placeholder */}
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">LOGO</span>
            </div>
          </div>

          {/* Invoice Details and Bill To */}
          <div className="flex justify-between mb-8">
            {/* Bill To */}
            <div>
              <h2 className="text-lg font-bold text-black mb-3">BILL TO:</h2>
              <div className="text-sm text-black space-y-1">
                <div className="font-medium">{invoiceData.customerName}</div>
                {invoiceData.customerAddress && (
                  <div>{invoiceData.customerAddress}</div>
                )}
                {invoiceData.customerCity && (
                  <div>{invoiceData.customerCity}</div>
                )}
                {invoiceData.customerPostalCode && (
                  <div>{invoiceData.customerPostalCode}</div>
                )}
                {invoiceData.customerCountry && (
                  <div>{invoiceData.customerCountry}</div>
                )}
              </div>
            </div>

            {/* Document Details */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">{documentType.toUpperCase()}</h2>
              <div className="text-sm text-black space-y-2">
                <div><span className="font-medium">{documentType} No:</span> {invoiceData.documentId}</div>
                <div><span className="font-medium">Issue Date:</span> {new Date(invoiceData.issueDate).toLocaleDateString('en-GB')}</div>
                {!isCreditNote && invoiceData.dueDate && (
                  <div><span className="font-medium">Due Date:</span> {new Date(invoiceData.dueDate).toLocaleDateString('en-GB')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <div className="bg-gray-200 p-3 rounded-t-lg">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-black">
                <div>Description</div>
                <div>Quantity</div>
                <div>Unit Price</div>
                <div>Tax Rate</div>
                <div className="flex items-center justify-between">
                  Amount
                </div>
              </div>
            </div>
            
            {/* Line items */}
            <div className="border-l border-r border-b border-gray-200">
              {invoiceData.lineItems.map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-5 gap-4 p-3 text-sm text-black border-b border-gray-100 last:border-b-0">
                  <div>{item.description}</div>
                  <div>{item.quantity}</div>
                  <div>{formatCurrency(item.unitPrice, invoiceData.currency)}</div>
                  <div>{item.taxRate ? `${item.taxRate}%` : '0%'}</div>
                  <div>{formatCurrency(item.amount, invoiceData.currency)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm text-black">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceData.subtotal, invoiceData.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({invoiceData.vatRate}%):</span>
                <span>{formatCurrency(invoiceData.vatAmount, invoiceData.currency)}</span>
              </div>
              {invoiceData.discount && invoiceData.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoiceData.discount, invoiceData.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
                <span>Total:</span>
                <span className="underline">{formatCurrency(invoiceData.total, invoiceData.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions and Terms */}
          <div className="grid grid-cols-2 gap-8">
            {/* Payment Instructions */}
            <div>
              <h3 className="text-lg font-bold text-black mb-3">PAY BY BANK TRANSFER</h3>
              <div className="text-sm text-black space-y-1">
                <div><span className="font-medium">Bank/SWIFT Code:</span> {invoiceData.bankDetails?.swift}</div>
                <div><span className="font-medium">Account Number:</span> {invoiceData.bankDetails?.accountNumber}</div>
                <div><span className="font-medium">Payment Reference:</span> {invoiceData.bankDetails?.paymentReference}</div>
                <div><span className="font-medium">Bank Name:</span> {invoiceData.bankDetails?.bankName}</div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <h3 className="text-lg font-bold text-black mb-3">TERMS</h3>
              <div className="text-sm text-black space-y-2">
                <div>{invoiceData.paymentInstructions}</div>
                <div>{invoiceData.terms}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {getActionButtons()}
          
          {/* Delete button - only for draft and failed statuses */}
          {['draft', 'failed'].includes(document.status) && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

