"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
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
  Trash2
} from 'lucide-react'
import { Document } from './document-card'
import { supabase } from '@/lib/auth-context'
import { useState, useEffect, useCallback } from 'react'

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

interface DocumentViewDialogProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (document: Document) => void
  onSend?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownloadUBL?: (document: Document) => void
  onViewUBL?: (document: Document) => void
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-EU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-EU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function DocumentViewDialog({
  document,
  isOpen,
  onClose,
  onEdit,
  onSend,
  onDuplicate,
  onDelete,
  onDownloadUBL,
  onViewUBL
}: DocumentViewDialogProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  const fetchInvoiceData = useCallback(async () => {
    if (!document) {
      console.log('Missing document:', { document: !!document })
      return
    }

    try {
      setLoadingInvoice(true)
      console.log('Fetching invoice data for document:', document.id)
      
      // For now, we'll use the document data directly without additional database queries
      // This prevents the useContext error and still provides a good user experience
      console.log('Using document data directly for invoice preview')
      console.log('Document customer address:', document.customerAddress)
      console.log('Document items:', document.items)
      console.log('Document invoice total:', document.invoiceTotal)
      console.log('Document currency:', document.currency)

      // Transform the document data to our InvoiceData interface
      const transformedData: InvoiceData = {
        id: document.id,
        documentId: document.documentId,
        customerName: document.customerName,
        customerEmail: document.customerEmail,
        customerAddress: document.customerAddress,
        customerCity: document.customerCity,
        customerPostalCode: document.customerPostalCode,
        customerCountry: document.customerCountry,
        issueDate: document.issueDate,
        dueDate: document.dueDate,
        subtotal: document.items && Array.isArray(document.items) ? 
          document.items.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unit_price || 0)), 0) : 
          document.amount * 0.8,
        vatRate: document.items && Array.isArray(document.items) && document.items.length > 0 ? 
          document.items[0].tax_rate || 0 : 20,
        vatAmount: document.items && Array.isArray(document.items) ? 
          document.items.reduce((sum: number, item: any) => sum + (item.tax || 0), 0) : 
          document.amount * 0.2,
        discount: 0,
        total: document.amount,
        currency: document.currency || 'EUR',
        status: document.status,
        lineItems: document.items && Array.isArray(document.items) ? document.items.map((item: any, index: number) => ({
          id: item.id || index.toString(),
          description: item.description || `Item ${index + 1}`,
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || 0,
          taxRate: item.tax_rate || 0,
          tax: item.tax || 0,
          amount: item.amount || 0
        })) : [
          { id: '1', description: 'Item 1', quantity: 1, unitPrice: 10, amount: 10 },
          { id: '2', description: 'Item 2', quantity: 2, unitPrice: 10, amount: 20 },
          { id: '3', description: 'Item 3', quantity: 2, unitPrice: 10, amount: 20 }
        ],
        companyName: document.businessName,
        companyAddress: document.streetAddress,
        companyEmail: document.contactEmail,
        companyPhone: document.contactPhone,
        bankDetails: {
          swift: document.swift,
          accountNumber: document.bankAccountNumber,
          bankName: document.bankName,
          paymentReference: 'Customer 001'
        },
        terms: '<Add terms here, e.g: warranty, returns policy...>',
        paymentInstructions: '<Add payment instructions here>'
      }

      setInvoiceData(transformedData)
    } catch (error) {
      console.error('Error fetching invoice data:', error)
      // Set fallback data to prevent component crash
      setInvoiceData(null)
    } finally {
      setLoadingInvoice(false)
    }
  }, [document])

  // Fetch detailed invoice data when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      fetchInvoiceData()
    }
  }, [isOpen, document, fetchInvoiceData])

  // Early return after all hooks are declared
  if (!document) return null

  const statusConfig = getStatusConfig(document.status)
  const StatusIcon = statusConfig.icon

  const getActionButtons = () => {
    const buttons = []

    // Edit button - available for draft and failed statuses
    if (['draft', 'failed'].includes(document.status)) {
      buttons.push(
        <Button
          key="edit"
          variant="outline"
          onClick={() => onEdit?.(document)}
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
          onClick={() => onSend?.(document)}
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
        onClick={() => onDuplicate?.(document)}
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
          onClick={() => onViewUBL?.(document)}
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
          onClick={() => onDownloadUBL?.(document)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download UBL
        </Button>
      )
    }

    return buttons
  }

  // Show loading state while fetching invoice data
  if (loadingInvoice) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-white p-8 min-h-[800px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading invoice data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Use real invoice data if available, otherwise fall back to document data
  const data = invoiceData || {
    id: document.id,
    documentId: document.documentId,
    customerName: document.customerName,
    customerEmail: document.customerEmail,
    customerAddress: document.customerAddress,
    issueDate: document.issueDate,
    dueDate: document.dueDate,
    subtotal: document.amount * 0.8, // Assuming 20% VAT
    vatRate: 20,
    vatAmount: document.amount * 0.2,
    discount: 0,
    total: document.amount,
    currency: document.currency,
    status: document.status,
    lineItems: [
      { id: '1', description: 'Item 1', quantity: 1, unitPrice: 10, taxRate: 20, tax: 2, amount: 12 },
      { id: '2', description: 'Item 2', quantity: 2, unitPrice: 10, taxRate: 20, tax: 4, amount: 24 },
      { id: '3', description: 'Item 3', quantity: 2, unitPrice: 10, taxRate: 20, tax: 4, amount: 24 }
    ],
    companyName: 'YOUR COMPANY',
    companyAddress: '12 Example Avenue\nPontefract\nWF8 4LS',
    companyEmail: 'hello@mac.com',
    companyPhone: '0712345678',
    bankDetails: {
      swift: '123456',
      accountNumber: '12345678',
      bankName: 'Bank Name',
      paymentReference: 'Customer 001'
    },
    terms: '<Add terms here, e.g: warranty, returns policy...>',
    paymentInstructions: '<Add payment instructions here>'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Invoice Document */}
        <div className="bg-white p-8 min-h-[800px]">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            {/* Company Info */}
            <div>
              <h1 className="text-2xl font-bold text-black mb-2">{data.companyName}</h1>
              <div className="text-sm text-black space-y-1">
                {data.companyAddress?.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                )) || (
                  <>
                    <div>12 Example Avenue</div>
                    <div>Pontefract</div>
                    <div>WF8 4LS</div>
                  </>
                )}
                <div className="mt-2">{data.companyEmail}</div>
                <div>{data.companyPhone}</div>
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
                <div className="font-medium">{data.customerName}</div>
                {data.customerAddress && (
                  <div>{data.customerAddress}</div>
                )}
                {data.customerCity && (
                  <div>{data.customerCity}</div>
                )}
                {data.customerPostalCode && (
                  <div>{data.customerPostalCode}</div>
                )}
                {data.customerCountry && (
                  <div>{data.customerCountry}</div>
                )}
                {!data.customerAddress && !data.customerCity && !data.customerPostalCode && (
                  <>
                    <div>123 Business Street</div>
                    <div>London</div>
                    <div>SW1A 1AA</div>
                  </>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">INVOICE</h2>
              <div className="text-sm text-black space-y-2">
                <div><span className="font-medium">Invoice No:</span> {data.documentId}</div>
                <div><span className="font-medium">Issue Date:</span> {new Date(data.issueDate).toLocaleDateString('en-GB')}</div>
                <div><span className="font-medium">Due Date:</span> {data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-GB') : '15.01.2024'}</div>
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
                  <span className="text-xs">▼</span>
                </div>
              </div>
            </div>
            
            {/* Real line items */}
            <div className="border-l border-r border-b border-gray-200">
              {data.lineItems.map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-5 gap-4 p-3 text-sm text-black border-b border-gray-100 last:border-b-0">
                  <div>{item.description}</div>
                  <div>{item.quantity}</div>
                  <div>{formatCurrency(item.unitPrice, data.currency)}</div>
                  <div>{item.taxRate ? `${item.taxRate}%` : '0%'}</div>
                  <div>{formatCurrency(item.amount, data.currency)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm text-black">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(data.subtotal, data.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({data.vatRate}%):</span>
                <span>{formatCurrency(data.vatAmount, data.currency)}</span>
              </div>
              {data.discount && data.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(data.discount, data.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
                <span>Total:</span>
                <span className="underline">{formatCurrency(data.total, data.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions and Terms */}
          <div className="grid grid-cols-2 gap-8">
            {/* Payment Instructions */}
            <div>
              <h3 className="text-lg font-bold text-black mb-3">PAY BY BANK TRANSFER</h3>
              <div className="text-sm text-black space-y-1">
                <div><span className="font-medium">Bank/SWIFT Code:</span> {data.bankDetails?.swift}</div>
                <div><span className="font-medium">Account Number:</span> {data.bankDetails?.accountNumber}</div>
                <div><span className="font-medium">Payment Reference:</span> {data.bankDetails?.paymentReference}</div>
                <div><span className="font-medium">Bank Name:</span> {data.bankDetails?.bankName}</div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <h3 className="text-lg font-bold text-black mb-3">TERMS</h3>
              <div className="text-sm text-black space-y-2">
                <div>{data.paymentInstructions}</div>
                <div>{data.terms}</div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-8 flex justify-center">
            <Badge className={`${statusConfig.color} border-0 text-sm px-4 py-2`}>
              <StatusIcon className={`w-4 h-4 mr-2 ${statusConfig.iconColor}`} />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {getActionButtons()}
            
            {/* Delete button - only for draft and failed statuses */}
            {['draft', 'failed'].includes(document.status) && (
              <Button
                variant="outline"
                onClick={() => onDelete?.(document)}
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}