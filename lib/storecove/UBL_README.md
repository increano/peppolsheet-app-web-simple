# UBL XML Conversion Utilities

This module provides comprehensive utilities for converting JSON data to UBL (Universal Business Language) XML documents, specifically designed for e-invoice creation and PEPPOL compliance.

## Features

- **JSON to UBL XML Conversion** - Convert structured JSON data to valid UBL XML
- **Multiple Document Types** - Support for invoices, credit notes, and orders
- **Validation** - Comprehensive validation of document data before XML generation
- **Helper Utilities** - Common patterns and data structures for quick document creation
- **TypeScript Support** - Full type safety and IntelliSense support
- **PEPPOL Compliance** - Generates UBL XML that meets PEPPOL requirements

## Quick Start

### Basic Invoice Creation

```typescript
import { UBLGenerator, UBLHelpers, UBLValidator } from '@/lib/storecove';

// Create supplier party
const supplier = UBLHelpers.createParty(
  'Your Company',
  UBLHelpers.createAddress('BE', 'Brussels', '1000', 'Your Address'),
  { schemeID: 'BE:VAT', value: 'BE0123456789' }
);

// Create customer party
const customer = UBLHelpers.createParty(
  'Customer Company',
  UBLHelpers.createAddress('FR', 'Paris', '75001', 'Customer Address'),
  { schemeID: 'FR:VAT', value: 'FR98765432101' }
);

// Create invoice lines
const lines = [
  UBLHelpers.createInvoiceLine(
    '1',
    'Professional Services',
    10,
    100.00,
    'EUR',
    UBLHelpers.UNIT_CODES.HOUR,
    UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(21)
  )
];

// Create invoice data
const invoiceData = UBLHelpers.createBasicInvoice(
  'INV-2024-001',
  '2024-01-15',
  supplier,
  customer,
  lines
);

// Validate and generate XML
const validation = UBLValidator.validateInvoiceData(invoiceData);
if (validation.valid) {
  const ublXML = UBLGenerator.generateInvoiceXML(invoiceData);
  console.log('Generated UBL XML:', ublXML);
} else {
  console.error('Validation errors:', validation.errors);
}
```

## Document Types

### 1. Invoices

```typescript
import { UBLGenerator, InvoiceData } from '@/lib/storecove';

const invoiceData: InvoiceData = {
  ID: 'INV-2024-001',
  issueDate: '2024-01-15',
  documentCurrencyCode: 'EUR',
  invoiceTypeCode: '380', // Standard invoice
  accountingSupplierParty: supplier,
  accountingCustomerParty: customer,
  invoiceLine: lines,
  taxTotal: taxTotals,
  legalMonetaryTotal: totals
};

const ublXML = UBLGenerator.generateInvoiceXML(invoiceData);
```

### 2. Credit Notes

```typescript
import { UBLGenerator, CreditNoteData } from '@/lib/storecove';

const creditNoteData: CreditNoteData = {
  ID: 'CN-2024-001',
  issueDate: '2024-01-20',
  documentCurrencyCode: 'EUR',
  creditNoteTypeCode: '381', // Credit note
  billingReference: [{
    invoiceDocumentReference: {
      ID: 'INV-2024-001',
      issueDate: '2024-01-15'
    }
  }],
  accountingSupplierParty: supplier,
  accountingCustomerParty: customer,
  invoiceLine: lines,
  taxTotal: taxTotals,
  legalMonetaryTotal: totals
};

const ublXML = UBLGenerator.generateCreditNoteXML(creditNoteData);
```

### 3. Orders

```typescript
import { UBLGenerator, OrderData } from '@/lib/storecove';

const orderData: OrderData = {
  ID: 'ORD-2024-001',
  issueDate: '2024-01-10',
  documentCurrencyCode: 'USD',
  orderTypeCode: '220', // Standard order
  buyerCustomerParty: buyer,
  sellerSupplierParty: seller,
  orderLine: orderLines,
  legalMonetaryTotal: totals
};

const ublXML = UBLGenerator.generateOrderXML(orderData);
```

## Helper Utilities

### Creating Parties

```typescript
import { UBLHelpers } from '@/lib/storecove';

// Create address
const address = UBLHelpers.createAddress(
  'BE',           // Country code
  'Brussels',     // City
  '1000',         // Postal code
  'Rue de la Loi 16', // Street name
  'Floor 5',      // Additional street name (optional)
  'Brussels',     // Country subentity (optional)
  'Belgium'       // Country name (optional)
);

// Create party
const party = UBLHelpers.createParty(
  'Company Name',
  address,
  { schemeID: 'BE:VAT', value: 'BE0123456789' }, // PEPPOL identifier
  [{ ID: 'BE0123456789', schemeID: 'BE:VAT' }],  // Party identification
  { 
    name: 'Contact Person',
    telephone: '+32 2 123 45 67',
    electronicMail: 'contact@company.com'
  }
);
```

### Creating Invoice Lines

```typescript
import { UBLHelpers } from '@/lib/storecove';

const line = UBLHelpers.createInvoiceLine(
  '1',                                    // Line ID
  'Professional Services',               // Description
  10,                                     // Quantity
  100.00,                                // Unit price
  'EUR',                                 // Currency
  UBLHelpers.UNIT_CODES.HOUR,            // Unit code
  UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(21), // Tax category
  'Web Development Services',            // Item name (optional)
  'SERV-001'                            // Seller's item ID (optional)
);
```

### Tax Categories

```typescript
import { UBLHelpers } from '@/lib/storecove';

// Standard VAT rates
const standardVAT = UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(21); // 21% VAT
const reducedVAT = UBLHelpers.TAX_CATEGORIES.VAT_REDUCED(6);    // 6% VAT
const exemptVAT = UBLHelpers.TAX_CATEGORIES.VAT_EXEMPT();       // Exempt
const zeroVAT = UBLHelpers.TAX_CATEGORIES.VAT_ZERO();           // 0% VAT

// Reverse charge
const reverseCharge = UBLHelpers.TAX_CATEGORIES.VAT_REVERSE_CHARGE();
```

### Unit Codes

```typescript
import { UBLHelpers } from '@/lib/storecove';

const unitCodes = {
  piece: UBLHelpers.UNIT_CODES.PIECE,           // C62
  kilogram: UBLHelpers.UNIT_CODES.KILOGRAM,     // KGM
  liter: UBLHelpers.UNIT_CODES.LITER,           // LTR
  meter: UBLHelpers.UNIT_CODES.METER,           // MTR
  hour: UBLHelpers.UNIT_CODES.HOUR,             // HUR
  day: UBLHelpers.UNIT_CODES.DAY,               // DAY
  month: UBLHelpers.UNIT_CODES.MONTH,           // MON
  year: UBLHelpers.UNIT_CODES.YEAR,             // ANN
  percent: UBLHelpers.UNIT_CODES.PERCENT,       // P1
  dozen: UBLHelpers.UNIT_CODES.DOZEN,           // DZN
  gross: UBLHelpers.UNIT_CODES.GROSS,           // GRO
  ton: UBLHelpers.UNIT_CODES.TON                // TNE
};
```

## Validation

### Document Validation

```typescript
import { UBLValidator } from '@/lib/storecove';

// Validate invoice data
const invoiceValidation = UBLValidator.validateInvoiceData(invoiceData);
if (!invoiceValidation.valid) {
  console.error('Validation errors:', invoiceValidation.errors);
  console.warn('Validation warnings:', invoiceValidation.warnings);
}

// Validate credit note data
const creditNoteValidation = UBLValidator.validateCreditNoteData(creditNoteData);

// Validate order data
const orderValidation = UBLValidator.validateOrderData(orderData);

// Validate XML structure
const xmlValidation = UBLValidator.validateXMLStructure(ublXML);
```

### Validation Result

```typescript
interface ValidationResult {
  valid: boolean;      // Whether the document is valid
  errors: string[];    // Critical errors that prevent document creation
  warnings: string[];  // Warnings that should be addressed
}
```

## Integration with StoreCove Client

### Complete Workflow

```typescript
import { 
  createStorecoveClient, 
  UBLGenerator, 
  UBLHelpers, 
  UBLValidator 
} from '@/lib/storecove';

async function sendInvoiceWorkflow() {
  try {
    // 1. Create invoice data
    const invoiceData = UBLHelpers.createBasicInvoice(/* ... */);
    
    // 2. Validate data
    const validation = UBLValidator.validateInvoiceData(invoiceData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // 3. Generate UBL XML
    const ublXML = UBLGenerator.generateInvoiceXML(invoiceData);
    
    // 4. Send via StoreCove
    const client = createStorecoveClient();
    const invoice = await client.sendInvoice({
      legal_entity_id: legalEntityId,
      recipient_peppol_identifier_id: recipientId,
      document_type: 'invoice',
      document_format: 'ubl',
      document: ublXML
    });
    
    console.log('Invoice sent successfully:', invoice);
    return invoice;
    
  } catch (error) {
    console.error('Invoice workflow failed:', error);
    throw error;
  }
}
```

## Advanced Features

### Multi-Currency Invoices

```typescript
// Create lines in different currencies
const usdLine = UBLHelpers.createInvoiceLine(
  '1', 'US Services', 10, 100.00, 'USD', 
  UBLHelpers.UNIT_CODES.HOUR, UBLHelpers.TAX_CATEGORIES.VAT_EXEMPT()
);

const eurLine = UBLHelpers.createInvoiceLine(
  '2', 'EU Services', 5, 80.00, 'EUR',
  UBLHelpers.UNIT_CODES.HOUR, UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(21)
);

// Base currency should be specified in documentCurrencyCode
const invoiceData = UBLHelpers.createBasicInvoice(
  'INV-2024-001',
  '2024-01-15',
  supplier,
  customer,
  [usdLine, eurLine],
  'USD' // Base currency
);
```

### Invoices with Attachments

```typescript
const invoiceData: InvoiceData = {
  // ... other fields
  additionalDocumentReference: [
    {
      ID: 'ATT-001',
      documentType: 'Supporting Document',
      attachment: {
        embeddedDocumentBinaryObject: {
          mimeCode: 'application/pdf',
          encodingCode: 'Base64',
          filename: 'supporting-document.pdf',
          value: base64EncodedContent
        }
      }
    }
  ]
};
```

### Complex Tax Calculations

```typescript
// Create tax subtotals for different tax rates
const taxTotal = UBLHelpers.createTaxTotal(
  126.00, // Total tax amount
  'EUR',
  [
    {
      taxableAmount: 500.00,
      taxAmount: 105.00,
      taxCategory: UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(21)
    },
    {
      taxableAmount: 100.00,
      taxAmount: 21.00,
      taxCategory: UBLHelpers.TAX_CATEGORIES.VAT_REDUCED(21)
    }
  ]
);
```

## Error Handling

```typescript
import { UBLValidator, ValidationResult } from '@/lib/storecove';

function handleValidationResult(result: ValidationResult) {
  if (!result.valid) {
    // Handle critical errors
    result.errors.forEach(error => {
      console.error(`Error: ${error}`);
    });
    
    // Don't proceed with document creation
    return false;
  }
  
  // Handle warnings
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(`Warning: ${warning}`);
    });
  }
  
  return true;
}
```

## Examples

See `ubl-examples.ts` for comprehensive examples including:

- Simple invoice creation
- Credit note generation
- Order processing
- Multi-currency invoices
- Invoices with attachments
- Complete workflow examples
- Error handling patterns

## Best Practices

1. **Always validate** document data before generating XML
2. **Use helper utilities** for common patterns instead of manual object creation
3. **Handle validation warnings** appropriately for your use case
4. **Test with real data** to ensure PEPPOL compliance
5. **Use proper tax categories** for your jurisdiction
6. **Include all required fields** for your document type
7. **Validate XML structure** after generation for complex documents

## PEPPOL Compliance

The generated UBL XML follows PEPPOL requirements:

- Proper UBL 2.1 schema compliance
- Required namespace declarations
- Correct element structure and hierarchy
- Valid data types and formats
- Proper party identification schemes
- Tax calculation compliance

## Support

For UBL-specific questions, refer to:
- [UBL 2.1 Specification](http://docs.oasis-open.org/ubl/os-UBL-2.1/)
- [PEPPOL BIS Documentation](https://docs.peppol.eu/)
- [StoreCove API Documentation](https://api.storecove.com/docs)
