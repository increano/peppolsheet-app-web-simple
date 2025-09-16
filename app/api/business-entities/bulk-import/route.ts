import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stagingService } from '@/lib/staging-service'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Bulk import API called')
    
    const { companies } = await request.json()
    console.log('📊 Received data:', { 
      companiesCount: companies?.length,
      sampleCompany: companies?.[0] 
    })

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      console.log('❌ No companies provided')
      return NextResponse.json(
        { error: 'No companies provided' },
        { status: 400 }
      )
    }

    // Get the user's tenant_id from the request
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ No authorization header')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 Token extracted, length:', token.length)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError?.message)
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', user.email)

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
      details: [] as any[],
      stagingIds: [] as string[]
    }

    // Convert companies to staging entities matching business_entities_staging table structure
    const stagingEntities = companies.map(company => {
      // Transform the CSV data to match the staging table structure
      const stagingEntity = {
        // Basic company information
        tax_id: company.tax_id || null,
        website: company.website || null,
        currency: company.currency || 'EUR',
        email: company.email || null,
        
        // Address information
        company_street_address: company.company_street_address || null,
        company_city: company.company_city || null,
        company_postal_code: company.company_postal_code || null,
        company_country: company.company_country || 'BE',
        
        // Banking information
        iban: company.iban || null,
        swift: company.swift || null,
        bank_account_number: company.bank_account_number || null,
        
        // JSON fields for complex data
        names: company.company_name ? [{ name: company.company_name, type: 'legal' }] : null,
        industries: company.industry ? [{ name: company.industry, code: null }] : null,
        peppol_data: null, // Will be populated later if needed
        
        // Staging metadata
        submitted_by: user.id,
        source_type: 'csv_import',
        verification_status: 'pending'
      }
      
      console.log('🔄 Transformed entity:', stagingEntity)
      return stagingEntity
    })

    // Insert directly into business_entities_staging table
    console.log(`📤 Inserting ${stagingEntities.length} entities into staging table`)
    console.log('📋 Sample entity:', stagingEntities[0])
    
    const { data: insertedEntities, error: insertError } = await supabase
      .from('business_entities_staging')
      .insert(stagingEntities)
      .select('id, names, tax_id, verification_status')

    if (insertError) {
      console.error('❌ Staging insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert entities into staging table', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ Successfully inserted entities:', insertedEntities)

    // Process results
    if (insertedEntities && insertedEntities.length > 0) {
      results.submitted = insertedEntities.length
      results.stagingIds = insertedEntities.map(entity => entity.id)
      
      insertedEntities.forEach((entity, index) => {
        const companyName = entity.names?.[0]?.name || `Company ${index + 1}`
        results.details.push({
          company: companyName,
          stagingId: entity.id,
          taxId: entity.tax_id,
          status: 'submitted_for_review'
        })
      })
    }

    console.log(`📊 Staging submission completed: ${results.submitted} submitted, ${results.errors.length} errors`)
    
    return NextResponse.json({
      success: true,
      message: `${results.submitted} companies submitted for admin review`,
      results: {
        ...results,
        message: `Successfully submitted ${results.submitted} companies to staging for admin review. They will be available for approval in the admin dashboard.`
      }
    })

  } catch (error) {
    console.error('Bulk import error:', error)
    
    // Provide more specific error messages
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
        errorMessage = 'Invalid data format. Please check your CSV file.'
        statusCode = 400
      } else {
        errorMessage = `Import error: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}
