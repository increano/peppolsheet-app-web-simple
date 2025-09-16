// Core types for Storecove API

export interface LegalEntity {
  id: number;
  name: string;
  country: string;
  city?: string;
  postal_code?: string;
  address_line1?: string;
  address_line2?: string;
  created_at: string;
  updated_at: string;
}

export interface PeppolIdentifier {
  id: number;
  legal_entity_id: number;
  scheme: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  legal_entity_id: number;
  recipient_peppol_identifier_id: number;
  document_type: DocumentType;
  document_format: DocumentFormat;
  document: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: number;
  legal_entity_id: number;
  url: string;
  events: string[];
  created_at: string;
  updated_at: string;
}

export interface ShopAccount {
  id: number;
  legal_entity_id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface PreflightResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StorecoveConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface CreateLegalEntityRequest {
  name: string;
  country: string;
  city?: string;
  postal_code?: string;
  address_line1?: string;
  address_line2?: string;
}

export interface CreatePeppolIdentifierRequest {
  legal_entity_id: number;
  scheme: string;
  identifier: string;
}

// Document types supported by Storecove
export type DocumentType = 
  | 'invoice'
  | 'credit_note'
  | 'debit_note'
  | 'reminder'
  | 'order'
  | 'order_response'
  | 'catalogue'
  | 'catalogue_pricing_update'
  | 'application_response';

// Document formats supported by Storecove
export type DocumentFormat = 
  | 'ubl'
  | 'cxml'
  | 'edifact'
  | 'x12';

export interface SendInvoiceRequest {
  legal_entity_id: number;
  recipient_peppol_identifier_id: number;
  document_type: DocumentType;
  document_format: DocumentFormat;
  document: string;
}

export interface CreateWebhookRequest {
  legal_entity_id: number;
  url: string;
  events: string[];
}

export interface CreateShopAccountRequest {
  legal_entity_id: number;
  name: string;
  email: string;
}

// PEPPOL Lookup specific types
export interface PeppolLookupRequest {
  entityNumber: string;
}

export interface PeppolLookupResponse {
  has_peppol: boolean;
  entity_number?: string;
  entity_name?: string;
  country?: string;
  peppol_identifiers?: PeppolIdentifier[];
  error?: string;
}
