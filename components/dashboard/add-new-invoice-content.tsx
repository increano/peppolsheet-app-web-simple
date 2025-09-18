"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, User, CreditCard, Check } from 'lucide-react'
import { supabase } from '@/lib/auth-context'
import { useAuth } from '@/lib/auth-context'

interface AddNewInvoiceContentProps {
  onClose?: () => void
  onSaveSuccess?: () => void
}

type ManualStepType = 'invoice-details' | 'customer-info' | 'line-items' | 'payment-terms' | 'review-save'

type Contact = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: string
  lastContact: string
  createdOn: string
  activity: string
  // Additional fields from database
  first_name?: string
  last_name?: string
  job_title?: string
  department?: string
  business_entity_id?: string
  is_primary?: boolean
  iban?: string
  swift?: string
  bank_account_number?: string
  shipping_street_address?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country?: string
  // Business entity address fields (fallback)
  business_entity?: {
    company_street_address?: string
    company_city?: string
    company_postal_code?: string
    company_country?: string
    names?: Array<{name: string}>
  }
}

export function AddNewInvoiceContent({ onClose, onSaveSuccess }: AddNewInvoiceContentProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ManualStepType>('invoice-details')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [formData, setFormData] = useState({
    // Document Details
    documentType: 'invoice',
    selectedContactId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    
    // Customer Info
    customerName: '',
    customerEmail: '',
    customerAddress: '',
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
  const steps = [
    { id: 'invoice-details', name: 'Document Details', icon: FileText, description: 'Basic document information' },
    { id: 'customer-info', name: 'Customer Information', icon: User, description: 'Customer details and billing address' },
    { id: 'line-items', name: 'Line Items', icon: FileText, description: 'Products and services' },
    { id: 'payment-terms', name: 'Payment Terms', icon: CreditCard, description: 'Payment terms and notes' },
    { id: 'review-save', name: 'Review & Save', icon: Check, description: 'Final confirmation' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Fetch contacts when user is available
  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user])

  const fetchContacts = async () => {
    if (!user) {
      console.log('No user available for fetching contacts')
      return
    }

    try {
      setLoadingContacts(true)
      console.log('🔍 Fetching contacts for document creation...')
      console.log('🔍 User object:', user)
      
      // Get tenant_id from tenant_users table (correct approach)
      console.log('🔍 Looking up tenant for user:', user.id)
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenantUser) {
        console.error('❌ Tenant lookup error:', tenantError?.message)
        console.error('Available user properties:', Object.keys(user))
        return
      }

      const tenantId = tenantUser.tenant_id
      console.log('✅ Tenant found:', tenantId)

      // First, let's check if we can see any contacts at all (without tenant filter)
      console.log('🔍 Testing: Fetching all contacts (no tenant filter)...')
      const { data: allContactsTest, error: allContactsError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, tenant_id')
        .limit(5)

      console.log('📊 All contacts test:', allContactsTest?.length || 0, allContactsTest)
      
      // Now fetch with tenant filter including business entity information
      console.log('🔍 Fetching contacts with tenant filter...')
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          business_entities (
            company_street_address,
            company_city,
            company_postal_code,
            company_country,
            names
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError)
        return
      }

      console.log('📊 Contacts fetched:', contactsData?.length || 0)
      console.log('📊 Raw contacts data:', contactsData)

      // Transform data to match Contact type
      const transformedContacts: Contact[] = (contactsData || []).map((contact: any) => {
        const businessEntity = contact.business_entities
        const companyName = businessEntity?.names?.[0]?.name || 'Unknown Company'
        
        return {
          id: contact.id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Name',
          company: companyName,
          email: contact.email || '',
          phone: contact.phone || '',
          status: contact.status || 'Active',
          lastContact: new Date(contact.updated_at).toLocaleDateString(),
          createdOn: new Date(contact.created_at).toLocaleDateString(),
          activity: contact.is_primary ? 'Primary Contact' : 'Contact',
          // Additional fields
          first_name: contact.first_name,
          last_name: contact.last_name,
          job_title: contact.job_title,
          department: contact.department,
          business_entity_id: contact.business_entity_id,
          is_primary: contact.is_primary,
          iban: contact.iban,
          swift: contact.swift,
          bank_account_number: contact.bank_account_number,
          shipping_street_address: contact.shipping_street_address,
          shipping_city: contact.shipping_city,
          shipping_postal_code: contact.shipping_postal_code,
          shipping_country: contact.shipping_country,
          // Business entity information for fallback
          business_entity: businessEntity
        }
      })

      console.log('📊 Transformed contacts:', transformedContacts)
      console.log('📊 Setting contacts state with', transformedContacts.length, 'contacts')
      
      // Only update contacts if we actually found some
      if (transformedContacts.length > 0) {
        setContacts(transformedContacts)
      } else {
        console.log('📊 No contacts found from database, keeping existing contacts')
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContactSelect = (contactId: string) => {
    const selectedContact = contacts.find(contact => contact.id === contactId)
    if (selectedContact) {
      // Use contact's personal address if available, otherwise fallback to business entity address
      const usePersonalAddress = selectedContact.shipping_street_address || selectedContact.shipping_city || selectedContact.shipping_postal_code
      
      const customerAddress = usePersonalAddress 
        ? selectedContact.shipping_street_address || ''
        : selectedContact.business_entity?.company_street_address || ''
        
      const customerCity = usePersonalAddress
        ? selectedContact.shipping_city || ''
        : selectedContact.business_entity?.company_city || ''
        
      const customerPostalCode = usePersonalAddress
        ? selectedContact.shipping_postal_code || ''
        : selectedContact.business_entity?.company_postal_code || ''
        
      const customerCountry = usePersonalAddress
        ? selectedContact.shipping_country || ''
        : selectedContact.business_entity?.company_country || ''

      setFormData(prev => ({
        ...prev,
        selectedContactId: contactId,
        // Auto-fill customer information
        customerName: selectedContact.name,
        customerEmail: selectedContact.email,
        customerAddress,
        customerCity,
        customerPostalCode,
        customerCountry
      }))
    }
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
    console.log('🔍 Rendering invoice details step, contacts count:', contacts.length)
    console.log('🔍 Contacts array:', contacts)
    console.log('🔍 LoadingContacts:', loadingContacts)
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="documentType">Document Type *</Label>
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

        <div>
          <Label htmlFor="selectedContact">Select Contact (Optional)</Label>
          <Select 
            value={formData.selectedContactId} 
            onValueChange={handleContactSelect}
            disabled={loadingContacts}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Choose a contact to auto-fill information"} />
            </SelectTrigger>
          <SelectContent>
            {contacts.length === 0 ? (
              <SelectItem value="no-contacts" disabled>
                No contacts found
              </SelectItem>
            ) : (
              contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
          </Select>
        </div>
      </div>
      
      {formData.selectedContactId && (
        <p className="text-sm text-green-600">
          ✓ Contact selected - customer information will be auto-filled
        </p>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoiceNumber">Document Number *</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
            placeholder={formData.documentType === 'invoice' ? 'e.g., INV-2025-001' : formData.documentType === 'credit-note' ? 'e.g., CN-2025-001' : 'e.g., DN-2025-001'}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoiceDate">Invoice Date *</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
          />
        </div>
      </div>
    </div>
    )
  }

  const renderCustomerInfoStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="customerName">Customer Name *</Label>
        <Input
          id="customerName"
          value={formData.customerName}
          onChange={(e) => handleInputChange('customerName', e.target.value)}
          placeholder="Enter customer name"
        />
      </div>
      
      <div>
        <Label htmlFor="customerEmail">Customer Email</Label>
        <Input
          id="customerEmail"
          type="email"
          value={formData.customerEmail}
          onChange={(e) => handleInputChange('customerEmail', e.target.value)}
          placeholder="Enter customer email"
        />
      </div>
      
      <div>
        <Label htmlFor="customerAddress">Billing Address</Label>
        <Textarea
          id="customerAddress"
          value={formData.customerAddress}
          onChange={(e) => handleInputChange('customerAddress', e.target.value)}
          placeholder="Enter billing address"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="customerCity">City</Label>
        <Input
          id="customerCity"
          value={formData.customerCity}
          onChange={(e) => handleInputChange('customerCity', e.target.value)}
          placeholder="Enter city"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerPostalCode">Postal Code</Label>
          <Input
            id="customerPostalCode"
            value={formData.customerPostalCode}
            onChange={(e) => handleInputChange('customerPostalCode', e.target.value)}
            placeholder="Enter postal code"
          />
        </div>
        <div>
          <Label htmlFor="customerCountry">Country</Label>
          <Input
            id="customerCountry"
            value={formData.customerCountry}
            onChange={(e) => handleInputChange('customerCountry', e.target.value)}
            placeholder="Enter country"
          />
        </div>
      </div>
    </div>
  )

  const renderLineItemsStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Line Items</h4>
        <Button onClick={addLineItem} variant="outline" size="sm">
          Add Item
        </Button>
      </div>
      
      {formData.lineItems.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Item {index + 1}</span>
            {formData.lineItems.length > 1 && (
              <Button 
                onClick={() => removeLineItem(index)} 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>
          
          <div>
            <Label htmlFor={`description-${index}`}>Description *</Label>
            <Input
              id={`description-${index}`}
              value={item.description}
              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
              placeholder="Enter item description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor={`unit-${index}`}>Unit</Label>
              <Input
                id={`unit-${index}`}
                value={item.unit}
                onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                placeholder="pcs, hrs, kg, etc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
              <Input
                id={`unitPrice-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor={`taxRate-${index}`}>Tax Rate (%)</Label>
              <Input
                id={`taxRate-${index}`}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={item.taxRate}
                onChange={(e) => handleLineItemChange(index, 'taxRate', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Total Amount</Label>
              <div className="p-2 bg-gray-50 rounded border">
                {formData.currency} {item.amount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="border-t pt-4">
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-lg font-medium">
              Total: {formData.currency} {formData.lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

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
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Document</h2>
        <p className="text-gray-600">Create a new invoice, credit note or debit note</p>
      </div>

      <div className="flex gap-8" style={{ minHeight: '80vh' }}>
        {/* Left Sidebar - Steps */}
        <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-4 rounded-l-lg min-h-full">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Create Document
            </h3>
          </div>
          
          <nav className="space-y-1">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = index < currentStepIndex
              
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? ''
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentStep(step.id as ManualStepType)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500'
                        : isActive
                        ? 'bg-blue-600'
                        : 'border-2 border-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <span className={`text-xs font-medium ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {step.name}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Right Content - Form */}
        <div className="flex-1">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {steps[currentStepIndex]?.name}
            </h3>
            <p className="text-gray-600">{steps[currentStepIndex]?.description}</p>
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
      </div>
    </div>
  )
}
