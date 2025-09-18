"use client"

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Eye, 
  ShieldCheck, 
  X, 
  Send, 
  Mail, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Ban, 
  Flag, 
  FileEdit,
  Search,
  CalendarDays,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { StatusTabsSelector } from './status-tabs-selector'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from './data-table'
import { supabase } from '@/lib/auth-context'
import { useAuth } from '@/lib/auth-context'
import { DocumentViewDialog } from '@/components/e-invoice/document-view-dialog'
import { Document as DialogDocument } from '@/components/e-invoice/document-card'

// Document type definition - matches public.documents table structure
type Document = {
  id: string
  title: string
  status: string
  recipients: string
  contact: string
  statusUpdated: string
  createdOn: string
  createdBy: string
  value: string
  customerAddress?: string
  
  // Additional fields from documents table
  documentType?: string
  direction?: string
  customerId?: string
  customerEmail?: string
  purchaseOrder?: string
  invoiceId?: string
  invoiceDate?: string
  dueDate?: string
  note?: string
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
  customerAddressRecipient?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
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
  currency?: string
  subtotal?: number
  totalDiscount?: number
  totalTax?: number
  invoiceTotal?: number
  amountDue?: number
  previousUnpaidBalance?: number
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
  serviceStartDate?: string
  serviceEndDate?: string
  vendorTaxId?: string
  customerTaxId?: string
  paymentTerm?: string
  paymentDetails?: any // JSONB
  taxDetails?: any // JSONB
  items?: any // JSONB
  attachments?: any // JSONB
  tenantId?: string
  
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

interface ActivityDashboardProps {
  onNewInvoice?: () => void
  onBulkImport?: () => void
  refreshTrigger?: number // Optional prop to trigger refresh
}

export function ActivityDashboard({ onNewInvoice, onBulkImport, refreshTrigger }: ActivityDashboardProps) {
  const { user } = useAuth()
  const allStatusTabs = [
    { id: 'in-progress', name: 'In Progress', count: 2, icon: Play, isActive: true },
    { id: 'needs-attention', name: 'Needs Attention', count: 0, icon: AlertTriangle, isActive: false },
    { id: 'pending-actions', name: 'Pending Actions', count: 0, icon: Clock, isActive: false },
    { id: 'closed', name: 'Closed', count: 0, icon: CheckCircle, isActive: false },
    { id: 'awaiting-review', name: 'Awaiting Review', count: 0, icon: Eye, isActive: false },
    { id: 'validated', name: 'Validated', count: 0, icon: ShieldCheck, isActive: false },
    { id: 'not-accepted', name: 'Not Accepted', count: 0, icon: X, isActive: false },
    { id: 'sent', name: 'Sent', count: 0, icon: Send, isActive: false },
    { id: 'opened', name: 'Opened', count: 0, icon: Mail, isActive: false },
    { id: 'outdated', name: 'Outdated', count: 0, icon: Calendar, isActive: false },
    { id: 'awaiting-payment', name: 'Awaiting Payment', count: 0, icon: CreditCard, isActive: false },
    { id: 'paid', name: 'Paid', count: 0, icon: DollarSign, isActive: false },
    { id: 'refused', name: 'Refused', count: 0, icon: Ban, isActive: false },
    { id: 'finished', name: 'Finished', count: 0, icon: Flag, isActive: false },
    { id: 'proposed-changes', name: 'Proposed Changes', count: 0, icon: FileEdit, isActive: false }
  ]

  const [visibleTabs, setVisibleTabs] = useState(
    allStatusTabs.slice(0, 6).map(tab => tab.id) // Show first 6 tabs by default
  )
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState('15')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  
  // Document view dialog state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Convert Document to DialogDocument format
  const convertToDialogDocument = (doc: Document): DialogDocument => ({
    id: doc.id,
    documentId: doc.invoiceId || doc.title,
    customerName: doc.recipients,
    issueDate: doc.invoiceDate || doc.createdOn,
    amount: doc.invoiceTotal || parseFloat(doc.value.replace(/[€,$]/g, '')) || 0,
    currency: doc.currency || 'EUR',
    status: doc.status as any,
    customerEmail: doc.customerEmail || (doc.contact.includes('@') ? doc.contact.split('\n')[1] : undefined),
    customerAddress: doc.customerAddress,
    customerCity: doc.customerCity,
    customerPostalCode: doc.customerPostalCode,
    customerCountry: doc.customerCountry,
    dueDate: doc.dueDate,
    lastModified: doc.statusUpdated,
    lineItemsCount: doc.items ? (Array.isArray(doc.items) ? doc.items.length : 1) : 1,
    
    // Tenant fields
    businessName: doc.businessName,
    businessRegistrationNumber: doc.businessRegistrationNumber,
    taxId: doc.taxId,
    contactEmail: doc.contactEmail,
    contactPhone: doc.contactPhone,
    streetAddress: doc.streetAddress,
    city: doc.city,
    postalCode: doc.postalCode,
    country: doc.country,
    bankName: doc.bankName,
    iban: doc.iban,
    swift: doc.swift,
    bankAccountNumber: doc.bankAccountNumber
  })

  // Fetch documents when component mounts or refresh trigger changes
  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user, refreshTrigger])

  const fetchDocuments = async () => {
    if (!user) return
    
    try {
      setLoadingDocuments(true)
      console.log('Fetching documents...')
      
      // Get the user's tenant_id from tenant_users table
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenantUser) {
        console.error('User is not associated with any active tenant:', tenantError?.message)
        setDocuments([]) // Show empty list if no tenant
        return
      }

      // Fetch documents with tenant information using the authenticated supabase client
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          *,
          tenants!inner(
            business_name,
            business_registration_number,
            tax_id,
            contact_email,
            contact_phone,
            street_address,
            city,
            postal_code,
            country,
            bank_name,
            iban,
            swift,
            bank_account_number
          )
        `)
        .eq('tenant_id', tenantUser.tenant_id)
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        throw new Error(`Failed to fetch documents: ${documentsError.message}`)
      }

      console.log('Documents fetched:', documentsData?.length || 0)
      
      // Transform the documents to match our display format
      const transformedDocuments: Document[] = (documentsData || []).map((doc: any) => ({
        id: doc.id.toString(),
        title: doc.document_type || 'Document',
        status: doc.state || 'Draft',
        recipients: doc.customer_name || 'Unknown',
        contact: doc.customer_email ? `${doc.customer_name || 'Unknown'}\n${doc.customer_email}` : doc.customer_name || 'Unknown',
        statusUpdated: new Date(doc.updated_at || doc.created_at).toLocaleDateString(),
        createdOn: new Date(doc.created_at).toLocaleDateString(),
        createdBy: 'User', // We could get this from the user table if needed
        value: doc.invoice_total ? `${doc.currency || 'EUR'} ${doc.invoice_total.toFixed(2)}` : '$0.00',
        customerAddress: doc.customer_address,
        
        // Additional fields from database
        documentType: doc.document_type,
        direction: doc.direction,
        customerId: doc.customer_id,
        customerEmail: doc.customer_email,
        purchaseOrder: doc.purchase_order,
        invoiceId: doc.invoice_id,
        invoiceDate: doc.invoice_date,
        dueDate: doc.due_date,
        note: doc.note,
        vendorName: doc.vendor_name,
        vendorEmail: doc.vendor_email,
        vendorAddress: doc.vendor_address,
        vendorCity: doc.vendor_city,
        vendorPostalCode: doc.vendor_postal_code,
        vendorCountry: doc.vendor_country,
        vendorAddressRecipient: doc.vendor_address_recipient,
        vendorCityRecipient: doc.vendor_city_recipient,
        vendorPostalCodeRecipient: doc.vendor_postal_code_recipient,
        vendorCountryRecipient: doc.vendor_country_recipient,
        customerAddressRecipient: doc.customer_address_recipient,
        customerCity: doc.customer_city,
        customerPostalCode: doc.customer_postal_code,
        customerCountry: doc.customer_country,
        customerCityRecipient: doc.customer_city_recipient,
        customerPostalCodeRecipient: doc.customer_postal_code_recipient,
        customerCountryRecipient: doc.customer_country_recipient,
        billingAddress: doc.billing_address,
        billingCity: doc.billing_city,
        billingPostalCode: doc.billing_postal_code,
        billingCountry: doc.billing_country,
        billingAddressRecipient: doc.billing_address_recipient,
        billingCityRecipient: doc.billing_city_recipient,
        billingPostalCodeRecipient: doc.billing_postal_code_recipient,
        billingCountryRecipient: doc.billing_country_recipient,
        shippingAddress: doc.shipping_address,
        shippingCity: doc.shipping_city,
        shippingPostalCode: doc.shipping_postal_code,
        shippingCountry: doc.shipping_country,
        shippingAddressRecipient: doc.shipping_address_recipient,
        shippingCityRecipient: doc.shipping_city_recipient,
        shippingPostalCodeRecipient: doc.shipping_postal_code_recipient,
        shippingCountryRecipient: doc.shipping_country_recipient,
        currency: doc.currency,
        subtotal: doc.subtotal,
        totalDiscount: doc.total_discount,
        totalTax: doc.total_tax,
        invoiceTotal: doc.invoice_total,
        amountDue: doc.amount_due,
        previousUnpaidBalance: doc.previous_unpaid_balance,
        remittanceAddress: doc.remittance_address,
        remittanceCity: doc.remittance_city,
        remittancePostalCode: doc.remittance_postal_code,
        remittanceCountry: doc.remittance_country,
        remittanceAddressRecipient: doc.remittance_address_recipient,
        remittanceCityRecipient: doc.remittance_city_recipient,
        remittancePostalCodeRecipient: doc.remittance_postal_code_recipient,
        remittanceCountryRecipient: doc.remittance_country_recipient,
        serviceAddress: doc.service_address,
        serviceCity: doc.service_city,
        servicePostalCode: doc.service_postal_code,
        serviceCountry: doc.service_country,
        serviceAddressRecipient: doc.service_address_recipient,
        serviceCityRecipient: doc.service_city_recipient,
        servicePostalCodeRecipient: doc.service_postal_code_recipient,
        serviceCountryRecipient: doc.service_country_recipient,
        serviceStartDate: doc.service_start_date,
        serviceEndDate: doc.service_end_date,
        vendorTaxId: doc.vendor_tax_id,
        customerTaxId: doc.customer_tax_id,
        paymentTerm: doc.payment_term,
        paymentDetails: doc.payment_details,
        taxDetails: doc.tax_details,
        items: doc.items,
        attachments: doc.attachments,
        tenantId: doc.tenant_id,
        
        // Tenant fields from joined tenants table
        businessName: doc.tenants?.business_name,
        businessRegistrationNumber: doc.tenants?.business_registration_number,
        taxId: doc.tenants?.tax_id,
        contactEmail: doc.tenants?.contact_email,
        contactPhone: doc.tenants?.contact_phone,
        streetAddress: doc.tenants?.street_address,
        city: doc.tenants?.city,
        postalCode: doc.tenants?.postal_code,
        country: doc.tenants?.country,
        bankName: doc.tenants?.bank_name,
        iban: doc.tenants?.iban,
        swift: doc.tenants?.swift,
        bankAccountNumber: doc.tenants?.bank_account_number
      }))
      
      setDocuments(transformedDocuments)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Column definitions
  const columns: ColumnDef<Document>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("title")}</div>,
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
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize text-xs h-4 leading-4 px-2 py-0">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "recipients",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Recipients
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("recipients")}</div>,
    },
    {
      accessorKey: "contact",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Contact
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const contact = row.getValue("contact") as string
        const [name] = contact.split('\n')
        return (
          <div className="font-medium text-xs leading-[18px]">{name}</div>
        )
      },
    },
    {
      accessorKey: "statusUpdated",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Status updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("statusUpdated")}</div>,
    },
    {
      accessorKey: "createdOn",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Created on
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("createdOn")}</div>,
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Created by
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("createdBy")}</div>,
    },
    {
      accessorKey: "value",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium text-left"
          >
            Value
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="text-left font-medium text-xs leading-[18px]">{row.getValue("value")}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const document = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedDocument(document)
                setIsViewDialogOpen(true)
              }}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                console.log('Send document:', document.id)
                // TODO: Implement send functionality
              }}>
                Send
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  console.log('Delete document:', document.id)
                  // TODO: Implement delete functionality
                }}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const toggleTabVisibility = (tabId: string) => {
    setVisibleTabs(prev => {
      const isCurrentlyVisible = prev.includes(tabId)
      
      if (isCurrentlyVisible && prev.length <= 4) {
        // Don't allow hiding if it would result in less than 4 tabs
        return prev
      }
      
      if (isCurrentlyVisible) {
        return prev.filter(id => id !== tabId)
      } else {
        return [...prev, tabId]
      }
    })
  }

  const handleReorderTabs = (newOrder: string[]) => {
    // Update the allStatusTabs order based on the new order
    const reorderedTabs = newOrder.map(id => allStatusTabs.find(tab => tab.id === id)).filter(Boolean)
    // Note: In a real app, you might want to persist this order to localStorage or backend
    console.log('New tab order:', newOrder)
  }

  const displayedTabs = allStatusTabs.filter(tab => visibleTabs.includes(tab.id))

  return (
    <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 overflow-hidden">
        {/* Left Chevron */}
        <div className="flex items-center px-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-1 p-1 overflow-x-auto min-w-0 w-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displayedTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <div 
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-shrink-0 ${
                  tab.isActive 
                    ? 'bg-white border border-gray-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4 text-gray-500" />
                <span className={`text-sm ${tab.isActive ? 'font-medium text-gray-900' : ''}`}>
                  {tab.name}
                </span>
                <span className="text-sm text-gray-500">{tab.count} items</span>
              </div>
            )
          })}
        </div>
        {/* Right Chevron */}
        <div className="flex items-center px-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="ml-auto flex items-center px-4 flex-shrink-0">
          <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setShowModal(true)}
          >
            Customize
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          
          {/* Date Range Picker Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Date Range
            </Button>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <Input type="date" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <Input type="date" className="w-full" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowDatePicker(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => setShowDatePicker(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rows per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows:</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-20 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="px-6 pb-4">
        <DataTable columns={columns} data={documents} pageSize={parseInt(rowsPerPage)} />
      </div>

      {/* Status Tabs Selector Modal */}
      <StatusTabsSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        allTabs={allStatusTabs}
        visibleTabs={visibleTabs}
        onToggleTab={toggleTabVisibility}
        onReorderTabs={handleReorderTabs}
        title="Customize Activity Tabs"
        itemType="items"
      />

      {/* Document View Dialog */}
      <DocumentViewDialog
        document={selectedDocument ? convertToDialogDocument(selectedDocument) : null}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={() => console.log('Edit document')}
        onSend={() => console.log('Send document')}
        onDuplicate={() => console.log('Duplicate document')}
        onDelete={() => console.log('Delete document')}
        onDownloadUBL={() => console.log('Download UBL')}
        onViewUBL={() => console.log('View UBL')}
      />
    </div>
  )
}