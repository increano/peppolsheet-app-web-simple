import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { companies } = await request.json()

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: 'Companies array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Get user and tenant context
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get tenant_id for the user
    console.log('🔍 Looking up tenant for user:', user.id)
    
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (tenantError || !tenantUser) {
      console.log('❌ Tenant lookup error:', tenantError?.message)
      return NextResponse.json(
        { error: 'Unable to determine tenant context' },
        { status: 400 }
      )
    }

    const tenantId = tenantUser.tenant_id
    console.log('✅ Tenant found:', tenantId)

    const results = {
      submitted: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    // Process each company directly (no staging)
    for (const company of companies) {
      try {
        console.log(`🔄 Processing company: ${company.name}`)
        console.log(`📋 Company data received:`, JSON.stringify(company, null, 2))

        // Step 1: Create business entity directly with correct field mappings
        const insertData = {
          // Core fields with correct mapping
          tax_id: company.vatNumber || '',
          company_street_address: 'Address to be provided', // Default value to satisfy trigger constraint
          company_city: company.city || '',
          company_postal_code: '0000', // Default value to satisfy any postal code constraints
          company_country: company.country || 'BE',
          email: company.email || '',
          phone: company.phone || '',
          website: company.domain || '',
          currency: 'EUR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // JSONB fields that need proper structure
          names: [{
            name: company.name,
            company_type: company.legalForm || 'Unknown'
          }],
          industries: [{
            industry_code: 0, // Default value, should be parsed from company.industry if available
            industry_name: company.industry || 'Unknown Industry'
          }],
          peppol_data: company.peppolEnabled && company.peppolData && company.peppolData.length > 0 
            ? company.peppolData // Use preserved original PEPPOL data structure
            : company.peppolEnabled ? [{
                // Fallback structure if no preserved data
                participant_id: company.peppolId || company.vatNumber || '',
                contact_name: '',
                contact_email: '',
                contact_phone: '',
                country: company.country || 'BE',
                website: company.domain || '',
                additional_info: company.industry || '',
                identifiers: [{
                  scheme: '0106', // Default PEPPOL scheme for Belgium
                  value: company.vatNumber || ''
                }],
                document_types: company.peppolDocuments || ['INVOICE']
              }] : []
        }
        
        console.log(`📤 Inserting business entity with data:`, JSON.stringify(insertData, null, 2))
        
        const { data: businessEntity, error: businessError } = await supabase
          .from('business_entities')
          .insert(insertData)
          .select('id')
          .single()

        if (businessError) {
          console.error(`❌ Failed to create business entity for ${company.name}:`, businessError)
          results.errors.push(`Failed to create business entity for ${company.name}: ${businessError.message}`)
          continue
        }

        console.log(`✅ Created business entity for ${company.name}:`, businessEntity.id)

        results.submitted++
        results.details.push({
          company: company.name,
          businessEntityId: businessEntity.id,
          status: 'created'
        })

      } catch (error) {
        console.error(`❌ Error processing company ${company.name}:`, error)
        results.errors.push(`Error processing ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`📊 Business entities creation completed: ${results.submitted} created, ${results.errors.length} errors`)
    
    return NextResponse.json({
      success: true,
      message: `${results.submitted} companies successfully added as business entities`,
      results: {
        ...results,
        message: `Successfully added ${results.submitted} companies as business entities. They are now available for use.`
      }
    })

  } catch (error) {
    console.error('Direct import error:', error)
    
    let errorMessage = 'Error importing companies. Please try again.'
    let statusCode = 500
    
          if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = 'Authentication error. Please log in again.'
          statusCode = 401
        } else if (error.message.includes('tenant')) {
          errorMessage = 'Tenant context error. Please contact support.'
          statusCode = 400
        } else if (error.message.includes('validation')) {
          errorMessage = 'Invalid data format. Please check your input.'
          statusCode = 400
        } else {
          errorMessage = `Business entity creation error: ${error.message}`
        }
      }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
