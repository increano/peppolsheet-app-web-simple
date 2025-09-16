import { 
  InvoiceData, 
  CreditNoteData, 
  OrderData, 
  DocumentData,
  UBL_NAMESPACES,
  Address,
  Party,
  TaxTotal,
  InvoiceLine,
  MonetaryAmount
} from './ubl-types';

/**
 * UBL XML Generator for converting JSON data to UBL XML documents
 */
export class UBLGenerator {
  private static readonly UBL_NAMESPACES = UBL_NAMESPACES;

  /**
   * Generate UBL Invoice XML from JSON data
   */
  static generateInvoiceXML(invoiceData: InvoiceData): string {
    const namespaces = this.buildNamespaceDeclarations();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${namespaces}>
  ${this.generateDocumentIdentification(invoiceData)}
  ${this.generateAdditionalDocumentReferences(invoiceData.additionalDocumentReference)}
  ${this.generateContractDocumentReferences(invoiceData.contractDocumentReference)}
  ${this.generateOrderReferences(invoiceData.orderReference)}
  ${this.generateAccountingSupplierParty(invoiceData.accountingSupplierParty)}
  ${this.generateAccountingCustomerParty(invoiceData.accountingCustomerParty)}
  ${this.generateDelivery(invoiceData.delivery)}
  ${this.generatePaymentTerms(invoiceData.paymentTerms)}
  ${this.generateTaxTotal(invoiceData.taxTotal)}
  ${this.generateLegalMonetaryTotal(invoiceData.legalMonetaryTotal)}
  ${this.generateInvoiceLines(invoiceData.invoiceLine)}
  ${this.generateNotes(invoiceData.note)}
  ${invoiceData.buyerReference ? `<cbc:BuyerReference>${this.escapeXml(invoiceData.buyerReference)}</cbc:BuyerReference>` : ''}
  ${invoiceData.accountingCost ? `<cbc:AccountingCost>${this.escapeXml(invoiceData.accountingCost)}</cbc:AccountingCost>` : ''}
</Invoice>`;
  }

  /**
   * Generate UBL Credit Note XML from JSON data
   */
  static generateCreditNoteXML(creditNoteData: CreditNoteData): string {
    const namespaces = this.buildNamespaceDeclarations('CreditNote-2');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote ${namespaces}>
  ${this.generateDocumentIdentification(creditNoteData, 'CreditNote')}
  ${this.generateBillingReferences(creditNoteData.billingReference)}
  ${this.generateAdditionalDocumentReferences(creditNoteData.additionalDocumentReference)}
  ${this.generateContractDocumentReferences(creditNoteData.contractDocumentReference)}
  ${this.generateOrderReferences(creditNoteData.orderReference)}
  ${this.generateAccountingSupplierParty(creditNoteData.accountingSupplierParty)}
  ${this.generateAccountingCustomerParty(creditNoteData.accountingCustomerParty)}
  ${this.generateDelivery(creditNoteData.delivery)}
  ${this.generatePaymentTerms(creditNoteData.paymentTerms)}
  ${this.generateTaxTotal(creditNoteData.taxTotal)}
  ${this.generateLegalMonetaryTotal(creditNoteData.legalMonetaryTotal)}
  ${this.generateCreditNoteLines(creditNoteData.invoiceLine)}
  ${this.generateNotes(creditNoteData.note)}
  ${creditNoteData.buyerReference ? `<cbc:BuyerReference>${this.escapeXml(creditNoteData.buyerReference)}</cbc:BuyerReference>` : ''}
  ${creditNoteData.accountingCost ? `<cbc:AccountingCost>${this.escapeXml(creditNoteData.accountingCost)}</cbc:AccountingCost>` : ''}
</CreditNote>`;
  }

  /**
   * Generate UBL Order XML from JSON data
   */
  static generateOrderXML(orderData: OrderData): string {
    const namespaces = this.buildNamespaceDeclarations('Order-2');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Order ${namespaces}>
  ${this.generateDocumentIdentification(orderData, 'Order')}
  ${this.generateBuyerCustomerParty(orderData.buyerCustomerParty)}
  ${this.generateSellerSupplierParty(orderData.sellerSupplierParty)}
  ${this.generateDelivery(orderData.delivery)}
  ${this.generateOrderLines(orderData.orderLine)}
  ${this.generateLegalMonetaryTotal(orderData.legalMonetaryTotal)}
  ${this.generateNotes(orderData.note)}
  ${orderData.buyerReference ? `<cbc:BuyerReference>${this.escapeXml(orderData.buyerReference)}</cbc:BuyerReference>` : ''}
</Order>`;
  }

  /**
   * Build namespace declarations for UBL documents
   */
  private static buildNamespaceDeclarations(documentType: string = 'Invoice-2'): string {
    const namespaces = {
      'xmlns': `urn:oasis:names:specification:ubl:schema:xsd:${documentType}`,
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ccts': 'urn:un:unece:uncefact:documentation:2',
      'xmlns:qdt': 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
      'xmlns:udt': 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2'
    };
    
    return Object.entries(namespaces)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  }

  /**
   * Generate document identification section
   */
  private static generateDocumentIdentification(
    data: InvoiceData | CreditNoteData | OrderData, 
    documentType: string = 'Invoice'
  ): string {
    const typeCodeField = documentType === 'CreditNote' ? 'creditNoteTypeCode' : 
                         documentType === 'Order' ? 'orderTypeCode' : 'invoiceTypeCode';
    
    return `<cbc:ID>${this.escapeXml(data.ID)}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  ${data.issueTime ? `<cbc:IssueTime>${data.issueTime}</cbc:IssueTime>` : ''}
  ${data[typeCodeField as keyof typeof data] ? `<cbc:${documentType}TypeCode>${data[typeCodeField as keyof typeof data]}</cbc:${documentType}TypeCode>` : ''}
  <cbc:DocumentCurrencyCode>${data.documentCurrencyCode}</cbc:DocumentCurrencyCode>`;
  }

  /**
   * Generate additional document references
   */
  private static generateAdditionalDocumentReferences(references?: any[]): string {
    if (!references || references.length === 0) return '';
    
    return references.map(ref => `
  <cac:AdditionalDocumentReference>
    <cbc:ID>${this.escapeXml(ref.ID)}</cbc:ID>
    ${ref.documentType ? `<cbc:DocumentType>${this.escapeXml(ref.documentType)}</cbc:DocumentType>` : ''}
    ${ref.attachment ? this.generateAttachment(ref.attachment) : ''}
  </cac:AdditionalDocumentReference>`).join('');
  }

  /**
   * Generate contract document references
   */
  private static generateContractDocumentReferences(references?: any[]): string {
    if (!references || references.length === 0) return '';
    
    return references.map(ref => `
  <cac:ContractDocumentReference>
    <cbc:ID>${this.escapeXml(ref.ID)}</cbc:ID>
    ${ref.documentType ? `<cbc:DocumentType>${this.escapeXml(ref.documentType)}</cbc:DocumentType>` : ''}
  </cac:ContractDocumentReference>`).join('');
  }

  /**
   * Generate order references
   */
  private static generateOrderReferences(references?: any[]): string {
    if (!references || references.length === 0) return '';
    
    return references.map(ref => `
  <cac:OrderReference>
    <cbc:ID>${this.escapeXml(ref.ID)}</cbc:ID>
    ${ref.issueDate ? `<cbc:IssueDate>${ref.issueDate}</cbc:IssueDate>` : ''}
  </cac:OrderReference>`).join('');
  }

  /**
   * Generate billing references (for credit notes)
   */
  private static generateBillingReferences(references?: any[]): string {
    if (!references || references.length === 0) return '';
    
    return references.map(ref => `
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${this.escapeXml(ref.invoiceDocumentReference.ID)}</cbc:ID>
      ${ref.invoiceDocumentReference.issueDate ? `<cbc:IssueDate>${ref.invoiceDocumentReference.issueDate}</cbc:IssueDate>` : ''}
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`).join('');
  }

  /**
   * Generate accounting supplier party
   */
  private static generateAccountingSupplierParty(party: Party): string {
    return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      ${this.generatePartyIdentification(party.partyIdentification)}
      ${this.generatePartyName(party.partyName)}
      ${this.generatePostalAddress(party.postalAddress)}
      ${this.generateContact(party.contact)}
      ${this.generateEndpointID(party.endpointID)}
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  }

  /**
   * Generate accounting customer party
   */
  private static generateAccountingCustomerParty(party: Party): string {
    return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${this.generatePartyIdentification(party.partyIdentification)}
      ${this.generatePartyName(party.partyName)}
      ${this.generatePostalAddress(party.postalAddress)}
      ${this.generateContact(party.contact)}
      ${this.generateEndpointID(party.endpointID)}
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  /**
   * Generate buyer customer party (for orders)
   */
  private static generateBuyerCustomerParty(party: Party): string {
    return `
  <cac:BuyerCustomerParty>
    <cac:Party>
      ${this.generatePartyIdentification(party.partyIdentification)}
      ${this.generatePartyName(party.partyName)}
      ${this.generatePostalAddress(party.postalAddress)}
      ${this.generateContact(party.contact)}
      ${this.generateEndpointID(party.endpointID)}
    </cac:Party>
  </cac:BuyerCustomerParty>`;
  }

  /**
   * Generate seller supplier party (for orders)
   */
  private static generateSellerSupplierParty(party: Party): string {
    return `
  <cac:SellerSupplierParty>
    <cac:Party>
      ${this.generatePartyIdentification(party.partyIdentification)}
      ${this.generatePartyName(party.partyName)}
      ${this.generatePostalAddress(party.postalAddress)}
      ${this.generateContact(party.contact)}
      ${this.generateEndpointID(party.endpointID)}
    </cac:Party>
  </cac:SellerSupplierParty>`;
  }

  /**
   * Generate party identification
   */
  private static generatePartyIdentification(identifications?: any[]): string {
    if (!identifications || identifications.length === 0) return '';
    
    return identifications.map(id => `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${id.schemeID || ''}">${this.escapeXml(id.ID)}</cbc:ID>
      </cac:PartyIdentification>`).join('');
  }

  /**
   * Generate party name
   */
  private static generatePartyName(partyName: { name: string }): string {
    return `
      <cac:PartyName>
        <cbc:Name>${this.escapeXml(partyName.name)}</cbc:Name>
      </cac:PartyName>`;
  }

  /**
   * Generate postal address
   */
  private static generatePostalAddress(address: Address): string {
    return `
      <cac:PostalAddress>
        ${address.streetName ? `<cbc:StreetName>${this.escapeXml(address.streetName)}</cbc:StreetName>` : ''}
        ${address.additionalStreetName ? `<cbc:AdditionalStreetName>${this.escapeXml(address.additionalStreetName)}</cbc:AdditionalStreetName>` : ''}
        ${address.cityName ? `<cbc:CityName>${this.escapeXml(address.cityName)}</cbc:CityName>` : ''}
        ${address.postalZone ? `<cbc:PostalZone>${this.escapeXml(address.postalZone)}</cbc:PostalZone>` : ''}
        ${address.countrySubentity ? `<cbc:CountrySubentity>${this.escapeXml(address.countrySubentity)}</cbc:CountrySubentity>` : ''}
        <cac:Country>
          <cbc:IdentificationCode>${address.country.identificationCode}</cbc:IdentificationCode>
          ${address.country.name ? `<cbc:Name>${this.escapeXml(address.country.name)}</cbc:Name>` : ''}
        </cac:Country>
      </cac:PostalAddress>`;
  }

  /**
   * Generate contact information
   */
  private static generateContact(contact?: any): string {
    if (!contact) return '';
    
    return `
      <cac:Contact>
        ${contact.name ? `<cbc:Name>${this.escapeXml(contact.name)}</cbc:Name>` : ''}
        ${contact.telephone ? `<cbc:Telephone>${this.escapeXml(contact.telephone)}</cbc:Telephone>` : ''}
        ${contact.electronicMail ? `<cbc:ElectronicMail>${this.escapeXml(contact.electronicMail)}</cbc:ElectronicMail>` : ''}
      </cac:Contact>`;
  }

  /**
   * Generate endpoint ID (PEPPOL identifier)
   */
  private static generateEndpointID(endpointID?: any): string {
    if (!endpointID) return '';
    
    return `
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:ID>${this.escapeXml(endpointID.schemeID)}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(endpointID.value)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>`;
  }

  /**
   * Generate delivery information
   */
  private static generateDelivery(delivery?: any): string {
    if (!delivery) return '';
    
    return `
  <cac:Delivery>
    ${delivery.deliveryDate ? `<cbc:ActualDeliveryDate>${delivery.deliveryDate}</cbc:ActualDeliveryDate>` : ''}
    ${delivery.requestedDeliveryDate ? `<cbc:RequestedDeliveryDate>${delivery.requestedDeliveryDate}</cbc:RequestedDeliveryDate>` : ''}
    ${delivery.deliveryAddress ? `
    <cac:DeliveryAddress>
      ${this.generatePostalAddress(delivery.deliveryAddress)}
    </cac:DeliveryAddress>` : ''}
  </cac:Delivery>`;
  }

  /**
   * Generate payment terms
   */
  private static generatePaymentTerms(paymentTerms?: any[]): string {
    if (!paymentTerms || paymentTerms.length === 0) return '';
    
    return paymentTerms.map(term => `
  <cac:PaymentTerms>
    ${term.note ? `<cbc:Note>${this.escapeXml(term.note)}</cbc:Note>` : ''}
    ${term.paymentDueDate ? `<cbc:PaymentDueDate>${term.paymentDueDate}</cbc:PaymentDueDate>` : ''}
  </cac:PaymentTerms>`).join('');
  }

  /**
   * Generate tax total
   */
  private static generateTaxTotal(taxTotals: TaxTotal[]): string {
    return taxTotals.map(taxTotal => `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${taxTotal.taxAmount.currencyID}">${taxTotal.taxAmount.value}</cbc:TaxAmount>
    ${taxTotal.taxSubtotal ? taxTotal.taxSubtotal.map(subtotal => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${subtotal.taxableAmount.currencyID}">${subtotal.taxableAmount.value}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${subtotal.taxAmount.currencyID}">${subtotal.taxAmount.value}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${subtotal.taxCategory.ID}</cbc:ID>
        ${subtotal.taxCategory.percent ? `<cbc:Percent>${subtotal.taxCategory.percent}</cbc:Percent>` : ''}
        <cac:TaxScheme>
          <cbc:ID>${subtotal.taxCategory.taxScheme.ID}</cbc:ID>
          ${subtotal.taxCategory.taxScheme.name ? `<cbc:Name>${this.escapeXml(subtotal.taxCategory.taxScheme.name)}</cbc:Name>` : ''}
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join('') : ''}
  </cac:TaxTotal>`).join('');
  }

  /**
   * Generate legal monetary total
   */
  private static generateLegalMonetaryTotal(total: any): string {
    return `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${total.lineExtensionAmount.currencyID}">${total.lineExtensionAmount.value}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${total.taxExclusiveAmount.currencyID}">${total.taxExclusiveAmount.value}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${total.taxInclusiveAmount.currencyID}">${total.taxInclusiveAmount.value}</cbc:TaxInclusiveAmount>
    ${total.prepaidAmount ? `<cbc:PrepaidAmount currencyID="${total.prepaidAmount.currencyID}">${total.prepaidAmount.value}</cbc:PrepaidAmount>` : ''}
    <cbc:PayableAmount currencyID="${total.payableAmount.currencyID}">${total.payableAmount.value}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  }

  /**
   * Generate invoice lines
   */
  private static generateInvoiceLines(lines: InvoiceLine[]): string {
    return lines.map(line => `
  <cac:InvoiceLine>
    <cbc:ID>${this.escapeXml(line.ID)}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${line.invoicedQuantity.unitCode}">${line.invoicedQuantity.value}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${line.lineExtensionAmount.currencyID}">${line.lineExtensionAmount.value}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${this.escapeXml(line.item.description)}</cbc:Description>
      ${line.item.name ? `<cbc:Name>${this.escapeXml(line.item.name)}</cbc:Name>` : ''}
      ${line.item.sellersItemIdentification ? `
      <cac:SellersItemIdentification>
        <cbc:ID>${this.escapeXml(line.item.sellersItemIdentification.ID)}</cbc:ID>
      </cac:SellersItemIdentification>` : ''}
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${line.item.classifiedTaxCategory.ID}</cbc:ID>
        ${line.item.classifiedTaxCategory.percent ? `<cbc:Percent>${line.item.classifiedTaxCategory.percent}</cbc:Percent>` : ''}
        <cac:TaxScheme>
          <cbc:ID>${line.item.classifiedTaxCategory.taxScheme.ID}</cbc:ID>
          ${line.item.classifiedTaxCategory.taxScheme.name ? `<cbc:Name>${this.escapeXml(line.item.classifiedTaxCategory.taxScheme.name)}</cbc:Name>` : ''}
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${line.price.priceAmount.currencyID}">${line.price.priceAmount.value}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('');
  }

  /**
   * Generate credit note lines
   */
  private static generateCreditNoteLines(lines: InvoiceLine[]): string {
    return lines.map(line => `
  <cac:CreditNoteLine>
    <cbc:ID>${this.escapeXml(line.ID)}</cbc:ID>
    <cbc:CreditedQuantity unitCode="${line.invoicedQuantity.unitCode}">${line.invoicedQuantity.value}</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="${line.lineExtensionAmount.currencyID}">${line.lineExtensionAmount.value}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${this.escapeXml(line.item.description)}</cbc:Description>
      ${line.item.name ? `<cbc:Name>${this.escapeXml(line.item.name)}</cbc:Name>` : ''}
      ${line.item.sellersItemIdentification ? `
      <cac:SellersItemIdentification>
        <cbc:ID>${this.escapeXml(line.item.sellersItemIdentification.ID)}</cbc:ID>
      </cac:SellersItemIdentification>` : ''}
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${line.item.classifiedTaxCategory.ID}</cbc:ID>
        ${line.item.classifiedTaxCategory.percent ? `<cbc:Percent>${line.item.classifiedTaxCategory.percent}</cbc:Percent>` : ''}
        <cac:TaxScheme>
          <cbc:ID>${line.item.classifiedTaxCategory.taxScheme.ID}</cbc:ID>
          ${line.item.classifiedTaxCategory.taxScheme.name ? `<cbc:Name>${this.escapeXml(line.item.classifiedTaxCategory.taxScheme.name)}</cbc:Name>` : ''}
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${line.price.priceAmount.currencyID}">${line.price.priceAmount.value}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>`).join('');
  }

  /**
   * Generate order lines
   */
  private static generateOrderLines(lines: any[]): string {
    return lines.map(line => `
  <cac:OrderLine>
    <cbc:ID>${this.escapeXml(line.ID)}</cbc:ID>
    <cbc:OrderedQuantity unitCode="${line.orderedQuantity.unitCode}">${line.orderedQuantity.value}</cbc:OrderedQuantity>
    <cbc:LineExtensionAmount currencyID="${line.lineExtensionAmount.currencyID}">${line.lineExtensionAmount.value}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${this.escapeXml(line.item.description)}</cbc:Description>
      ${line.item.name ? `<cbc:Name>${this.escapeXml(line.item.name)}</cbc:Name>` : ''}
      ${line.item.sellersItemIdentification ? `
      <cac:SellersItemIdentification>
        <cbc:ID>${this.escapeXml(line.item.sellersItemIdentification.ID)}</cbc:ID>
      </cac:SellersItemIdentification>` : ''}
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${line.price.priceAmount.currencyID}">${line.price.priceAmount.value}</cbc:PriceAmount>
    </cac:Price>
  </cac:OrderLine>`).join('');
  }

  /**
   * Generate notes
   */
  private static generateNotes(notes?: string[]): string {
    if (!notes || notes.length === 0) return '';
    
    return notes.map(note => `
  <cbc:Note>${this.escapeXml(note)}</cbc:Note>`).join('');
  }

  /**
   * Generate attachment
   */
  private static generateAttachment(attachment: any): string {
    return `
    <cac:Attachment>
      <cac:EmbeddedDocumentBinaryObject mimeCode="${attachment.embeddedDocumentBinaryObject.mimeCode}" 
        ${attachment.embeddedDocumentBinaryObject.encodingCode ? `encodingCode="${attachment.embeddedDocumentBinaryObject.encodingCode}"` : ''}
        ${attachment.embeddedDocumentBinaryObject.filename ? `filename="${this.escapeXml(attachment.embeddedDocumentBinaryObject.filename)}"` : ''}>
        ${attachment.embeddedDocumentBinaryObject.value}
      </cac:EmbeddedDocumentBinaryObject>
    </cac:Attachment>`;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
