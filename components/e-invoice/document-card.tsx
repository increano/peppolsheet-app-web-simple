"use client"

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Edit, 
  Eye, 
  Send, 
  MoreHorizontal,
  Copy,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react'

export interface Document {
  id: string
  documentId: string
  customerName: string
  issueDate: string
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'validated' | 'sent' | 'delivered' | 'failed' | 'paid'
  customerEmail?: string
  customerAddress?: string
  peppolId?: string
  peppolVerified?: boolean
  lastModified?: string
  dueDate?: string
  lineItemsCount?: number
  
  // Additional fields from database
  items?: any // JSONB array of line items
  invoiceTotal?: number
  subtotal?: number
  totalTax?: number
  totalDiscount?: number
  vendorName?: string
  vendorEmail?: string
  vendorAddress?: string
  vendorCity?: string
  vendorPostalCode?: string
  vendorCountry?: string
  vendorAddressRecipient?: string
  vendorCityRecipient?: string
  vendorPostalCodeRecipient?: string
  vendorCountryRecipient?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
  customerAddressRecipient?: string
  customerCityRecipient?: string
  customerPostalCodeRecipient?: string
  customerCountryRecipient?: string
  billingAddress?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
  billingAddressRecipient?: string
  billingCityRecipient?: string
  billingPostalCodeRecipient?: string
  billingCountryRecipient?: string
  shippingAddress?: string
  shippingCity?: string
  shippingPostalCode?: string
  shippingCountry?: string
  shippingAddressRecipient?: string
  shippingCityRecipient?: string
  shippingPostalCodeRecipient?: string
  shippingCountryRecipient?: string
  remittanceAddress?: string
  remittanceCity?: string
  remittancePostalCode?: string
  remittanceCountry?: string
  remittanceAddressRecipient?: string
  remittanceCityRecipient?: string
  remittancePostalCodeRecipient?: string
  remittanceCountryRecipient?: string
  serviceAddress?: string
  serviceCity?: string
  servicePostalCode?: string
  serviceCountry?: string
  serviceAddressRecipient?: string
  serviceCityRecipient?: string
  servicePostalCodeRecipient?: string
  serviceCountryRecipient?: string
  paymentDetails?: any // JSONB
  taxDetails?: any // JSONB
  attachments?: any // JSONB
  
  // Tenant fields from public.tenants table
  businessName?: string
  businessRegistrationNumber?: string
  taxId?: string
  contactEmail?: string
  contactPhone?: string
  streetAddress?: string
  city?: string
  postalCode?: string
  country?: string
  bankName?: string
  iban?: string
  swift?: string
  bankAccountNumber?: string
}

interface DocumentCardProps {
  document: Document
  isSelected?: boolean
  onSelect?: (documentId: string, selected: boolean) => void
  onEdit?: (document: Document) => void
  onView?: (document: Document) => void
  onSend?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownloadUBL?: (document: Document) => void
  onViewUBL?: (document: Document) => void
  className?: string
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
    icon: Clock,
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
    icon: XCircle,
    iconColor: 'text-red-500'
  },
  paid: {
    label: 'Paid',
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle,
    iconColor: 'text-purple-500'
  }
}

const getStatusConfig = (status: Document['status']) => {
  return statusConfig[status] || statusConfig.draft
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-EU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function DocumentCard({
  document,
  isSelected = false,
  onSelect,
  onEdit,
  onView,
  onSend,
  onDuplicate,
  onDelete,
  onDownloadUBL,
  onViewUBL,
  className = ''
}: DocumentCardProps) {
  const statusConfig = getStatusConfig(document.status)
  const StatusIcon = statusConfig.icon

  const handleSelect = (checked: boolean) => {
    onSelect?.(document.id, checked)
  }

  const getActionButtons = () => {
    const buttons = []

    // Edit button - available for draft and failed statuses
    if (['draft', 'failed'].includes(document.status)) {
      buttons.push(
        <Button
          key="edit"
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(document)}
          className="h-8 px-3"
        >
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
      )
    }

    // View button - always available
    buttons.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => onView?.(document)}
        className="h-8 px-3"
      >
        <Eye className="w-3 h-3 mr-1" />
        View
      </Button>
    )

    // Send button - available for draft, validated, and failed statuses
    if (['draft', 'validated', 'failed'].includes(document.status)) {
      buttons.push(
        <Button
          key="send"
          variant="default"
          size="sm"
          onClick={() => onSend?.(document)}
          className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-3 h-3 mr-1" />
          Send
        </Button>
      )
    }

    return buttons
  }

  const getDropdownItems = () => {
    const items = []

    // Duplicate - available for all statuses
    items.push(
      <DropdownMenuItem key="duplicate" onClick={() => onDuplicate?.(document)}>
        <Copy className="w-4 h-4 mr-2" />
        Duplicate
      </DropdownMenuItem>
    )

    // View UBL - available for validated, sent, delivered, paid
    if (['validated', 'sent', 'delivered', 'paid'].includes(document.status)) {
      items.push(
        <DropdownMenuItem key="view-ubl" onClick={() => onViewUBL?.(document)}>
          <FileText className="w-4 h-4 mr-2" />
          View UBL XML
        </DropdownMenuItem>
      )
    }

    // Download UBL - available for validated, sent, delivered, paid
    if (['validated', 'sent', 'delivered', 'paid'].includes(document.status)) {
      items.push(
        <DropdownMenuItem key="download-ubl" onClick={() => onDownloadUBL?.(document)}>
          <Download className="w-4 h-4 mr-2" />
          Download UBL
        </DropdownMenuItem>
      )
    }

    // Separator before destructive actions
    if (items.length > 0) {
      items.push(<DropdownMenuSeparator key="separator" />)
    }

    // Delete - available for draft and failed statuses
    if (['draft', 'failed'].includes(document.status)) {
      items.push(
        <DropdownMenuItem 
          key="delete" 
          onClick={() => onDelete?.(document)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      )
    }

    return items
  }

  return (
    <Card className={`relative hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              className="mt-1"
            />
            <div>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                {document.documentId}
              </h3>
              {document.lastModified && (
                <p className="text-xs text-gray-500">
                  Modified {formatDate(document.lastModified)}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {getDropdownItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 mb-3"></div>

        {/* Customer Information */}
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">
            {document.customerName}
          </span>
          {document.peppolVerified && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>

        {/* Date and Amount */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {formatDate(document.issueDate)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(document.amount, document.currency)}
            </span>
          </div>
        </div>

        {/* Additional Info */}
        {document.lineItemsCount && (
          <div className="text-xs text-gray-500 mb-3">
            {document.lineItemsCount} line item{document.lineItemsCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-gray-200 mb-3"></div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
            <Badge className={`${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {getActionButtons()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example usage component for testing
export function DocumentCardExample() {
  const sampleDocument: Document = {
    id: '1',
    documentId: 'INV-2024-001',
    customerName: 'Acme Corporation',
    issueDate: '2024-01-15',
    amount: 1250.00,
    currency: 'EUR',
    status: 'draft',
    customerEmail: 'contact@acme.com',
    peppolId: 'BE:VAT:BE0123456789',
    peppolVerified: true,
    lastModified: '2024-01-15T10:30:00Z',
    lineItemsCount: 3
  }

  return (
    <div className="max-w-sm">
      <DocumentCard
        document={sampleDocument}
        onEdit={(doc) => console.log('Edit:', doc)}
        onView={(doc) => console.log('View:', doc)}
        onSend={(doc) => console.log('Send:', doc)}
        onDuplicate={(doc) => console.log('Duplicate:', doc)}
        onDelete={(doc) => console.log('Delete:', doc)}
        onDownloadUBL={(doc) => console.log('Download UBL:', doc)}
        onViewUBL={(doc) => console.log('View UBL:', doc)}
      />
    </div>
  )
}
