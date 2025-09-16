import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface StagingEntity {
  id: string
  name: string
  businessName?: string
  taxId?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  billingAddress?: string
  billingCity?: string
  billingState?: string
  billingPostalCode?: string
  billingCountry?: string
  peppolScheme?: string
  currency?: string
  relationshipType: 'customer' | 'supplier'
  customerNumber?: string
  supplierNumber?: string
  storecoveReceiverIdentifier?: string
  storecoveSenderIdentifier?: string
  paymentTerms?: string
  creditLimit?: string
  preferredPaymentMethod?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  bankName?: string
  creditRating?: string
  submittedBy: string
  submittedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  rejectionReason?: string
}

export interface StagingResult {
  success: boolean
  stagingId: string
  message: string
}

export interface ApprovalResult {
  success: boolean
  businessEntityId?: string
  customerId?: string
  supplierId?: string
  message: string
}

class StagingService {
  private supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Submit entities to staging
  async submitToStaging(entities: Omit<StagingEntity, 'id' | 'submittedAt' | 'status'>[], userId: string): Promise<StagingResult[]> {
    console.log(`🔄 StagingService: Starting to stage ${entities.length} entities`)
    console.log(`🔄 StagingService: User ID: ${userId}`)
    
    const results: StagingResult[] = []

    for (const entity of entities) {
      try {
        console.log(`🔄 StagingService: Processing entity: ${entity.name}`)
        
        // Insert into database staging table
        const { data: stagingEntity, error } = await this.supabase
          .from('business_entities_staging')
          .insert({
            name: entity.name,
            business_name: entity.businessName,
            tax_id: entity.taxId,
            email: entity.email,
            phone: entity.phone,
            website: entity.website,
            industry: entity.industry,
            company_street_address: entity.billingAddress,
            company_city: entity.billingCity,
            company_state: entity.billingState,
            company_postal_code: entity.billingPostalCode,
            company_country: entity.billingCountry || 'US',
            peppol_scheme: entity.peppolScheme,
            currency: entity.currency || 'USD',
            submitted_by: userId as string,
            verification_status: 'pending',
            source_type: 'manual'
          })
          .select('id')
          .single()

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }

        console.log(`🔄 StagingService: Stored entity with ID: ${stagingEntity.id}`)

        results.push({
          success: true,
          stagingId: stagingEntity.id,
          message: `Successfully staged ${entity.name}`
        })

        console.log(`✅ Staged entity: ${entity.name} (ID: ${stagingEntity.id})`)
      } catch (error) {
        console.error(`❌ StagingService: Error staging ${entity.name}:`, error)
        results.push({
          success: false,
          stagingId: '',
          message: `Failed to stage ${entity.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    console.log(`🔄 StagingService: Completed staging. Returning ${results.length} results`)
    
    return results
  }

  // Get pending staging entities
  async getPendingEntities(): Promise<StagingEntity[]> {
    console.log(`🔄 StagingService: Getting pending entities from database`)
    
    const { data: entities, error } = await this.supabase
      .from('business_entities_staging')
      .select('*')
      .eq('verification_status', 'pending')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error(`❌ StagingService: Error fetching pending entities:`, error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log(`🔄 StagingService: Found ${entities?.length || 0} pending entities`)
    
    // Convert database entities to StagingEntity format
    const stagingEntities: StagingEntity[] = (entities || []).map(dbEntity => ({
      id: dbEntity.id,
      name: dbEntity.name,
      businessName: dbEntity.business_name,
      taxId: dbEntity.tax_id,
      email: dbEntity.email,
      phone: dbEntity.phone,
      website: dbEntity.website,
      industry: dbEntity.industry,
      billingAddress: dbEntity.company_street_address,
      billingCity: dbEntity.company_city,
      billingState: dbEntity.company_state,
      billingPostalCode: dbEntity.company_postal_code,
      billingCountry: dbEntity.company_country,
      peppolScheme: dbEntity.peppol_scheme,
      currency: dbEntity.currency,
      relationshipType: dbEntity.relationship_type as 'customer' | 'supplier',
      customerNumber: dbEntity.customer_number,
      supplierNumber: dbEntity.supplier_number,
      storecoveReceiverIdentifier: dbEntity.storecove_receiver_identifier,
      storecoveSenderIdentifier: dbEntity.storecove_sender_identifier,
      paymentTerms: dbEntity.payment_terms,
      creditLimit: dbEntity.credit_limit,
      preferredPaymentMethod: dbEntity.preferred_payment_method,
      bankAccountNumber: dbEntity.bank_account_number,
      bankRoutingNumber: dbEntity.bank_routing_number,
      bankName: dbEntity.bank_name,
      creditRating: dbEntity.credit_rating,
      submittedBy: dbEntity.submitted_by,
      submittedAt: new Date(dbEntity.submitted_at),
      status: dbEntity.verification_status as 'pending' | 'approved' | 'rejected',
      adminNotes: dbEntity.admin_notes,
      reviewedBy: dbEntity.reviewed_by,
      reviewedAt: dbEntity.reviewed_at ? new Date(dbEntity.reviewed_at) : undefined,
      rejectionReason: dbEntity.rejection_reason
    }))
    
    return stagingEntities
  }

  // Get staging entity by ID
  async getStagingEntity(stagingId: string): Promise<StagingEntity | null> {
    const { data: stagingEntity, error } = await this.supabase
      .from('business_entities_staging')
      .select('*')
      .eq('id', stagingId)
      .single()

    if (error || !stagingEntity) {
      return null
    }

    return {
      id: stagingEntity.id,
      name: stagingEntity.names?.[0]?.name || 'Unknown Company',
      businessName: stagingEntity.names?.[0]?.name || 'Unknown Company',
      taxId: stagingEntity.tax_id,
      email: stagingEntity.email,
      phone: stagingEntity.phone,
      website: stagingEntity.website,
      industry: stagingEntity.industries?.[0]?.industry_name || 'Unknown Industry',
      billingAddress: stagingEntity.company_street_address,
      billingCity: stagingEntity.company_city,
      billingState: stagingEntity.company_state,
      billingPostalCode: stagingEntity.company_postal_code,
      billingCountry: stagingEntity.company_country,
      peppolScheme: stagingEntity.peppol_data?.[0]?.participant_id || '',
      currency: stagingEntity.currency,
      relationshipType: stagingEntity.relationship_type as 'customer' | 'supplier',
      customerNumber: stagingEntity.customer_number,
      supplierNumber: stagingEntity.supplier_number,
      storecoveReceiverIdentifier: stagingEntity.storecove_receiver_identifier,
      storecoveSenderIdentifier: stagingEntity.storecove_sender_identifier,
      paymentTerms: stagingEntity.payment_terms,
      creditLimit: stagingEntity.credit_limit,
      preferredPaymentMethod: stagingEntity.preferred_payment_method,
      bankAccountNumber: stagingEntity.bank_account_number,
      bankRoutingNumber: stagingEntity.bank_routing_number,
      bankName: stagingEntity.bank_name,
      creditRating: stagingEntity.credit_rating,
      submittedBy: stagingEntity.submitted_by,
      submittedAt: new Date(stagingEntity.created_at),
      status: stagingEntity.verification_status as 'pending' | 'approved' | 'rejected',
      adminNotes: stagingEntity.admin_notes,
      reviewedBy: stagingEntity.reviewed_by,
      reviewedAt: stagingEntity.reviewed_at ? new Date(stagingEntity.reviewed_at) : undefined,
      rejectionReason: stagingEntity.rejection_reason
    }
  }

  // Approve staging entity
  async approveEntity(stagingId: string, adminUserId: string, notes?: string): Promise<ApprovalResult> {
    console.log(`🔄 StagingService: Approving entity ${stagingId}`)
    
    // Get staging entity from database
    const { data: stagingEntity, error: fetchError } = await this.supabase
      .from('business_entities_staging')
      .select('*')
      .eq('id', stagingId)
      .eq('verification_status', 'pending')
      .single()

    if (fetchError || !stagingEntity) {
      return {
        success: false,
        message: 'Staging entity not found or not in pending status'
      }
    }

    try {
      // Step 1: Create business entity in production
      const { data: businessEntity, error: businessError } = await this.supabase
        .from('business_entities')
        .insert({
          // JSONB fields
          names: [{
            name: stagingEntity.name,
            company_type: 'Unknown'
          }],
          tax_id: stagingEntity.taxId,
          email: stagingEntity.email,
          phone: stagingEntity.phone,
          website: stagingEntity.website,
          // Industries as JSONB
          industries: [{
            industry_code: 0,
            industry_name: stagingEntity.industry
          }],
          company_street_address: stagingEntity.billingAddress,
          company_city: stagingEntity.billingCity,
          company_state: stagingEntity.billingState,
          company_postal_code: stagingEntity.billingPostalCode,
          company_country: stagingEntity.billingCountry || 'US',
          // PEPPOL data as JSONB
          peppol_data: stagingEntity.peppolScheme ? [{
            participant_id: stagingEntity.peppolScheme,
            contact_name: '',
            contact_email: '',
            contact_phone: '',
            country: stagingEntity.billingCountry || 'US',
            website: stagingEntity.website,
            additional_info: stagingEntity.industry,
            identifiers: [{
              scheme: '0106',
              value: stagingEntity.taxId
            }],
            document_types: ['INVOICE']
          }] : [],
          currency: stagingEntity.currency || 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (businessError) {
        throw new Error(`Failed to create business entity: ${businessError.message}`)
      }

      let customerId: string | undefined
      let supplierId: string | undefined

      // Step 2: Create relationship based on type
      if (stagingEntity.relationshipType === 'customer') {
        const { data: customer, error: customerError } = await this.supabase
          .from('customers')
          .insert({
            tenant_id: stagingEntity.submittedBy, // This should be the tenant_id, not user_id
            business_entity_id: businessEntity.id,
            customer_number: stagingEntity.customerNumber,
            storecove_receiver_identifier: stagingEntity.storecoveReceiverIdentifier,
            default_payment_terms: stagingEntity.paymentTerms ? parseInt(stagingEntity.paymentTerms) : 30,
            credit_limit: stagingEntity.creditLimit ? parseFloat(stagingEntity.creditLimit) : null
          })
          .select('id')
          .single()

        if (customerError) {
          throw new Error(`Failed to create customer relationship: ${customerError.message}`)
        }

        customerId = customer.id
      } else if (stagingEntity.relationshipType === 'supplier') {
        const { data: supplier, error: supplierError } = await this.supabase
          .from('suppliers')
          .insert({
            tenant_id: stagingEntity.submittedBy, // This should be the tenant_id, not user_id
            business_entity_id: businessEntity.id,
            supplier_number: stagingEntity.supplierNumber,
            storecove_sender_identifier: stagingEntity.storecoveSenderIdentifier,
            default_payment_terms: stagingEntity.paymentTerms ? parseInt(stagingEntity.paymentTerms) : 30,
            preferred_payment_method: stagingEntity.preferredPaymentMethod,
            bank_account_number: stagingEntity.bankAccountNumber,
            bank_routing_number: stagingEntity.bankRoutingNumber,
            bank_name: stagingEntity.bankName,
            credit_rating: stagingEntity.creditRating
          })
          .select('id')
          .single()

        if (supplierError) {
          throw new Error(`Failed to create supplier relationship: ${supplierError.message}`)
        }

        supplierId = supplier.id
      }

      // Step 3: Update staging entity status in database
      const { error: updateError } = await this.supabase
        .from('business_entities_staging')
        .update({
          verification_status: 'approved',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', stagingId)

      if (updateError) {
        throw new Error(`Failed to update staging status: ${updateError.message}`)
      }

      return {
        success: true,
        businessEntityId: businessEntity.id,
        customerId,
        supplierId,
        message: `Successfully approved ${stagingEntity.name}`
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to approve entity: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Reject staging entity
  async rejectEntity(stagingId: string, adminUserId: string, reason: string): Promise<ApprovalResult> {
    console.log(`🔄 StagingService: Rejecting entity ${stagingId}`)
    
    // Get staging entity from database
    const { data: stagingEntity, error: fetchError } = await this.supabase
      .from('business_entities_staging')
      .select('name')
      .eq('id', stagingId)
      .eq('verification_status', 'pending')
      .single()

    if (fetchError || !stagingEntity) {
      return {
        success: false,
        message: 'Staging entity not found or not in pending status'
      }
    }

    // Update staging entity status in database
    const { error: updateError } = await this.supabase
      .from('business_entities_staging')
      .update({
        verification_status: 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', stagingId)

    if (updateError) {
      return {
        success: false,
        message: `Failed to update staging status: ${updateError.message}`
      }
    }

    return {
      success: true,
      message: `Successfully rejected ${stagingEntity.name}`
    }
  }

  // Clean up old staging entities (older than 30 days)
  async cleanupOldEntities(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await this.supabase
      .from('business_entities_staging')
      .delete()
      .lt('submitted_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('Error cleaning up old staging entities:', error)
    }
  }
}

// Export singleton instance
export const stagingService = new StagingService()
