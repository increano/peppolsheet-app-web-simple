// JSON interfaces for UBL document creation

export interface Address {
  streetName?: string;
  additionalStreetName?: string;
  cityName?: string;
  postalZone?: string;
  countrySubentity?: string;
  country: {
    identificationCode: string; // ISO 3166-1 alpha-2 country code
    name?: string;
  };
}

export interface Party {
  endpointID?: {
    schemeID: string; // e.g., "BE:VAT", "GLN", "DUNS"
    value: string;
  };
  partyIdentification?: {
    ID: string;
    schemeID?: string;
  }[];
  partyName: {
    name: string;
  };
  postalAddress: Address;
  contact?: {
    name?: string;
    telephone?: string;
    electronicMail?: string;
  };
}

export interface TaxCategory {
  ID: string; // e.g., "S", "E", "Z", "AE", "K", "G"
  percent?: number;
  taxScheme: {
    ID: string; // e.g., "VAT", "GST"
    name?: string;
  };
}

export interface TaxTotal {
  taxAmount: {
    currencyID: string;
    value: number;
  };
  taxSubtotal?: {
    taxableAmount: {
      currencyID: string;
      value: number;
    };
    taxAmount: {
      currencyID: string;
      value: number;
    };
    taxCategory: TaxCategory;
  }[];
}

export interface MonetaryAmount {
  currencyID: string;
  value: number;
}

export interface InvoiceLine {
  ID: string;
  invoicedQuantity: {
    unitCode: string; // e.g., "C62", "KGM", "LTR"
    value: number;
  };
  lineExtensionAmount: MonetaryAmount;
  item: {
    description: string;
    name?: string;
    sellersItemIdentification?: {
      ID: string;
    };
    classifiedTaxCategory: TaxCategory;
  };
  price: {
    priceAmount: MonetaryAmount;
  };
}

export interface InvoiceData {
  // Document identification
  ID: string;
  issueDate: string; // YYYY-MM-DD format
  issueTime?: string; // HH:MM:SS format
  invoiceTypeCode?: string; // e.g., "380", "381", "383"
  documentCurrencyCode: string; // ISO 4217 currency code
  
  // Additional document references
  additionalDocumentReference?: {
    ID: string;
    documentType?: string;
    attachment?: {
      embeddedDocumentBinaryObject: {
        mimeCode: string;
        encodingCode?: string;
        filename?: string;
        value: string; // Base64 encoded content
      };
    };
  }[];
  
  // Contract and order references
  contractDocumentReference?: {
    ID: string;
    documentType?: string;
  }[];
  orderReference?: {
    ID: string;
    issueDate?: string;
  }[];
  
  // Parties
  accountingSupplierParty: Party;
  accountingCustomerParty: Party;
  delivery?: {
    deliveryAddress?: Address;
    deliveryDate?: string;
  };
  
  // Payment terms
  paymentTerms?: {
    note?: string;
    paymentDueDate?: string;
  }[];
  
  // Tax totals
  taxTotal: TaxTotal[];
  
  // Legal monetary totals
  legalMonetaryTotal: {
    lineExtensionAmount: MonetaryAmount;
    taxExclusiveAmount: MonetaryAmount;
    taxInclusiveAmount: MonetaryAmount;
    prepaidAmount?: MonetaryAmount;
    payableAmount: MonetaryAmount;
  };
  
  // Invoice lines
  invoiceLine: InvoiceLine[];
  
  // Additional information
  note?: string[];
  buyerReference?: string;
  accountingCost?: string;
}

// Credit Note specific interface
export interface CreditNoteData extends Omit<InvoiceData, 'invoiceTypeCode'> {
  creditNoteTypeCode?: string; // e.g., "381", "383"
  billingReference?: {
    invoiceDocumentReference: {
      ID: string;
      issueDate?: string;
    };
  }[];
}

// Order specific interface
export interface OrderData {
  ID: string;
  issueDate: string;
  issueTime?: string;
  orderTypeCode?: string;
  documentCurrencyCode: string;
  
  buyerCustomerParty: Party;
  sellerSupplierParty: Party;
  
  delivery?: {
    deliveryAddress?: Address;
    requestedDeliveryDate?: string;
  };
  
  orderLine: {
    ID: string;
    orderedQuantity: {
      unitCode: string;
      value: number;
    };
    lineExtensionAmount: MonetaryAmount;
    item: {
      description: string;
      name?: string;
      sellersItemIdentification?: {
        ID: string;
      };
    };
    price: {
      priceAmount: MonetaryAmount;
    };
  }[];
  
  legalMonetaryTotal: {
    lineExtensionAmount: MonetaryAmount;
    taxExclusiveAmount: MonetaryAmount;
    taxInclusiveAmount: MonetaryAmount;
    payableAmount: MonetaryAmount;
  };
  
  note?: string[];
  buyerReference?: string;
}

// Common document types
export type DocumentData = InvoiceData | CreditNoteData | OrderData;

// UBL namespace constants
export const UBL_NAMESPACES = {
  'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  'xmlns:ccts': 'urn:un:unece:uncefact:documentation:2',
  'xmlns:qdt': 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
  'xmlns:udt': 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2'
} as const;
