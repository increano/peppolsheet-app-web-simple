import { NextRequest, NextResponse } from 'next/server'
import { createStorecoveClient } from '@/lib/storecove/config'
import { SendInvoiceRequest } from '@/lib/storecove/types'

export async function POST(request: NextRequest) {
  try {
    const body: SendInvoiceRequest = await request.json()
    
    if (!body.legal_entity_id || !body.recipient_peppol_identifier_id || !body.document) {
      return NextResponse.json(
        { error: 'legal_entity_id, recipient_peppol_identifier_id, and document are required' },
        { status: 400 }
      )
    }

    const client = createStorecoveClient()
    const invoice = await client.sendInvoice(body)
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const legalEntityId = searchParams.get('legal_entity_id')
    
    if (!legalEntityId) {
      return NextResponse.json(
        { error: 'legal_entity_id parameter is required' },
        { status: 400 }
      )
    }

    const client = createStorecoveClient()
    const invoices = await client.getInvoices(parseInt(legalEntityId, 10))
    
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
