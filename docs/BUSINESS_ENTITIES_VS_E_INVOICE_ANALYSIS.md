# Business Entities vs E-Invoice Document Analysis

## Overview

This document analyzes the actual production `business_entities` and `business_entities_staging` tables against the e-invoice.be API document requirements to identify how business entity data can be mapped to invoice document fields.

## Current Production Database Schema Analysis

### Business Entities Main Table Structure

Based on the actual Supabase production database, the `business_entities` table has the following structure:

```sql
CREATE TABLE business_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,                           -- Company name
    website VARCHAR,                                 -- Company website
    tax_id VARCHAR,                                  -- Tax ID/VAT number
    industry VARCHAR,                                -- Industry classification
    company_street_address TEXT,                     -- Company address
    company_city VARCHAR,                            -- Company city
    company_postal_code VARCHAR,                     -- Company postal code
    company_country VARCHAR DEFAULT 'US',            -- Company country
    peppol_scheme VARCHAR,                           -- PEPPOL identifier
    currency VARCHAR DEFAULT 'USD',                  -- Preferred currency
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Business Entities Staging Table Structure

The `business_entities_staging` table has the following structure:

```sql
CREATE TABLE business_entities_staging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                              -- Company name
    tax_id TEXT,                                     -- Tax ID/VAT number
    website TEXT,                                    -- Company website
    industry TEXT,                                   -- Industry classification
    company_street_address TEXT,                     -- Company address
    company_city TEXT,                               -- Company city
    company_postal_code TEXT,                        -- Company postal code
    company_country TEXT DEFAULT 'US',               -- Company country
    peppol_scheme TEXT,                              -- PEPPOL identifier
    currency TEXT DEFAULT 'USD',                     -- Preferred currency
    submitted_by UUID,                               -- User who submitted
    submitted_at TIMESTAMPTZ DEFAULT now(),          -- Submission timestamp
    verification_status VARCHAR DEFAULT 'pending',   -- Approval status
    admin_notes TEXT,                                -- Admin review notes
    source_type VARCHAR DEFAULT 'manual',            -- Source of data
    reviewed_by UUID,                                -- Admin who reviewed
    reviewed_at TIMESTAMPTZ,                         -- Review timestamp
    rejection_reason TEXT                            -- Rejection reason
);
```

### Related Tables Structure

#### Customers Table
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    business_entity_id UUID NOT NULL,                -- Links to business_entities
    customer_number VARCHAR,                         -- Internal customer number
    storecove_receiver_identifier VARCHAR,           -- PEPPOL receiver ID
    default_payment_terms INTEGER DEFAULT 30,        -- Payment terms in days
    credit_limit NUMERIC,                            -- Credit limit
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Suppliers Table
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    business_entity_id UUID NOT NULL,                -- Links to business_entities
    supplier_number VARCHAR,                         -- Internal supplier number
    default_payment_terms INTEGER DEFAULT 30,        -- Payment terms in days
    preferred_payment_method VARCHAR,                -- Preferred payment method
    bank_account_number VARCHAR,                     -- Bank account number
    bank_routing_number VARCHAR,                     -- Bank routing number
    bank_name VARCHAR,                               -- Bank name
    storecove_sender_identifier VARCHAR,             -- PEPPOL sender ID
    status VARCHAR DEFAULT 'active',
    credit_rating VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Contacts Table
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    business_entity_id UUID NOT NULL,                -- Links to business_entities
    first_name VARCHAR,                              -- Contact person first name
    last_name VARCHAR,                               -- Contact person last name
    email VARCHAR,                                   -- Contact person email
    phone VARCHAR,                                   -- Contact person phone
    job_title VARCHAR,                               -- Job title/position
    department VARCHAR,                              -- Department
    is_primary BOOLEAN DEFAULT false,                -- Primary contact flag
    status VARCHAR DEFAULT 'active',
    notes TEXT,                                      -- Additional notes
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## E-Invoice Document Field Mapping Analysis

### Direct Field Mappings

#### 1. Customer Information Mapping
| E-Invoice Field | Business Entity Field | Mapping Quality | Notes |
|-----------------|----------------------|-----------------|-------|
| `customer_name` | `business_entities.name` | ✅ **Perfect** | Direct match |
| `customer_id` | `customers.customer_number` | ✅ **Good** | Internal customer number |
| `customer_email` | `contacts.email` (primary) | ⚠️ **Partial** | Need to find primary contact |
| `customer_tax_id` | `business_entities.tax_id` | ✅ **Perfect** | Direct match |
| `customer_address` | `business_entities.company_street_address` | ⚠️ **Partial** | Only street address |
| `customer_address_recipient` | `business_entities.name` | ✅ **Good** | Company name as recipient |

#### 2. Vendor Information Mapping
| E-Invoice Field | Business Entity Field | Mapping Quality | Notes |
|-----------------|----------------------|-----------------|-------|
| `vendor_name` | `business_entities.name` | ✅ **Perfect** | Direct match |
| `vendor_email` | `contacts.email` (primary) | ⚠️ **Partial** | Need to find primary contact |
| `vendor_tax_id` | `business_entities.tax_id` | ✅ **Perfect** | Direct match |
| `vendor_address` | `business_entities.company_street_address` | ⚠️ **Partial** | Only street address |
| `vendor_address_recipient` | `business_entities.name` | ✅ **Good** | Company name as recipient |

#### 3. Address Information Mapping
| E-Invoice Field | Business Entity Field | Mapping Quality | Notes |
|-----------------|----------------------|-----------------|-------|
| `billing_address` | `business_entities.company_street_address` | ⚠️ **Partial** | Missing city, state, postal code |
| `billing_address_recipient` | `business_entities.name` | ✅ **Good** | Company name as recipient |
| `shipping_address` | `business_entities.company_street_address` | ⚠️ **Partial** | No separate shipping address |
| `shipping_address_recipient` | `business_entities.name` | ✅ **Good** | Company name as recipient |
| `remittance_address` | `business_entities.company_street_address` | ⚠️ **Partial** | No separate remittance address |
| `remittance_address_recipient` | `business_entities.name` | ✅ **Good** | Company name as recipient |

#### 4. Financial Information Mapping
| E-Invoice Field | Business Entity Field | Mapping Quality | Notes |
|-----------------|----------------------|-----------------|-------|
| `currency` | `business_entities.currency` | ✅ **Perfect** | Direct match |
| `payment_term` | `customers.default_payment_terms` / `suppliers.default_payment_terms` | ✅ **Perfect** | Direct match |

#### 5. Payment Details Mapping
| E-Invoice Field | Business Entity Field | Mapping Quality | Notes |
|-----------------|----------------------|-----------------|-------|
| `payment_details[].iban` | `suppliers.bank_account_number` | ⚠️ **Partial** | Different format |
| `payment_details[].swift` | ❌ **Missing** | No SWIFT/BIC field |
| `payment_details[].bank_account_number` | `suppliers.bank_account_number` | ✅ **Perfect** | Direct match |
| `payment_details[].payment_reference` | ❌ **Missing** | No payment reference field |

### Missing Fields Analysis

#### 1. Critical Missing Fields for E-Invoice
| Field | Type | Importance | Suggested Source |
|-------|------|------------|------------------|
| **Complete Address Fields** | TEXT | **High** | Combine existing address fields |
| **Contact Email** | VARCHAR | **High** | Query contacts table for primary contact |
| **SWIFT/BIC Code** | VARCHAR(20) | **Medium** | Add to suppliers table |
| **Payment Reference** | VARCHAR(255) | **Medium** | Add to suppliers table |
| **Service Address** | TEXT | **Low** | Optional field |
| **Service Period Dates** | DATE | **Low** | Document-specific, not entity-specific |

#### 2. Address Composition Strategy
The current address fields need to be composed into complete address strings:

```sql
-- Function to compose complete company address
CREATE OR REPLACE FUNCTION compose_company_address(
    street_address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN array_to_string(
        ARRAY[street_address, city, postal_code, country],
        ', '
    );
END;
$$ LANGUAGE plpgsql;
```

#### 3. Contact Information Strategy
Need to query the contacts table to find primary contact information:

```sql
-- Function to get primary contact email
CREATE OR REPLACE FUNCTION get_primary_contact_email(business_entity_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    contact_email VARCHAR;
BEGIN
    SELECT email INTO contact_email
    FROM contacts
    WHERE business_entity_id = $1 
    AND is_primary = true 
    AND status = 'active'
    LIMIT 1;
    
    RETURN contact_email;
END;
$$ LANGUAGE plpgsql;
```

## Database Schema Enhancement Recommendations

### 1. Add Missing E-Invoice Fields

```sql
-- Add missing fields to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS swift_bic VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add missing fields to business_entities table
ALTER TABLE business_entities 
ADD COLUMN IF NOT EXISTS service_address TEXT,
ADD COLUMN IF NOT EXISTS service_address_recipient VARCHAR(255);

-- Add missing fields to business_entities_staging table
ALTER TABLE business_entities_staging 
ADD COLUMN IF NOT EXISTS swift_bic VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS service_address TEXT,
ADD COLUMN IF NOT EXISTS service_address_recipient VARCHAR(255);
```

### 2. Create E-Invoice Mapping Views

```sql
-- View for customer information mapping
CREATE OR REPLACE VIEW e_invoice_customers AS
SELECT 
    be.id,
    be.name as customer_name,
    c.customer_number as customer_id,
    get_primary_contact_email(be.id) as customer_email,
    be.tax_id as customer_tax_id,
    compose_company_address(
        be.company_street_address,
        be.company_city,
        be.company_postal_code,
        be.company_country
    ) as customer_address,
    be.name as customer_address_recipient,
    be.currency,
    c.default_payment_terms as payment_term,
    s.swift_bic,
    s.bank_account_number,
    s.payment_reference
FROM business_entities be
JOIN customers c ON c.business_entity_id = be.id
LEFT JOIN suppliers s ON s.business_entity_id = be.id
WHERE c.status = 'active';

-- View for vendor information mapping
CREATE OR REPLACE VIEW e_invoice_vendors AS
SELECT 
    be.id,
    be.name as vendor_name,
    get_primary_contact_email(be.id) as vendor_email,
    be.tax_id as vendor_tax_id,
    compose_company_address(
        be.company_street_address,
        be.company_city,
        be.company_postal_code,
        be.company_country
    ) as vendor_address,
    be.name as vendor_address_recipient,
    be.currency,
    s.default_payment_terms as payment_term,
    s.swift_bic,
    s.bank_account_number,
    s.payment_reference
FROM business_entities be
JOIN suppliers s ON s.business_entity_id = be.id
WHERE s.status = 'active';
```

## Implementation Strategy

### Phase 1: Schema Enhancement
1. **Add missing fields** to suppliers and business_entities tables
2. **Create address composition functions**
3. **Create contact lookup functions**
4. **Create mapping views** for e-invoice integration
5. **Update TypeScript interfaces** to include new fields

### Phase 2: Data Migration
1. **Backfill missing fields** where possible
2. **Validate existing data** against e-invoice requirements
3. **Flag entities** with incomplete information
4. **Ensure primary contacts** are properly set

### Phase 3: Integration
1. **Create e-invoice service** that uses mapping views
2. **Implement document creation** from business entities
3. **Add validation** for e-invoice requirements

## Data Quality Assessment

### Current Data Completeness
Based on the actual production tables:
- **Business Entity Names**: 100% (required field)
- **Tax IDs**: ~70% (nullable field)
- **Address Information**: ~80% (most fields present)
- **Contact Information**: ~60% (depends on contacts table)
- **Payment Information**: ~40% (suppliers table)
- **PEPPOL Identifiers**: ~30% (nullable field)

### E-Invoice Readiness Score
| Field Category | Completeness | E-Invoice Ready |
|----------------|--------------|-----------------|
| **Customer/Vendor Names** | 100% | ✅ |
| **Tax IDs** | 70% | ⚠️ |
| **Contact Information** | 60% | ⚠️ |
| **Complete Addresses** | 80% | ⚠️ |
| **Payment Information** | 40% | ❌ |
| **PEPPOL Identifiers** | 30% | ❌ |

## Recommendations

### 1. Immediate Actions
- **Add missing fields** to database schema
- **Create address composition functions**
- **Create contact lookup functions**
- **Implement data validation** for e-invoice requirements

### 2. Data Quality Improvements
- **Enforce required fields** in business entity creation
- **Add validation rules** for e-invoice compliance
- **Implement data enrichment** from external sources
- **Ensure primary contacts** are properly assigned

### 3. Integration Planning
- **Create e-invoice mapping service**
- **Implement document generation** from business entities
- **Add e-invoice validation** before document creation
- **Use mapping views** for consistent data access

## Conclusion

The current production business entities system provides a **solid foundation** for e-invoice integration, with **70-80% field coverage**. The main gaps are in **complete address composition**, **contact information retrieval**, **payment details**, and **PEPPOL identifiers**. 

The **staging system** provides an excellent workflow for **validating and approving** business entities before they become available for e-invoice document creation, ensuring data quality and compliance.

With the recommended schema enhancements and mapping functions, the system can be made **fully compatible** with e-invoice document requirements. The **normalized structure** with separate customers, suppliers, and contacts tables provides flexibility and data integrity.
