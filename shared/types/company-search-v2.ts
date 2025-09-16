export interface CompanyName {
  name: string
  company_type: string
}

export interface Industry {
  industry_code: number
  industry_name: string
}

export interface Identifier {
  scheme: string
  value: string
}

export interface PeppolData {
  participant_id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  country: string
  website: string
  additional_info: string
  identifiers: Identifier[]
  document_types: string[]
}

export interface CompanyV2 {
  tax_id: string
  company_street: string
  company_city: string
  company_postal_code: string
  company_country: string
  currency: string
  website: string
  email: string
  phone: string
  created_at: string
  updated_at: string
  names: CompanyName[]
  industries: Industry[]
  peppol_data: PeppolData[]
}

export interface CompanySearchV2Response {
  companies: CompanyV2[]
  total_count: number
  query_time_ms: number
  data_source: string
  cache_hit: boolean
  page: number
  per_page: number
}
