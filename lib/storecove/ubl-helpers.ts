import { 
  InvoiceData, 
  CreditNoteData, 
  OrderData,
  Address, 
  Party, 
  TaxCategory, 
  TaxTotal, 
  InvoiceLine, 
  MonetaryAmount 
} from './ubl-types';

/**
 * Helper utilities for creating UBL documents from common data patterns
 */
export class UBLHelpers {
  
  /**
   * Create a basic address object
   */
  static createAddress(
    countryCode: string,
    city?: string,
    postalCode?: string,
    streetName?: string,
    additionalStreetName?: string,
    countrySubentity?: string,
    countryName?: string
  ): Address {
    return {
      streetName,
      additionalStreetName,
      cityName: city,
      postalZone: postalCode,
      countrySubentity,
      country: {
        identificationCode: countryCode,
        name: countryName
      }
    };
  }

  /**
   * Create a party object
   */
  static createParty(
    name: string,
    address: Address,
    endpointID?: { schemeID: string; value: string },
    partyIdentification?: { ID: string; schemeID?: string }[],
    contact?: { name?: string; telephone?: string; electronicMail?: string }
  ): Party {
    return {
      endpointID,
      partyIdentification,
      partyName: { name },
      postalAddress: address,
      contact
    };
  }

  /**
   * Create a tax category
   */
  static createTaxCategory(
    id: string,
    taxSchemeID: string = 'VAT',
    percent?: number,
    taxSchemeName?: string
  ): TaxCategory {
    return {
      ID: id,
      percent,
      taxScheme: {
        ID: taxSchemeID,
        name: taxSchemeName
      }
    };
  }

  /**
   * Create a monetary amount
   */
  static createMonetaryAmount(value: number, currencyID: string = 'EUR'): MonetaryAmount {
    return {
      currencyID,
      value
    };
  }

  /**
   * Create an invoice line
   */
  static createInvoiceLine(
    id: string,
    description: string,
    quantity: number,
    unitPrice: number,
    currencyID: string = 'EUR',
    unitCode: string = 'C62',
    taxCategory: TaxCategory,
    itemName?: string,
    sellersItemID?: string
  ): InvoiceLine {
    const lineAmount = quantity * unitPrice;
    
    return {
      ID: id,
      invoicedQuantity: {
        unitCode,
        value: quantity
      },
      lineExtensionAmount: this.createMonetaryAmount(lineAmount, currencyID),
      item: {
        description,
        name: itemName,
        sellersItemIdentification: sellersItemID ? { ID: sellersItemID } : undefined,
        classifiedTaxCategory: taxCategory
      },
      price: {
        priceAmount: this.createMonetaryAmount(unitPrice, currencyID)
      }
    };
  }

  /**
   * Create a tax total
   */
  static createTaxTotal(
    taxAmount: number,
    currencyID: string = 'EUR',
    taxSubtotals?: {
      taxableAmount: number;
      taxAmount: number;
      taxCategory: TaxCategory;
    }[]
  ): TaxTotal {
    return {
      taxAmount: this.createMonetaryAmount(taxAmount, currencyID),
      taxSubtotal: taxSubtotals?.map(subtotal => ({
        taxableAmount: this.createMonetaryAmount(subtotal.taxableAmount, currencyID),
        taxAmount: this.createMonetaryAmount(subtotal.taxAmount, currencyID),
        taxCategory: subtotal.taxCategory
      }))
    };
  }

  /**
   * Calculate totals from invoice lines
   */
  static calculateTotals(
    lines: InvoiceLine[],
    currencyID: string = 'EUR'
  ): {
    lineExtensionAmount: number;
    taxExclusiveAmount: number;
    taxInclusiveAmount: number;
    payableAmount: number;
  } {
    const lineExtensionAmount = lines.reduce((sum, line) => sum + line.lineExtensionAmount.value, 0);
    
    // For simplicity, assuming tax is included in line amounts
    // In a real implementation, you'd calculate tax separately
    const taxExclusiveAmount = lineExtensionAmount;
    const taxInclusiveAmount = lineExtensionAmount;
    const payableAmount = lineExtensionAmount;

    return {
      lineExtensionAmount,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableAmount
    };
  }

  /**
   * Create a basic invoice from common data
   */
  static createBasicInvoice(
    invoiceID: string,
    issueDate: string,
    supplier: Party,
    customer: Party,
    lines: InvoiceLine[],
    currencyID: string = 'EUR',
    invoiceTypeCode: string = '380'
  ): InvoiceData {
    const totals = this.calculateTotals(lines, currencyID);
    
    return {
      ID: invoiceID,
      issueDate,
      invoiceTypeCode,
      documentCurrencyCode: currencyID,
      accountingSupplierParty: supplier,
      accountingCustomerParty: customer,
      taxTotal: [
        this.createTaxTotal(0, currencyID) // No tax for basic example
      ],
      legalMonetaryTotal: {
        lineExtensionAmount: this.createMonetaryAmount(totals.lineExtensionAmount, currencyID),
        taxExclusiveAmount: this.createMonetaryAmount(totals.taxExclusiveAmount, currencyID),
        taxInclusiveAmount: this.createMonetaryAmount(totals.taxInclusiveAmount, currencyID),
        payableAmount: this.createMonetaryAmount(totals.payableAmount, currencyID)
      },
      invoiceLine: lines
    };
  }

  /**
   * Create a basic credit note from common data
   */
  static createBasicCreditNote(
    creditNoteID: string,
    issueDate: string,
    supplier: Party,
    customer: Party,
    lines: InvoiceLine[],
    originalInvoiceID: string,
    originalInvoiceDate?: string,
    currencyID: string = 'EUR',
    creditNoteTypeCode: string = '381'
  ): CreditNoteData {
    const totals = this.calculateTotals(lines, currencyID);
    
    return {
      ID: creditNoteID,
      issueDate,
      creditNoteTypeCode,
      documentCurrencyCode: currencyID,
      billingReference: [
        {
          invoiceDocumentReference: {
            ID: originalInvoiceID,
            issueDate: originalInvoiceDate
          }
        }
      ],
      accountingSupplierParty: supplier,
      accountingCustomerParty: customer,
      taxTotal: [
        this.createTaxTotal(0, currencyID) // No tax for basic example
      ],
      legalMonetaryTotal: {
        lineExtensionAmount: this.createMonetaryAmount(totals.lineExtensionAmount, currencyID),
        taxExclusiveAmount: this.createMonetaryAmount(totals.taxExclusiveAmount, currencyID),
        taxInclusiveAmount: this.createMonetaryAmount(totals.taxInclusiveAmount, currencyID),
        payableAmount: this.createMonetaryAmount(totals.payableAmount, currencyID)
      },
      invoiceLine: lines
    };
  }

  /**
   * Create a basic order from common data
   */
  static createBasicOrder(
    orderID: string,
    issueDate: string,
    buyer: Party,
    seller: Party,
    lines: any[],
    currencyID: string = 'EUR',
    orderTypeCode?: string
  ): OrderData {
    const lineExtensionAmount = lines.reduce((sum, line) => sum + line.lineExtensionAmount.value, 0);
    
    return {
      ID: orderID,
      issueDate,
      orderTypeCode,
      documentCurrencyCode: currencyID,
      buyerCustomerParty: buyer,
      sellerSupplierParty: seller,
      orderLine: lines,
      legalMonetaryTotal: {
        lineExtensionAmount: this.createMonetaryAmount(lineExtensionAmount, currencyID),
        taxExclusiveAmount: this.createMonetaryAmount(lineExtensionAmount, currencyID),
        taxInclusiveAmount: this.createMonetaryAmount(lineExtensionAmount, currencyID),
        payableAmount: this.createMonetaryAmount(lineExtensionAmount, currencyID)
      }
    };
  }

  /**
   * Common tax categories for different countries
   */
  static readonly TAX_CATEGORIES = {
    // Standard VAT rates
    VAT_STANDARD: (percent: number) => this.createTaxCategory('S', 'VAT', percent, 'Standard Rate'),
    VAT_REDUCED: (percent: number) => this.createTaxCategory('AA', 'VAT', percent, 'Reduced Rate'),
    VAT_EXEMPT: () => this.createTaxCategory('E', 'VAT', undefined, 'Exempt from VAT'),
    VAT_ZERO: () => this.createTaxCategory('Z', 'VAT', 0, 'Zero Rate'),
    
    // Reverse charge
    VAT_REVERSE_CHARGE: () => this.createTaxCategory('AE', 'VAT', undefined, 'Reverse Charge'),
    
    // Outside scope
    VAT_OUTSIDE_SCOPE: () => this.createTaxCategory('K', 'VAT', undefined, 'VAT Reverse Charge'),
    VAT_OUTSIDE_SCOPE_GOODS: () => this.createTaxCategory('G', 'VAT', undefined, 'Free Text'),
  };

  /**
   * Common unit codes for quantities
   */
  static readonly UNIT_CODES = {
    PIECE: 'C62',
    KILOGRAM: 'KGM',
    LITER: 'LTR',
    METER: 'MTR',
    SQUARE_METER: 'MTK',
    CUBIC_METER: 'MTQ',
    HOUR: 'HUR',
    DAY: 'DAY',
    MONTH: 'MON',
    YEAR: 'ANN',
    PERCENT: 'P1',
    DOZEN: 'DZN',
    GROSS: 'GRO',
    TON: 'TNE'
  };

  /**
   * Common country codes
   */
  static readonly COUNTRY_CODES = {
    BELGIUM: 'BE',
    FRANCE: 'FR',
    GERMANY: 'DE',
    NETHERLANDS: 'NL',
    UNITED_KINGDOM: 'GB',
    UNITED_STATES: 'US',
    CANADA: 'CA',
    AUSTRALIA: 'AU',
    JAPAN: 'JP',
    CHINA: 'CN'
  };

  /**
   * Common currency codes
   */
  static readonly CURRENCY_CODES = {
    EURO: 'EUR',
    US_DOLLAR: 'USD',
    BRITISH_POUND: 'GBP',
    CANADIAN_DOLLAR: 'CAD',
    AUSTRALIAN_DOLLAR: 'AUD',
    JAPANESE_YEN: 'JPY',
    CHINESE_YUAN: 'CNY',
    SWISS_FRANC: 'CHF',
    SWEDISH_KRONA: 'SEK',
    NORWEGIAN_KRONE: 'NOK'
  };
}
