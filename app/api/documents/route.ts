import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract the token and create authenticated client
    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Try to get user's tenant_id, but fall back gracefully if tenant system is not set up
    let tenantId = null
    try {
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!tenantError && tenantUser) {
        tenantId = tenantUser.tenant_id
      } else {
        console.log('No tenant system found, using user-based approach')
        // For simpler setups without multi-tenancy, we can use the user ID as tenant ID
        tenantId = user.id
      }
    } catch (error) {
      console.log('Tenant lookup failed, falling back to user ID:', error)
      tenantId = user.id
    }

    // Validate required fields
    if (!data.invoiceNumber) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
        { status: 400 }
      )
    }

    if (!data.invoiceDate) {
      return NextResponse.json(
        { error: 'Invoice date is required' },
        { status: 400 }
      )
    }

    // Calculate totals from line items
    const lineItems = data.lineItems || []
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const totalTax = lineItems.reduce((sum: number, item: any) => {
      // Assuming 21% VAT rate if not specified
      const taxRate = 0.21
      return sum + (item.amount * taxRate)
    }, 0)
    const total = subtotal + totalTax

    // Prepare document data for insertion
    const documentData = {
      tenant_id: tenantId,
      document_type: data.documentType?.toUpperCase() || 'INVOICE',
      state: 'DRAFT',
      direction: 'OUTBOUND',
      
      // Invoice identification
      invoice_id: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      due_date: data.dueDate,
      
      // Customer information
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_address: [
        data.customerAddress,
        data.customerCity,
        data.customerPostalCode,
        data.customerCountry
      ].filter(Boolean).join(', '),
      
      // Financial information
      currency: data.currency || 'EUR',
      subtotal: subtotal,
      total_tax: totalTax,
      invoice_total: total,
      amount_due: total,
      payment_term: data.paymentTerms,
      
      // Additional information
      note: [data.notes, data.terms].filter(Boolean).join('\n\n')
    }

    console.log('Creating document with data:', documentData)

    // Insert the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert(documentData)
      .select('*')
      .single()

    if (documentError) {
      console.error('Error creating document:', documentError)
      console.error('Document data that failed:', JSON.stringify(documentData, null, 2))
      return NextResponse.json(
        { error: 'Failed to create document', details: documentError.message, code: documentError.code },
        { status: 500 }
      )
    }

    // Insert line items if they exist
    if (lineItems.length > 0) {
      const lineItemsData = lineItems.map((item: any) => ({
        document_id: document.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount,
        tax_rate: '21%', // Default VAT rate
        tax: item.amount * 0.21
      }))

      const { error: itemsError } = await supabase
        .from('document_items')
        .insert(lineItemsData)

      if (itemsError) {
        console.error('Error creating document items:', itemsError)
        // Document was created but items failed, we could delete the document or continue
        console.warn('Document created but line items failed to insert')
      }
    }

    console.log('Document created successfully:', document.id)

    return NextResponse.json(
      { 
        success: true, 
        document_id: document.id,
        message: 'Document created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Unexpected error creating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract the token and create authenticated client
    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Try to get user's tenant_id, but fall back gracefully if tenant system is not set up
    let tenantId = null
    try {
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!tenantError && tenantUser) {
        tenantId = tenantUser.tenant_id
      } else {
        console.log('No tenant system found, using user-based approach')
        tenantId = user.id
      }
    } catch (error) {
      console.log('Tenant lookup failed, falling back to user ID:', error)
      tenantId = user.id
    }

    // Fetch documents for the user's tenant
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select(`
        *,
        document_items (
          id,
          description,
          quantity,
          unit_price,
          amount,
          tax,
          tax_rate
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ documents }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
