import { InvoiceData, CreditNoteData, OrderData } from './ubl-types';

/**
 * UBL Document Validator
 * Provides validation for UBL document data before XML generation
 */
export class UBLValidator {
  
  /**
   * Validate invoice data
   */
  static validateInvoiceData(data: InvoiceData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.ID) errors.push('Invoice ID is required');
    if (!data.issueDate) errors.push('Issue date is required');
    if (!data.documentCurrencyCode) errors.push('Document currency code is required');
    if (!data.accountingSupplierParty) errors.push('Accounting supplier party is required');
    if (!data.accountingCustomerParty) errors.push('Accounting customer party is required');
    if (!data.legalMonetaryTotal) errors.push('Legal monetary total is required');
    if (!data.invoiceLine || data.invoiceLine.length === 0) errors.push('At least one invoice line is required');

    // Date format validation
    if (data.issueDate && !this.isValidDate(data.issueDate)) {
      errors.push('Issue date must be in YYYY-MM-DD format');
    }

    // Currency code validation
    if (data.documentCurrencyCode && !this.isValidCurrencyCode(data.documentCurrencyCode)) {
      warnings.push('Document currency code should be a valid ISO 4217 code');
    }

    // Party validation
    if (data.accountingSupplierParty) {
      const supplierValidation = this.validateParty(data.accountingSupplierParty, 'Supplier');
      errors.push(...supplierValidation.errors);
      warnings.push(...supplierValidation.warnings);
    }

    if (data.accountingCustomerParty) {
      const customerValidation = this.validateParty(data.accountingCustomerParty, 'Customer');
      errors.push(...customerValidation.errors);
      warnings.push(...customerValidation.warnings);
    }

    // Invoice lines validation
    if (data.invoiceLine) {
      data.invoiceLine.forEach((line, index) => {
        const lineValidation = this.validateInvoiceLine(line, index);
        errors.push(...lineValidation.errors);
        warnings.push(...lineValidation.warnings);
      });
    }

    // Tax total validation
    if (data.taxTotal) {
      data.taxTotal.forEach((taxTotal, index) => {
        const taxValidation = this.validateTaxTotal(taxTotal, index);
        errors.push(...taxValidation.errors);
        warnings.push(...taxValidation.warnings);
      });
    }

    // Monetary total validation
    if (data.legalMonetaryTotal) {
      const totalValidation = this.validateMonetaryTotal(data.legalMonetaryTotal);
      errors.push(...totalValidation.errors);
      warnings.push(...totalValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate credit note data
   */
  static validateCreditNoteData(data: CreditNoteData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Use invoice validation as base
    const invoiceValidation = this.validateInvoiceData(data as InvoiceData);
    errors.push(...invoiceValidation.errors);
    warnings.push(...invoiceValidation.warnings);

    // Credit note specific validation
    if (!data.billingReference || data.billingReference.length === 0) {
      warnings.push('Credit note should reference the original invoice');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate order data
   */
  static validateOrderData(data: OrderData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.ID) errors.push('Order ID is required');
    if (!data.issueDate) errors.push('Issue date is required');
    if (!data.documentCurrencyCode) errors.push('Document currency code is required');
    if (!data.buyerCustomerParty) errors.push('Buyer customer party is required');
    if (!data.sellerSupplierParty) errors.push('Seller supplier party is required');
    if (!data.legalMonetaryTotal) errors.push('Legal monetary total is required');
    if (!data.orderLine || data.orderLine.length === 0) errors.push('At least one order line is required');

    // Date format validation
    if (data.issueDate && !this.isValidDate(data.issueDate)) {
      errors.push('Issue date must be in YYYY-MM-DD format');
    }

    // Currency code validation
    if (data.documentCurrencyCode && !this.isValidCurrencyCode(data.documentCurrencyCode)) {
      warnings.push('Document currency code should be a valid ISO 4217 code');
    }

    // Party validation
    if (data.buyerCustomerParty) {
      const buyerValidation = this.validateParty(data.buyerCustomerParty, 'Buyer');
      errors.push(...buyerValidation.errors);
      warnings.push(...buyerValidation.warnings);
    }

    if (data.sellerSupplierParty) {
      const sellerValidation = this.validateParty(data.sellerSupplierParty, 'Seller');
      errors.push(...sellerValidation.errors);
      warnings.push(...sellerValidation.warnings);
    }

    // Order lines validation
    if (data.orderLine) {
      data.orderLine.forEach((line, index) => {
        const lineValidation = this.validateOrderLine(line, index);
        errors.push(...lineValidation.errors);
        warnings.push(...lineValidation.warnings);
      });
    }

    // Monetary total validation
    if (data.legalMonetaryTotal) {
      const totalValidation = this.validateMonetaryTotal(data.legalMonetaryTotal);
      errors.push(...totalValidation.errors);
      warnings.push(...totalValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate party data
   */
  private static validateParty(party: any, partyType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!party.partyName?.name) {
      errors.push(`${partyType} party name is required`);
    }

    if (!party.postalAddress) {
      errors.push(`${partyType} postal address is required`);
    } else {
      if (!party.postalAddress.country?.identificationCode) {
        errors.push(`${partyType} country identification code is required`);
      } else if (!this.isValidCountryCode(party.postalAddress.country.identificationCode)) {
        warnings.push(`${partyType} country code should be a valid ISO 3166-1 alpha-2 code`);
      }
    }

    if (party.endpointID && (!party.endpointID.schemeID || !party.endpointID.value)) {
      warnings.push(`${partyType} endpoint ID should have both scheme ID and value`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate invoice line data
   */
  private static validateInvoiceLine(line: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!line.ID) errors.push(`Invoice line ${index + 1}: ID is required`);
    if (!line.invoicedQuantity) errors.push(`Invoice line ${index + 1}: Invoiced quantity is required`);
    if (!line.lineExtensionAmount) errors.push(`Invoice line ${index + 1}: Line extension amount is required`);
    if (!line.item) errors.push(`Invoice line ${index + 1}: Item is required`);
    if (!line.price) errors.push(`Invoice line ${index + 1}: Price is required`);

    if (line.invoicedQuantity) {
      if (line.invoicedQuantity.value <= 0) {
        errors.push(`Invoice line ${index + 1}: Invoiced quantity must be greater than 0`);
      }
      if (!line.invoicedQuantity.unitCode) {
        warnings.push(`Invoice line ${index + 1}: Unit code is recommended`);
      }
    }

    if (line.lineExtensionAmount) {
      if (line.lineExtensionAmount.value < 0) {
        errors.push(`Invoice line ${index + 1}: Line extension amount cannot be negative`);
      }
    }

    if (line.item) {
      if (!line.item.description) {
        errors.push(`Invoice line ${index + 1}: Item description is required`);
      }
      if (!line.item.classifiedTaxCategory) {
        warnings.push(`Invoice line ${index + 1}: Tax category is recommended`);
      }
    }

    if (line.price && line.price.priceAmount) {
      if (line.price.priceAmount.value < 0) {
        errors.push(`Invoice line ${index + 1}: Price amount cannot be negative`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate order line data
   */
  private static validateOrderLine(line: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!line.ID) errors.push(`Order line ${index + 1}: ID is required`);
    if (!line.orderedQuantity) errors.push(`Order line ${index + 1}: Ordered quantity is required`);
    if (!line.lineExtensionAmount) errors.push(`Order line ${index + 1}: Line extension amount is required`);
    if (!line.item) errors.push(`Order line ${index + 1}: Item is required`);
    if (!line.price) errors.push(`Order line ${index + 1}: Price is required`);

    if (line.orderedQuantity) {
      if (line.orderedQuantity.value <= 0) {
        errors.push(`Order line ${index + 1}: Ordered quantity must be greater than 0`);
      }
      if (!line.orderedQuantity.unitCode) {
        warnings.push(`Order line ${index + 1}: Unit code is recommended`);
      }
    }

    if (line.lineExtensionAmount) {
      if (line.lineExtensionAmount.value < 0) {
        errors.push(`Order line ${index + 1}: Line extension amount cannot be negative`);
      }
    }

    if (line.item && !line.item.description) {
      errors.push(`Order line ${index + 1}: Item description is required`);
    }

    if (line.price && line.price.priceAmount) {
      if (line.price.priceAmount.value < 0) {
        errors.push(`Order line ${index + 1}: Price amount cannot be negative`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate tax total data
   */
  private static validateTaxTotal(taxTotal: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!taxTotal.taxAmount) {
      errors.push(`Tax total ${index + 1}: Tax amount is required`);
    } else {
      if (taxTotal.taxAmount.value < 0) {
        errors.push(`Tax total ${index + 1}: Tax amount cannot be negative`);
      }
      if (!taxTotal.taxAmount.currencyID) {
        warnings.push(`Tax total ${index + 1}: Currency ID is recommended`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate monetary total data
   */
  private static validateMonetaryTotal(total: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredFields = ['lineExtensionAmount', 'taxExclusiveAmount', 'taxInclusiveAmount', 'payableAmount'];
    
    requiredFields.forEach(field => {
      if (!total[field]) {
        errors.push(`Legal monetary total: ${field} is required`);
      } else {
        if (total[field].value < 0) {
          errors.push(`Legal monetary total: ${field} cannot be negative`);
        }
        if (!total[field].currencyID) {
          warnings.push(`Legal monetary total: ${field} currency ID is recommended`);
        }
      }
    });

    // Validate that payable amount is not negative
    if (total.payableAmount && total.payableAmount.value < 0) {
      errors.push('Legal monetary total: Payable amount cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private static isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate currency code (basic ISO 4217 check)
   */
  private static isValidCurrencyCode(currencyCode: string): boolean {
    const validCurrencies = [
      'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SEK', 'NOK',
      'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'BRL', 'INR'
    ];
    return validCurrencies.includes(currencyCode.toUpperCase());
  }

  /**
   * Validate country code (basic ISO 3166-1 alpha-2 check)
   */
  private static isValidCountryCode(countryCode: string): boolean {
    const validCountries = [
      'BE', 'FR', 'DE', 'NL', 'GB', 'US', 'CA', 'AU', 'JP', 'CN',
      'IT', 'ES', 'PT', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL'
    ];
    return validCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Validate XML structure (basic check)
   */
  static validateXMLStructure(xmlString: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic XML structure checks
    if (!xmlString.includes('<?xml')) {
      errors.push('XML declaration is missing');
    }

    if (!xmlString.includes('<Invoice') && !xmlString.includes('<CreditNote') && !xmlString.includes('<Order')) {
      errors.push('Document root element is missing or invalid');
    }

    // Check for unclosed tags (basic check)
    const openTags = xmlString.match(/<[^/][^>]*>/g) || [];
    const closeTags = xmlString.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      warnings.push('Potential unclosed XML tags detected');
    }

    // Check for required UBL namespaces
    if (!xmlString.includes('urn:oasis:names:specification:ubl:schema:xsd')) {
      warnings.push('UBL namespace declarations may be missing');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
