import { NextRequest, NextResponse } from 'next/server'
import { createStorecoveClient } from '@/lib/storecove/config'
import { 
  UBLGenerator, 
  UBLValidator, 
  UBLHelpers,
  InvoiceData,
  CreditNoteData,
  OrderData 
} from '@/lib/storecove'

interface CreateInvoiceFromJSONRequest {
  legal_entity_id: number
  recipient_peppol_identifier_id: number
  document_type: 'invoice' | 'credit_note' | 'order'
  document_data: InvoiceData | CreditNoteData | OrderData
  send_immediately?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceFromJSONRequest = await request.json()
    
    if (!body.legal_entity_id || !body.recipient_peppol_identifier_id || !body.document_data) {
      return NextResponse.json(
        { error: 'legal_entity_id, recipient_peppol_identifier_id, and document_data are required' },
        { status: 400 }
      )
    }

    let ublXML: string
    let validation: any

    // Generate UBL XML based on document type
    switch (body.document_type) {
      case 'invoice':
        validation = UBLValidator.validateInvoiceData(body.document_data as InvoiceData)
        if (!validation.valid) {
          return NextResponse.json(
            { 
              error: 'Invoice validation failed',
              validation_errors: validation.errors,
              validation_warnings: validation.warnings
            },
            { status: 400 }
          )
        }
        ublXML = UBLGenerator.generateInvoiceXML(body.document_data as InvoiceData)
        break

      case 'credit_note':
        validation = UBLValidator.validateCreditNoteData(body.document_data as CreditNoteData)
        if (!validation.valid) {
          return NextResponse.json(
            { 
              error: 'Credit note validation failed',
              validation_errors: validation.errors,
              validation_warnings: validation.warnings
            },
            { status: 400 }
          )
        }
        ublXML = UBLGenerator.generateCreditNoteXML(body.document_data as CreditNoteData)
        break

      case 'order':
        validation = UBLValidator.validateOrderData(body.document_data as OrderData)
        if (!validation.valid) {
          return NextResponse.json(
            { 
              error: 'Order validation failed',
              validation_errors: validation.errors,
              validation_warnings: validation.warnings
            },
            { status: 400 }
          )
        }
        ublXML = UBLGenerator.generateOrderXML(body.document_data as OrderData)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid document_type. Must be invoice, credit_note, or order' },
          { status: 400 }
        )
    }

    // Validate XML structure
    const xmlValidation = UBLValidator.validateXMLStructure(ublXML)
    if (!xmlValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Generated XML structure validation failed',
          xml_validation_errors: xmlValidation.errors,
          xml_validation_warnings: xmlValidation.warnings
        },
        { status: 500 }
      )
    }

    // If send_immediately is true, send the document via StoreCove
    if (body.send_immediately) {
      try {
        const client = createStorecoveClient()
        const document = await client.sendInvoice({
          legal_entity_id: body.legal_entity_id,
          recipient_peppol_identifier_id: body.recipient_peppol_identifier_id,
          document_type: body.document_type,
          document_format: 'ubl',
          document: ublXML
        })

        return NextResponse.json({
          success: true,
          document,
          ubl_xml: ublXML,
          validation_warnings: validation.warnings,
          xml_validation_warnings: xmlValidation.warnings
        }, { status: 201 })
      } catch (error: any) {
        console.error('Error sending document via StoreCove:', error)
        return NextResponse.json(
          { 
            error: 'Failed to send document via StoreCove',
            storecove_error: error.message,
            ubl_xml: ublXML // Return the XML even if sending failed
          },
          { status: 500 }
        )
      }
    }

    // Return the generated UBL XML without sending
    return NextResponse.json({
      success: true,
      ubl_xml: ublXML,
      validation_warnings: validation.warnings,
      xml_validation_warnings: xmlValidation.warnings,
      message: 'UBL XML generated successfully. Set send_immediately=true to send via StoreCove.'
    })

  } catch (error) {
    console.error('Error creating document from JSON:', error)
    return NextResponse.json(
      { error: 'Failed to create document from JSON' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Create UBL documents from JSON data',
    description: 'Convert JSON data to UBL XML and optionally send via StoreCove',
    usage: {
      method: 'POST',
      endpoint: '/api/storecove/invoices/create-from-json',
      body: {
        legal_entity_id: 'number (required)',
        recipient_peppol_identifier_id: 'number (required)',
        document_type: 'invoice | credit_note | order (required)',
        document_data: 'InvoiceData | CreditNoteData | OrderData (required)',
        send_immediately: 'boolean (optional, default: false)'
      }
    },
    examples: {
      simple_invoice: {
        legal_entity_id: 123,
        recipient_peppol_identifier_id: 456,
        document_type: 'invoice',
        send_immediately: false,
        document_data: {
          ID: 'INV-2024-001',
          issueDate: '2024-01-15',
          documentCurrencyCode: 'EUR',
          invoiceTypeCode: '380',
          accountingSupplierParty: {
            partyName: { name: 'Your Company' },
            postalAddress: {
              country: { identificationCode: 'BE' },
              cityName: 'Brussels',
              postalZone: '1000',
              streetName: 'Your Address'
            }
          },
          accountingCustomerParty: {
            partyName: { name: 'Customer Company' },
            postalAddress: {
              country: { identificationCode: 'FR' },
              cityName: 'Paris',
              postalZone: '75001',
              streetName: 'Customer Address'
            }
          },
          invoiceLine: [
            {
              ID: '1',
              invoicedQuantity: { unitCode: 'C62', value: 1 },
              lineExtensionAmount: { currencyID: 'EUR', value: 100.00 },
              item: {
                description: 'Professional Services',
                classifiedTaxCategory: {
                  ID: 'S',
                  percent: 21,
                  taxScheme: { ID: 'VAT', name: 'Standard Rate' }
                }
              },
              price: { priceAmount: { currencyID: 'EUR', value: 100.00 } }
            }
          ],
          taxTotal: [
            {
              taxAmount: { currencyID: 'EUR', value: 21.00 },
              taxSubtotal: [
                {
                  taxableAmount: { currencyID: 'EUR', value: 100.00 },
                  taxAmount: { currencyID: 'EUR', value: 21.00 },
                  taxCategory: {
                    ID: 'S',
                    percent: 21,
                    taxScheme: { ID: 'VAT', name: 'Standard Rate' }
                  }
                }
              ]
            }
          ],
          legalMonetaryTotal: {
            lineExtensionAmount: { currencyID: 'EUR', value: 100.00 },
            taxExclusiveAmount: { currencyID: 'EUR', value: 100.00 },
            taxInclusiveAmount: { currencyID: 'EUR', value: 121.00 },
            payableAmount: { currencyID: 'EUR', value: 121.00 }
          }
        }
      }
    }
  })
}
