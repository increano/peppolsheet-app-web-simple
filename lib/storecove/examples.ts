/**
 * StoreCove Client Usage Examples
 * 
 * This file demonstrates how to use the integrated StoreCove client
 * in your PeppolSheet application.
 */

import { StorecoveClient, CreateLegalEntityRequest, SendInvoiceRequest } from './index'

// Example 1: Basic client initialization
export function createExampleClient(): StorecoveClient {
  return new StorecoveClient({
    apiKey: process.env.STORECOVE_API_KEY!,
    baseUrl: 'https://api.storecove.com/api/v2',
    timeout: 30000
  })
}

// Example 2: Create a legal entity
export async function createLegalEntityExample() {
  const client = createExampleClient()
  
  const legalEntityData: CreateLegalEntityRequest = {
    name: 'PeppolSheet Demo Company',
    country: 'BE',
    city: 'Brussels',
    postal_code: '1000',
    address_line1: 'Rue de la Loi 16'
  }

  try {
    const legalEntity = await client.createLegalEntity(legalEntityData)
    console.log('Created legal entity:', legalEntity)
    return legalEntity
  } catch (error) {
    console.error('Failed to create legal entity:', error)
    throw error
  }
}

// Example 3: Send an invoice
export async function sendInvoiceExample(legalEntityId: number, recipientId: number) {
  const client = createExampleClient()
  
  const invoiceData: SendInvoiceRequest = {
    legal_entity_id: legalEntityId,
    recipient_peppol_identifier_id: recipientId,
    document_type: 'invoice',
    document_format: 'ubl',
    document: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- UBL Invoice content here -->
</Invoice>`
  }

  try {
    const invoice = await client.sendInvoice(invoiceData)
    console.log('Sent invoice:', invoice)
    return invoice
  } catch (error) {
    console.error('Failed to send invoice:', error)
    throw error
  }
}

// Example 4: Preflight check before sending
export async function preflightInvoiceExample(recipientId: number, document: string) {
  const client = createExampleClient()
  
  try {
    const preflightResult = await client.preflightInvoice({
      recipient_peppol_identifier_id: recipientId,
      document_type: 'invoice',
      document_format: 'ubl',
      document
    })
    
    console.log('Preflight result:', preflightResult)
    
    if (preflightResult.valid) {
      console.log('Document is valid and ready to send')
    } else {
      console.log('Document has errors:', preflightResult.errors)
      console.log('Document has warnings:', preflightResult.warnings)
    }
    
    return preflightResult
  } catch (error) {
    console.error('Failed to preflight invoice:', error)
    throw error
  }
}

// Example 5: Complete workflow
export async function completeInvoiceWorkflow() {
  try {
    const client = createExampleClient()
    
    // 1. Create legal entity
    const legalEntity = await createLegalEntityExample()
    
    // 2. Create PEPPOL identifier for the legal entity
    const peppolIdentifier = await client.createPeppolIdentifier({
      legal_entity_id: legalEntity.id,
      scheme: 'BE:VAT',
      identifier: 'BE0123456789'
    })
    
    // 3. Get recipient PEPPOL identifier (assuming it exists)
    const recipientIdentifier = await client.getPeppolIdentifier(123) // Replace with actual ID
    
    // 4. Preflight the invoice
    const ublDocument = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- Your UBL invoice content -->
</Invoice>`
    
    const preflightResult = await preflightInvoiceExample(recipientIdentifier.id, ublDocument)
    
    // 5. Send the invoice if preflight is successful
    if (preflightResult.valid) {
      const invoice = await sendInvoiceExample(legalEntity.id, recipientIdentifier.id)
      console.log('Invoice sent successfully:', invoice)
      return invoice
    } else {
      throw new Error('Invoice failed preflight validation')
    }
    
  } catch (error) {
    console.error('Complete workflow failed:', error)
    throw error
  }
}

// Example 6: Error handling
export async function errorHandlingExample() {
  const client = createExampleClient()
  
  try {
    // This will fail if the legal entity doesn't exist
    const legalEntity = await client.getLegalEntity(99999)
    return legalEntity
  } catch (error: any) {
    if (error.response) {
      // API error response
      console.error('API Error:', error.response.status, error.response.data)
      
      if (error.response.status === 404) {
        console.log('Legal entity not found')
      } else if (error.response.status === 401) {
        console.log('Unauthorized - check your API key')
      } else if (error.response.status === 429) {
        console.log('Rate limit exceeded')
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.message)
    } else {
      // Other error
      console.error('Error:', error.message)
    }
    
    throw error
  }
}
