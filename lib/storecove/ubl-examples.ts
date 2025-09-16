/**
 * UBL Conversion Examples
 * 
 * This file demonstrates how to use the UBL conversion utilities
 * to create UBL XML documents from JSON data.
 */

import { UBLGenerator } from './ubl-generator';
import { UBLValidator } from './ubl-validator';
import { UBLHelpers } from './ubl-helpers';
import { InvoiceData, CreditNoteData, OrderData } from './ubl-types';

/**
 * Example 1: Create a simple invoice
 */
export function createSimpleInvoiceExample(): string {
  // Create supplier party
  const supplier = UBLHelpers.createParty(
    'Acme Corporation',
    UBLHelpers.createAddress('BE', 'Brussels', '1000', 'Rue de la Loi 16'),
    { schemeID: 'BE:VAT', value: 'BE0123456789' },
    [{ ID: 'BE0123456789', schemeID: 'BE:VAT' }],
    { name: 'John Doe', telephone: '+32 2 123 45 67', electronicMail: 'john@acme.com' }
  );

  // Create customer party
  const customer = UBLHelpers.createParty(
    'Customer Company Ltd',
    UBLHelpers.createAddress('FR', 'Paris', '75001', '123 Champs-Élysées'),
    { schemeID: 'FR:VAT', value: 'FR98765432101' },
    [{ ID: 'FR98765432101', schemeID: 'FR:VAT' }],
    { name: 'Jane Smith', telephone: '+33 1 23 45 67 89', electronicMail: 'jane@customer.com' }
  );

  // Create tax category
  const standardVAT = UBLHelpers.createTaxCategory('S', 'VAT', 21, 'Standard Rate');

  // Create invoice lines
  const lines = [
    UBLHelpers.createInvoiceLine(
      '1',
      'Professional Services - Web Development',
      10,
      100.00,
      'EUR',
      UBLHelpers.UNIT_CODES.HOUR,
      standardVAT,
      'Web Development Services',
      'SERV-001'
    ),
    UBLHelpers.createInvoiceLine(
      '2',
      'Software License',
      1,
      500.00,
      'EUR',
      UBLHelpers.UNIT_CODES.PIECE,
      standardVAT,
      'Annual Software License',
      'LIC-001'
    )
  ];

  // Create invoice data
  const invoiceData: InvoiceData = UBLHelpers.createBasicInvoice(
    'INV-2024-001',
    '2024-01-15',
    supplier,
    customer,
    lines,
    'EUR',
    '380'
  );

  // Add tax calculation
  const lineTotal = lines.reduce((sum, line) => sum + line.lineExtensionAmount.value, 0);
  const taxAmount = lineTotal * 0.21; // 21% VAT
  
  invoiceData.taxTotal = [
    UBLHelpers.createTaxTotal(taxAmount, 'EUR', [
      {
        taxableAmount: lineTotal,
        taxAmount: taxAmount,
        taxCategory: standardVAT
      }
    ])
  ];

  // Update totals
  invoiceData.legalMonetaryTotal = {
    lineExtensionAmount: UBLHelpers.createMonetaryAmount(lineTotal, 'EUR'),
    taxExclusiveAmount: UBLHelpers.createMonetaryAmount(lineTotal, 'EUR'),
    taxInclusiveAmount: UBLHelpers.createMonetaryAmount(lineTotal + taxAmount, 'EUR'),
    payableAmount: UBLHelpers.createMonetaryAmount(lineTotal + taxAmount, 'EUR')
  };

  // Validate before generating XML
  const validation = UBLValidator.validateInvoiceData(invoiceData);
  if (!validation.valid) {
    console.error('Invoice validation failed:', validation.errors);
    throw new Error('Invalid invoice data');
  }

  if (validation.warnings.length > 0) {
    console.warn('Invoice validation warnings:', validation.warnings);
  }

  // Generate UBL XML
  return UBLGenerator.generateInvoiceXML(invoiceData);
}

/**
 * Example 2: Create a credit note
 */
export function createCreditNoteExample(): string {
  // Create supplier party (same as invoice)
  const supplier = UBLHelpers.createParty(
    'Acme Corporation',
    UBLHelpers.createAddress('BE', 'Brussels', '1000', 'Rue de la Loi 16'),
    { schemeID: 'BE:VAT', value: 'BE0123456789' }
  );

  // Create customer party (same as invoice)
  const customer = UBLHelpers.createParty(
    'Customer Company Ltd',
    UBLHelpers.createAddress('FR', 'Paris', '75001', '123 Champs-Élysées'),
    { schemeID: 'FR:VAT', value: 'FR98765432101' }
  );

  // Create tax category
  const standardVAT = UBLHelpers.createTaxCategory('S', 'VAT', 21, 'Standard Rate');

  // Create credit note lines (partial refund)
  const lines = [
    UBLHelpers.createInvoiceLine(
      '1',
      'Professional Services - Web Development (Partial Refund)',
      2,
      100.00,
      'EUR',
      UBLHelpers.UNIT_CODES.HOUR,
      standardVAT,
      'Web Development Services - Refund',
      'SERV-001'
    )
  ];

  // Create credit note data
  const creditNoteData: CreditNoteData = UBLHelpers.createBasicCreditNote(
    'CN-2024-001',
    '2024-01-20',
    supplier,
    customer,
    lines,
    'INV-2024-001', // Reference to original invoice
    '2024-01-15',   // Original invoice date
    'EUR',
    '381'
  );

  // Add tax calculation
  const lineTotal = lines.reduce((sum, line) => sum + line.lineExtensionAmount.value, 0);
  const taxAmount = lineTotal * 0.21;
  
  creditNoteData.taxTotal = [
    UBLHelpers.createTaxTotal(taxAmount, 'EUR', [
      {
        taxableAmount: lineTotal,
        taxAmount: taxAmount,
        taxCategory: standardVAT
      }
    ])
  ];

  // Update totals
  creditNoteData.legalMonetaryTotal = {
    lineExtensionAmount: UBLHelpers.createMonetaryAmount(lineTotal, 'EUR'),
    taxExclusiveAmount: UBLHelpers.createMonetaryAmount(lineTotal, 'EUR'),
    taxInclusiveAmount: UBLHelpers.createMonetaryAmount(lineTotal + taxAmount, 'EUR'),
    payableAmount: UBLHelpers.createMonetaryAmount(lineTotal + taxAmount, 'EUR')
  };

  // Validate and generate XML
  const validation = UBLValidator.validateCreditNoteData(creditNoteData);
  if (!validation.valid) {
    console.error('Credit note validation failed:', validation.errors);
    throw new Error('Invalid credit note data');
  }

  return UBLGenerator.generateCreditNoteXML(creditNoteData);
}

/**
 * Example 3: Create an order
 */
export function createOrderExample(): string {
  // Create buyer party
  const buyer = UBLHelpers.createParty(
    'Buyer Company Inc',
    UBLHelpers.createAddress('US', 'New York', '10001', '123 Broadway'),
    { schemeID: 'US:EIN', value: '12-3456789' }
  );

  // Create seller party
  const seller = UBLHelpers.createParty(
    'Seller Corporation',
    UBLHelpers.createAddress('CA', 'Toronto', 'M5H 2N2', '456 Bay Street'),
    { schemeID: 'CA:BN', value: '123456789RC0001' }
  );

  // Create order lines
  const lines = [
    {
      ID: '1',
      orderedQuantity: {
        unitCode: UBLHelpers.UNIT_CODES.PIECE,
        value: 10
      },
      lineExtensionAmount: UBLHelpers.createMonetaryAmount(1000.00, 'USD'),
      item: {
        description: 'Office Chairs - Ergonomic Design',
        name: 'Ergonomic Office Chair',
        sellersItemIdentification: {
          ID: 'CHAIR-001'
        }
      },
      price: {
        priceAmount: UBLHelpers.createMonetaryAmount(100.00, 'USD')
      }
    },
    {
      ID: '2',
      orderedQuantity: {
        unitCode: UBLHelpers.UNIT_CODES.PIECE,
        value: 5
      },
      lineExtensionAmount: UBLHelpers.createMonetaryAmount(500.00, 'USD'),
      item: {
        description: 'Office Desks - Standing Height Adjustable',
        name: 'Standing Desk',
        sellersItemIdentification: {
          ID: 'DESK-001'
        }
      },
      price: {
        priceAmount: UBLHelpers.createMonetaryAmount(100.00, 'USD')
      }
    }
  ];

  // Create order data
  const orderData: OrderData = UBLHelpers.createBasicOrder(
    'ORD-2024-001',
    '2024-01-10',
    buyer,
    seller,
    lines,
    'USD',
    '220'
  );

  // Add delivery information
  orderData.delivery = {
    deliveryAddress: UBLHelpers.createAddress('US', 'New York', '10001', '123 Broadway'),
    requestedDeliveryDate: '2024-01-25'
  };

  // Add notes
  orderData.note = [
    'Please deliver during business hours (9 AM - 5 PM)',
    'Contact: John Smith at +1-555-123-4567'
  ];

  // Validate and generate XML
  const validation = UBLValidator.validateOrderData(orderData);
  if (!validation.valid) {
    console.error('Order validation failed:', validation.errors);
    throw new Error('Invalid order data');
  }

  return UBLGenerator.generateOrderXML(orderData);
}

/**
 * Example 4: Complete workflow with StoreCove client
 */
export async function completeInvoiceWorkflowExample() {
  try {
    // 1. Create invoice data
    const invoiceXML = createSimpleInvoiceExample();
    console.log('Generated invoice XML:', invoiceXML.substring(0, 200) + '...');

    // 2. Validate XML structure
    const xmlValidation = UBLValidator.validateXMLStructure(invoiceXML);
    if (!xmlValidation.valid) {
      console.error('XML structure validation failed:', xmlValidation.errors);
      return;
    }

    // 3. Here you would typically send to StoreCove
    // const { createStorecoveClient } = await import('./config');
    // const client = createStorecoveClient();
    // 
    // const invoice = await client.sendInvoice({
    //   legal_entity_id: legalEntityId,
    //   recipient_peppol_identifier_id: recipientId,
    //   document_type: 'invoice',
    //   document_format: 'ubl',
    //   document: invoiceXML
    // });

    console.log('Invoice workflow completed successfully');
    return invoiceXML;

  } catch (error) {
    console.error('Invoice workflow failed:', error);
    throw error;
  }
}

/**
 * Example 5: Error handling and validation
 */
export function validationExample() {
  // Create invalid invoice data
  const invalidInvoiceData: Partial<InvoiceData> = {
    ID: '', // Empty ID - should fail validation
    issueDate: 'invalid-date', // Invalid date format
    documentCurrencyCode: 'INVALID', // Invalid currency code
    // Missing required fields
  };

  // Validate the data
  const validation = UBLValidator.validateInvoiceData(invalidInvoiceData as InvoiceData);
  
  console.log('Validation result:', {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings
  });

  return validation;
}

/**
 * Example 6: Multi-currency invoice
 */
export function createMultiCurrencyInvoiceExample(): string {
  // Create supplier party
  const supplier = UBLHelpers.createParty(
    'Global Services Ltd',
    UBLHelpers.createAddress('GB', 'London', 'SW1A 1AA', '10 Downing Street'),
    { schemeID: 'GB:VAT', value: 'GB123456789' }
  );

  // Create customer party
  const customer = UBLHelpers.createParty(
    'International Client Corp',
    UBLHelpers.createAddress('US', 'New York', '10001', '123 Wall Street'),
    { schemeID: 'US:EIN', value: '12-3456789' }
  );

  // Create invoice lines in different currencies
  const lines = [
    UBLHelpers.createInvoiceLine(
      '1',
      'Consulting Services (USD)',
      40,
      150.00,
      'USD',
      UBLHelpers.UNIT_CODES.HOUR,
      UBLHelpers.TAX_CATEGORIES.VAT_EXEMPT(),
      'Professional Consulting',
      'CONS-001'
    ),
    UBLHelpers.createInvoiceLine(
      '2',
      'Software License (EUR)',
      1,
      2000.00,
      'EUR',
      UBLHelpers.UNIT_CODES.PIECE,
      UBLHelpers.TAX_CATEGORIES.VAT_STANDARD(20),
      'Annual Software License',
      'LIC-001'
    )
  ];

  // Create invoice data
  const invoiceData: InvoiceData = UBLHelpers.createBasicInvoice(
    'INV-2024-MULTI-001',
    '2024-01-15',
    supplier,
    customer,
    lines,
    'USD', // Base currency
    '380'
  );

  // Add notes about multi-currency
  invoiceData.note = [
    'This invoice contains items in multiple currencies',
    'Exchange rates as of invoice date apply',
    'Payment can be made in USD or EUR'
  ];

  // Validate and generate XML
  const validation = UBLValidator.validateInvoiceData(invoiceData);
  if (!validation.valid) {
    console.error('Multi-currency invoice validation failed:', validation.errors);
    throw new Error('Invalid multi-currency invoice data');
  }

  return UBLGenerator.generateInvoiceXML(invoiceData);
}

/**
 * Example 7: Invoice with attachments
 */
export function createInvoiceWithAttachmentsExample(): string {
  // Create basic invoice
  const invoiceXML = createSimpleInvoiceExample();
  
  // Parse the XML to add attachments (simplified example)
  // In a real implementation, you'd use an XML parser
  const attachmentXML = `
  <cac:AdditionalDocumentReference>
    <cbc:ID>ATT-001</cbc:ID>
    <cbc:DocumentType>Supporting Document</cbc:DocumentType>
    <cac:Attachment>
      <cac:EmbeddedDocumentBinaryObject mimeCode="application/pdf" filename="invoice-supporting-doc.pdf">
        ${Buffer.from('PDF content would be base64 encoded here').toString('base64')}
      </cac:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`;

  // Insert attachment before the closing Invoice tag
  return invoiceXML.replace('</Invoice>', `${attachmentXML}\n</Invoice>`);
}
