# StoreCove Client Integration

This directory contains the integrated StoreCove client for the PeppolSheet application, adapted from the standalone `storecove-node-client` package.

## Files

- `client.ts` - Main StoreCove client class with all API methods
- `types.ts` - TypeScript type definitions for StoreCove API
- `config.ts` - Configuration utilities for environment variables
- `index.ts` - Main export file
- `examples.ts` - Usage examples and common patterns
- `README.md` - This documentation

## Quick Start

### 1. Environment Configuration

Add the following environment variables to your `.env.local`:

```bash
STORECOVE_API_KEY=your_storecove_api_key_here
STORECOVE_BASE_URL=https://api.storecove.com/api/v2  # Optional, defaults to this
STORECOVE_TIMEOUT=30000  # Optional, defaults to 30 seconds
```

### 2. Basic Usage

```typescript
import { StorecoveClient } from '@/lib/storecove'
import { createStorecoveClient } from '@/lib/storecove/config'

// Method 1: Using the config helper (recommended)
const client = createStorecoveClient()

// Method 2: Manual initialization
const client = new StorecoveClient({
  apiKey: process.env.STORECOVE_API_KEY!,
  baseUrl: 'https://api.storecove.com/api/v2',
  timeout: 30000
})
```

### 3. API Routes

The following API routes are available:

- `POST /api/storecove/peppol-lookup` - Check PEPPOL capability
- `GET /api/storecove/legal-entities` - List legal entities
- `POST /api/storecove/legal-entities` - Create legal entity
- `POST /api/storecove/invoices` - Send invoice
- `GET /api/storecove/invoices?legal_entity_id=X` - List invoices
- `POST /api/storecove/invoices/preflight` - Preflight invoice validation

## Features

### Legal Entity Management
- Create, read, update, delete legal entities
- Manage company information and addresses

### PEPPOL Identifier Management
- Create and manage PEPPOL identifiers for legal entities
- Support for various identifier schemes (VAT, EIN, etc.)

### Invoice Management
- Send invoices via PEPPOL network
- Support for multiple document types (invoice, credit note, order, etc.)
- Preflight validation before sending
- Track invoice status

### Document Types Supported
- `invoice` - Standard invoice
- `credit_note` - Credit note for refunds
- `debit_note` - Debit note for additional charges
- `reminder` - Payment reminder
- `order` - Purchase order
- `order_response` - Order confirmation
- `catalogue` - Product catalogue
- `catalogue_pricing_update` - Price updates
- `application_response` - Application responses

### Document Formats Supported
- `ubl` - Universal Business Language (XML)
- `cxml` - Commerce XML
- `edifact` - Electronic Data Interchange
- `x12` - X12 EDI format

## Common Usage Patterns

### 1. Create Legal Entity and Send Invoice

```typescript
import { createStorecoveClient } from '@/lib/storecove/config'

async function sendInvoiceWorkflow() {
  const client = createStorecoveClient()
  
  // Create legal entity
  const legalEntity = await client.createLegalEntity({
    name: 'Your Company',
    country: 'BE',
    city: 'Brussels',
    postal_code: '1000',
    address_line1: 'Your Address'
  })
  
  // Create PEPPOL identifier
  const peppolId = await client.createPeppolIdentifier({
    legal_entity_id: legalEntity.id,
    scheme: 'BE:VAT',
    identifier: 'BE0123456789'
  })
  
  // Send invoice
  const invoice = await client.sendInvoice({
    legal_entity_id: legalEntity.id,
    recipient_peppol_identifier_id: recipientId,
    document_type: 'invoice',
    document_format: 'ubl',
    document: ublXmlContent
  })
  
  return invoice
}
```

### 2. Preflight Validation

```typescript
async function validateBeforeSending(document: string) {
  const client = createStorecoveClient()
  
  const result = await client.preflightInvoice({
    recipient_peppol_identifier_id: recipientId,
    document_type: 'invoice',
    document_format: 'ubl',
    document
  })
  
  if (result.valid) {
    console.log('Document is valid')
  } else {
    console.log('Errors:', result.errors)
    console.log('Warnings:', result.warnings)
  }
  
  return result
}
```

### 3. Error Handling

```typescript
async function robustInvoiceSending() {
  const client = createStorecoveClient()
  
  try {
    const invoice = await client.sendInvoice(invoiceData)
    return { success: true, invoice }
  } catch (error: any) {
    if (error.response?.status === 400) {
      return { success: false, error: 'Invalid invoice data' }
    } else if (error.response?.status === 401) {
      return { success: false, error: 'Invalid API key' }
    } else if (error.response?.status === 429) {
      return { success: false, error: 'Rate limit exceeded' }
    } else {
      return { success: false, error: 'Unknown error occurred' }
    }
  }
}
```

## Integration with Existing Code

The StoreCove client has been integrated with the existing PeppolSheet codebase:

1. **Dependencies**: Added `axios` and `form-data` to `package.json`
2. **Types**: Integrated with existing TypeScript setup
3. **API Routes**: Created RESTful endpoints that use the client
4. **Configuration**: Environment-based configuration following project patterns
5. **Error Handling**: Consistent error handling with existing API routes

## Migration from Standalone Package

If you were using the standalone `storecove-node-client` package:

1. **Import Changes**: 
   ```typescript
   // Old
   import { StorecoveClient } from 'storecove-node-client'
   
   // New
   import { StorecoveClient } from '@/lib/storecove'
   ```

2. **Configuration**: Use the config helper:
   ```typescript
   // Old
   const client = new StorecoveClient({ apiKey: 'your-key' })
   
   // New
   const client = createStorecoveClient()
   ```

3. **API Usage**: All methods remain the same, no changes needed

## Examples

See `examples.ts` for comprehensive usage examples including:
- Basic CRUD operations
- Complete invoice workflow
- Error handling patterns
- Preflight validation
- Multiple document types

## Support

For StoreCove API documentation, visit: https://api.storecove.com/docs

For PeppolSheet-specific issues, refer to the main project documentation.
