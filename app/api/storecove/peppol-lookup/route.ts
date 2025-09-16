import { NextRequest, NextResponse } from 'next/server'
import { PeppolLookupRequest, PeppolLookupResponse } from '@/lib/storecove/types'

export async function POST(request: NextRequest) {
  try {
    const body: PeppolLookupRequest = await request.json()
    
    if (!body.entityNumber) {
      return NextResponse.json({ 
        error: 'Entity number is required' 
      }, { status: 400 })
    }

    // Call the Supabase Edge Function (keeping existing implementation for now)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json({ 
        error: 'Service configuration error' 
      }, { status: 500 })
    }

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    const response = await fetch(`${supabaseUrl}/functions/v1/peppol-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        entityNumber: body.entityNumber
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('PEPPOL lookup failed:', response.status)
      return NextResponse.json({ 
        error: 'PEPPOL lookup service unavailable',
        has_peppol: false 
      }, { status: 503 })
    }

    const peppolData: PeppolLookupResponse = await response.json()
    return NextResponse.json(peppolData)

  } catch (error) {
    console.error('PEPPOL lookup error:', error)
    return NextResponse.json({ 
      error: 'Failed to lookup PEPPOL capability',
      has_peppol: false 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Storecove PEPPOL Lookup API',
    description: 'Check if a company can receive e-invoices via PEPPOL network',
    usage: 'POST with { entityNumber: string }',
    endpoint: '/api/storecove/peppol-lookup',
    method: 'POST',
    timeout: '8 seconds'
  })
} 