import { NextRequest, NextResponse } from 'next/server'
import { createStorecoveClient } from '@/lib/storecove/config'
import { SendInvoiceRequest } from '@/lib/storecove/types'

export async function POST(request: NextRequest) {
  try {
    const body: Omit<SendInvoiceRequest, 'legal_entity_id'> = await request.json()
    
    if (!body.recipient_peppol_identifier_id || !body.document) {
      return NextResponse.json(
        { error: 'recipient_peppol_identifier_id and document are required' },
        { status: 400 }
      )
    }

    const client = createStorecoveClient()
    const preflightResult = await client.preflightInvoice(body)
    
    return NextResponse.json(preflightResult)
  } catch (error) {
    console.error('Error preflighting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to preflight invoice' },
      { status: 500 }
    )
  }
}
