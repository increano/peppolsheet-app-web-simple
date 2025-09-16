"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, User, MapPin, FileText, CreditCard, Check, Plus, ExternalLink } from 'lucide-react'
import { useRoleAuth } from '@/lib/role-auth-context'
import { supabase } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface AddNewContactContentProps {
  onClose?: () => void
}

type ManualStepType = 'contact-details' | 'business-details' | 'billing-preferences' | 'review-save'

interface BusinessEntity {
  id: string
  name: string
  tax_id?: string
  industry?: string
  company_street_address?: string
  company_city?: string
  company_state?: string
  company_postal_code?: string
  company_country?: string
  website?: string
  currency?: string
  iban?: string
  swift?: string
  bank_account_number?: string
  names?: Array<{ name: string; type?: string }>
  industries?: Array<{ name: string; code?: string }>
  isStaging?: boolean
}

export function AddNewContactContent({ onClose }: AddNewContactContentProps) {
  const { supabase, roleUser } = useRoleAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ManualStepType>('contact-details')
  const [businessEntities, setBusinessEntities] = useState<BusinessEntity[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessEntity | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    // Contact Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    
    // Business Details
    companyName: '',
    taxId: '',
    registrationNumber: '',
    industry: '',
    
    // Banking Information
    iban: '',
    swift: '',
    bankAccountNumber: '',
    
    // Billing Preferences
    paymentTerms: '',
    currency: '',
    billingAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: ''
  })

  // Manual form steps
  const steps = [
    { id: 'contact-details', name: 'Contact Details', icon: User, description: 'Basic contact information' },
    { id: 'business-details', name: 'Business Details', icon: FileText, description: 'Company and business information' },
    { id: 'billing-preferences', name: 'Billing Preferences', icon: CreditCard, description: 'Payment terms and settings' },
    { id: 'review-save', name: 'Review & Save', icon: Check, description: 'Final confirmation' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Fetch business entities when component mounts
  useEffect(() => {
    console.log('🔍 Contact form useEffect triggered')
    fetchBusinessEntities()
  }, [])

  const fetchBusinessEntities = async () => {
    setLoading(true)
    try {
      // Get current user from supabase directly (like business.tsx does)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('❌ Error getting current user:', userError)
        return
      }
      
      console.log('🔍 Current user from supabase:', currentUser.id)
      console.log('🔍 User from useRoleAuth:', roleUser?.id)
      
      // First, let's test if we can access the tables at all
      console.log('🔍 Testing table access...')
      
      // Fetch from business_entities table (tenant-wide) - like business.tsx does
      console.log('🔍 Fetching from business_entities table...')
      const { data: businessEntitiesData, error: businessError } = await supabase
        .from('business_entities')
        .select('*')
        .order('created_at', { ascending: false })

      if (businessError) {
        console.error('❌ Error fetching business entities:', businessError)
        console.error('❌ Error details:', businessError.message, businessError.details, businessError.hint)
      } else {
        console.log('✅ Business entities fetched successfully:', businessEntitiesData?.length || 0)
        console.log('📊 Sample business entity:', businessEntitiesData?.[0])
      }

      // Fetch from business_entities_staging table (user-specific)
      console.log('🔍 Fetching from business_entities_staging table...')
      const { data: stagingData, error: stagingError } = await supabase
        .from('business_entities_staging')
        .select('*')
        .eq('submitted_by', currentUser.id)
        .order('submitted_at', { ascending: false })

      if (stagingError) {
        console.error('❌ Error fetching staging entities:', stagingError)
        console.error('❌ Error details:', stagingError.message, stagingError.details, stagingError.hint)
      } else {
        console.log('✅ Staging entities fetched successfully:', stagingData?.length || 0)
        console.log('📊 Sample staging entity:', stagingData?.[0])
      }

      // Transform business entities to match expected format
      const transformedBusinessEntities: BusinessEntity[] = (businessEntitiesData || []).map((entity: any) => {
        console.log('🔄 Transforming business entity:', entity)
        return {
          id: entity.id,
          name: entity.names?.[0]?.name || entity.name || 'Unknown Company',
          tax_id: entity.tax_id,
          industry: entity.industries?.[0]?.name || entity.industry,
          company_street_address: entity.company_street_address,
          company_city: entity.company_city,
          company_state: entity.company_state,
          company_postal_code: entity.company_postal_code,
          company_country: entity.company_country,
          website: entity.website,
          currency: entity.currency,
          iban: entity.iban,
          swift: entity.swift,
          bank_account_number: entity.bank_account_number,
          names: entity.names,
          industries: entity.industries,
          isStaging: false
        }
      })

      // Transform staging entities to match expected format
      const transformedStagingEntities: BusinessEntity[] = (stagingData || []).map((entity: any) => {
        console.log('🔄 Transforming staging entity:', entity)
        return {
          id: entity.id,
          name: entity.name || 'Unknown Company',
          tax_id: entity.tax_id,
          industry: entity.industry,
          company_street_address: entity.company_street_address,
          company_city: entity.company_city,
          company_state: entity.company_state,
          company_postal_code: entity.company_postal_code,
          company_country: entity.company_country,
          website: entity.website,
          currency: entity.currency,
          iban: entity.iban,
          swift: entity.swift,
          bank_account_number: entity.bank_account_number,
          isStaging: true
        }
      })

      // Combine both results
      const allEntities = [
        ...transformedBusinessEntities,
        ...transformedStagingEntities
      ]

      console.log('📊 Transformed business entities:', transformedBusinessEntities.length)
      console.log('📊 Transformed staging entities:', transformedStagingEntities.length)
      console.log('📊 Total entities for dropdown:', allEntities.length)
      console.log('📊 Final entities array:', allEntities)
      
      setBusinessEntities(allEntities)
    } catch (error) {
      console.error('❌ Error fetching business entities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSelection = (businessId: string) => {
    setSelectedBusinessId(businessId)
    const business = businessEntities.find(entity => entity.id === businessId)
    setSelectedBusiness(business || null)
    
    // Update form data with selected business information
    if (business) {
      setFormData(prev => ({
        ...prev,
        companyName: business.name || '',
        taxId: business.tax_id || '',
        industry: business.industry || '',
        currency: business.currency || '',
        iban: business.iban || '',
        swift: business.swift || '',
        bankAccountNumber: business.bank_account_number || '',
        billingAddress: business.company_street_address || '',
        billingCity: business.company_city || '',
        billingPostalCode: business.company_postal_code || '',
        billingCountry: business.company_country || ''
      }))
    }
  }

  const handleAddNewBusiness = () => {
    // Redirect to companies page with add new company section
    router.push('/dashboard/e-invoice/companies?action=add-new')
  }

  const saveContact = async () => {
    // Validation
    if (!selectedBusinessId) {
      alert('Please select a company before saving the contact.')
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email).')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.')
      return
    }

    setSaving(true)
    try {
      // Get current user from supabase
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('Error getting current user:', userError)
        alert('Authentication error. Please try again.')
        return
      }

      // Get tenant_id for the user
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', currentUser.id)
        .single()

      if (tenantError || !tenantUser) {
        console.error('Error getting tenant:', tenantError)
        alert('Error getting user information. Please try again.')
        return
      }

      // Prepare contact data
      const contactData = {
        tenant_id: tenantUser.tenant_id,
        business_entity_id: selectedBusinessId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        job_title: formData.position || null,
        department: formData.department || null,
        iban: formData.iban || null,
        swift: formData.swift || null,
        bank_account_number: formData.bankAccountNumber || null,
        is_primary: false, // Default to false, can be changed later
        status: 'active',
        notes: null
      }

      console.log('💾 Saving contact:', contactData)

      // Insert contact into database
      const { data: savedContact, error: saveError } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single()

      if (saveError) {
        console.error('Error saving contact:', saveError)
        alert(`Error saving contact: ${saveError.message}`)
        return
      }

      console.log('✅ Contact saved successfully:', savedContact)
      alert('Contact saved successfully!')
      
      // Reset form or close modal
      if (onClose) {
        onClose()
      } else {
        // Reset form data
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          companyName: '',
          taxId: '',
          registrationNumber: '',
          industry: '',
          iban: '',
          swift: '',
          bankAccountNumber: '',
          paymentTerms: '',
          currency: '',
          billingAddress: '',
          billingCity: '',
          billingPostalCode: '',
          billingCountry: ''
        })
        setSelectedBusinessId('')
        setSelectedBusiness(null)
        setCurrentStep('contact-details')
      }

    } catch (error) {
      console.error('Error saving contact:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderContactDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="e.g., Manager, Director"
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="e.g., Sales, Finance"
          />
        </div>
      </div>
    </div>
  )


  const renderBusinessDetailsStep = () => (
    <div className="space-y-6">
      {/* Business Selection */}
      <div>
        <Label htmlFor="businessSelect">Select Company *</Label>
        <Select 
          value={selectedBusinessId} 
          onValueChange={(value) => {
            if (value === 'add-new') {
              handleAddNewBusiness()
            } else {
              handleBusinessSelection(value)
            }
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading companies..." : "Select a company"} />
          </SelectTrigger>
          <SelectContent>
            {(() => {
              console.log('🔍 Rendering dropdown with businessEntities:', businessEntities.length, businessEntities)
              return businessEntities.length > 0 ? (
                <>
                  {businessEntities.map((entity) => {
                    console.log('🔍 Rendering entity:', entity)
                    return (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{entity.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {entity.tax_id && (
                              <span className="text-xs text-gray-500">({entity.tax_id})</span>
                            )}
                            {entity.isStaging && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Pending</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                  <div className="border-t my-1"></div>
                  <SelectItem value="add-new" className="text-blue-600 font-medium">
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Company
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </div>
                  </SelectItem>
                </>
              ) : (
                <SelectItem value="add-new" className="text-blue-600 font-medium">
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Company
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </div>
                </SelectItem>
              )
            })()}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Business Details Display */}
      {selectedBusiness && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Selected Company Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Company:</span>
              <span className="ml-2 font-medium">{selectedBusiness.name}</span>
            </div>
            {selectedBusiness.tax_id && (
              <div>
                <span className="text-gray-600">Tax ID:</span>
                <span className="ml-2 font-medium">{selectedBusiness.tax_id}</span>
              </div>
            )}
            {selectedBusiness.industry && (
              <div>
                <span className="text-gray-600">Industry:</span>
                <span className="ml-2 font-medium">{selectedBusiness.industry}</span>
              </div>
            )}
            {selectedBusiness.currency && (
              <div>
                <span className="text-gray-600">Currency:</span>
                <span className="ml-2 font-medium">{selectedBusiness.currency}</span>
              </div>
            )}
          </div>
          {selectedBusiness.company_street_address && (
            <div className="text-sm">
              <span className="text-gray-600">Address:</span>
              <span className="ml-2 font-medium">
                {selectedBusiness.company_street_address}
                {selectedBusiness.company_city && `, ${selectedBusiness.company_city}`}
                {selectedBusiness.company_state && `, ${selectedBusiness.company_state}`}
                {selectedBusiness.company_postal_code && ` ${selectedBusiness.company_postal_code}`}
                {selectedBusiness.company_country && `, ${selectedBusiness.company_country}`}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  )

  const renderBillingPreferencesStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment terms" />
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
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
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
      
      {/* Banking Information */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Banking Information</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => handleInputChange('iban', e.target.value)}
              placeholder="Enter IBAN"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="swift">SWIFT/BIC Code</Label>
              <Input
                id="swift"
                value={formData.swift}
                onChange={(e) => handleInputChange('swift', e.target.value)}
                placeholder="Enter SWIFT/BIC code"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                placeholder="Enter bank account number"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Billing Address */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Billing Address</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="billingAddress">Street Address</Label>
            <Textarea
              id="billingAddress"
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              placeholder="Enter street address"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="billingCity">City</Label>
              <Input
                id="billingCity"
                value={formData.billingCity}
                onChange={(e) => handleInputChange('billingCity', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="billingPostalCode">Postal Code</Label>
              <Input
                id="billingPostalCode"
                value={formData.billingPostalCode}
                onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                placeholder="Postal code"
              />
            </div>
            <div>
              <Label htmlFor="billingCountry">Country</Label>
              <Input
                id="billingCountry"
                value={formData.billingCountry}
                onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviewSaveStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Name:</span>
            <span className="ml-2 font-medium">{formData.firstName} {formData.lastName}</span>
          </div>
          <div>
            <span className="text-gray-600">Email:</span>
            <span className="ml-2 font-medium">{formData.email}</span>
          </div>
          <div>
            <span className="text-gray-600">Phone:</span>
            <span className="ml-2 font-medium">{formData.phone || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-gray-600">Position:</span>
            <span className="ml-2 font-medium">{formData.position || 'Not provided'}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Company Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Company:</span>
            <span className="ml-2 font-medium">{selectedBusiness?.name || formData.companyName || 'Not selected'}</span>
          </div>
          <div>
            <span className="text-gray-600">Industry:</span>
            <span className="ml-2 font-medium">{selectedBusiness?.industry || formData.industry || 'Not provided'}</span>
          </div>
          {selectedBusiness?.tax_id && (
            <div>
              <span className="text-gray-600">Tax ID:</span>
              <span className="ml-2 font-medium">{selectedBusiness.tax_id}</span>
            </div>
          )}
          {selectedBusiness?.currency && (
            <div>
              <span className="text-gray-600">Currency:</span>
              <span className="ml-2 font-medium">{selectedBusiness.currency}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Ready to Save</h4>
        <p className="text-sm text-blue-700">
          Review the information above. Click "Save Contact" to create this contact in your system.
        </p>
      </div>
    </div>
  )

  const renderManualStep = () => {
    switch (currentStep) {
      case 'contact-details':
        return renderContactDetailsStep()
      case 'business-details':
        return renderBusinessDetailsStep()
      case 'billing-preferences':
        return renderBillingPreferencesStep()
      case 'review-save':
        return renderReviewSaveStep()
      default:
        return renderContactDetailsStep()
    }
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Contact</h2>
        <p className="text-gray-600">Create a new contact with detailed information.</p>
      </div>

      <div className="flex gap-8">
        {/* Left Sidebar - Steps */}
        <div className="w-64 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Contact Steps</h3>
          <div className="space-y-2">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isActive = currentStep === step.id
              const isCompleted = index < currentStepIndex
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as ManualStepType)}
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
                  // Save contact
                  saveContact()
                }
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : (currentStepIndex === steps.length - 1 ? 'Save Contact' : 'Next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
