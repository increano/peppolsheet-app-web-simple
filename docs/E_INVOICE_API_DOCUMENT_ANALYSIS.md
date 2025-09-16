# E-Invoice.be API Document Analysis

## Overview

This document analyzes the e-invoice.be Peppol Access Point API for creating and managing invoice documents. The analysis is based on the API documentation provided and will help design a database schema for storing invoice documents.

## API Endpoint

- **Base URL**: `https://api.e-invoice.be`
- **Create Document**: `POST /api/documents/`
- **Authentication**: Bearer token required

## Document Structure Analysis

### Core Document Fields

#### 1. Document Metadata
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `document_type` | enum | Yes | Type of document | ENUM('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE') |
| `state` | enum | Yes | Document state | ENUM('DRAFT', 'TRANSIT', 'FAILED', 'SENT', 'RECEIVED') |
| `direction` | enum | Yes | Document direction | ENUM('INBOUND', 'OUTBOUND') |
| `id` | string | Auto | Document ID (returned) | UUID PRIMARY KEY |

#### 2. Invoice Identification
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `invoice_id` | string | No | Invoice identifier | VARCHAR(255) |
| `invoice_date` | date | No | Invoice date (RFC 3339) | DATE |
| `due_date` | date | No | Payment due date | DATE |
| `purchase_order` | string | No | Purchase order reference | VARCHAR(255) |

#### 3. Customer Information
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `customer_name` | string | No | Customer company name | VARCHAR(255) |
| `customer_id` | string | No | Customer identifier | VARCHAR(255) |
| `customer_email` | string | No | Customer email address | VARCHAR(255) |
| `customer_tax_id` | string | No | Customer tax ID/VAT number | VARCHAR(50) |
| `customer_address` | string | No | Customer address | TEXT |
| `customer_address_recipient` | string | No | Customer address recipient | VARCHAR(255) |

#### 4. Vendor Information
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `vendor_name` | string | No | Vendor company name | VARCHAR(255) |
| `vendor_email` | string | No | Vendor email address | VARCHAR(255) |
| `vendor_tax_id` | string | No | Vendor tax ID/VAT number | VARCHAR(50) |
| `vendor_address` | string | No | Vendor address | TEXT |
| `vendor_address_recipient` | string | No | Vendor address recipient | VARCHAR(255) |

#### 5. Address Information
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `billing_address` | string | No | Billing address | TEXT |
| `billing_address_recipient` | string | No | Billing address recipient | VARCHAR(255) |
| `shipping_address` | string | No | Shipping address | TEXT |
| `shipping_address_recipient` | string | No | Shipping address recipient | VARCHAR(255) |
| `remittance_address` | string | No | Remittance address | TEXT |
| `remittance_address_recipient` | string | No | Remittance address recipient | VARCHAR(255) |
| `service_address` | string | No | Service address | TEXT |
| `service_address_recipient` | string | No | Service address recipient | VARCHAR(255) |

#### 6. Service Period
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `service_start_date` | date | No | Service period start | DATE |
| `service_end_date` | date | No | Service period end | DATE |

#### 7. Financial Information
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `currency` | enum | Yes | Currency code | ENUM('EUR', 'USD', 'GBP') |
| `subtotal` | decimal | No | Subtotal amount | DECIMAL(15,2) |
| `total_discount` | decimal | No | Total discount | DECIMAL(15,2) |
| `total_tax` | decimal | No | Total tax amount | DECIMAL(15,2) |
| `invoice_total` | decimal | No | Total invoice amount | DECIMAL(15,2) |
| `amount_due` | decimal | No | Amount due | DECIMAL(15,2) |
| `previous_unpaid_balance` | decimal | No | Previous unpaid balance | DECIMAL(15,2) |
| `payment_term` | string | No | Payment terms | VARCHAR(255) |

#### 8. Additional Information
| Field | Type | Required | Description | Database Type |
|-------|------|----------|-------------|---------------|
| `note` | string | No | Additional notes | TEXT |

### Complex Objects

#### 1. Payment Details
```json
"payment_details": [
  {
    "iban": "string",
    "swift": "string", 
    "bank_account_number": "string",
    "payment_reference": "string"
  }
]
```

**Database Table**: `document_payment_details`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to documents |
| `iban` | VARCHAR(50) | IBAN number |
| `swift` | VARCHAR(20) | SWIFT/BIC code |
| `bank_account_number` | VARCHAR(50) | Bank account number |
| `payment_reference` | VARCHAR(255) | Payment reference |

#### 2. Tax Details
```json
"tax_details": [
  {
    "amount": "decimal",
    "rate": "string"
  }
]
```

**Database Table**: `document_tax_details`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to documents |
| `amount` | DECIMAL(15,2) | Tax amount |
| `rate` | VARCHAR(20) | Tax rate (e.g., "21%") |

#### 3. Invoice Items
```json
"items": [
  {
    "amount": "decimal",
    "date": "date|null",
    "description": "string",
    "quantity": "decimal",
    "product_code": "string",
    "tax": "decimal",
    "tax_rate": "string",
    "unit": "string",
    "unit_price": "decimal"
  }
]
```

**Database Table**: `document_items`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to documents |
| `amount` | DECIMAL(15,2) | Line item total |
| `date` | DATE | Item date (nullable) |
| `description` | TEXT | Item description |
| `quantity` | DECIMAL(10,3) | Quantity |
| `product_code` | VARCHAR(100) | Product/SKU code |
| `tax` | DECIMAL(15,2) | Tax amount for this item |
| `tax_rate` | VARCHAR(20) | Tax rate for this item |
| `unit` | VARCHAR(20) | Unit of measurement |
| `unit_price` | DECIMAL(15,2) | Unit price |

#### 4. Attachments
```json
"attachments": [
  {
    "file_name": "string",
    "file_type": "string",
    "file_size": "integer",
    "file_data": "string"
  }
]
```

**Database Table**: `document_attachments`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to documents |
| `file_name` | VARCHAR(255) | Original filename |
| `file_type` | VARCHAR(100) | MIME type |
| `file_size` | BIGINT | File size in bytes |
| `file_data` | BYTEA | Binary file data |
| `file_url` | VARCHAR(500) | URL to stored file (if applicable) |

## Database Schema Design

### Main Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')),
    state VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT', 'TRANSIT', 'FAILED', 'SENT', 'RECEIVED')),
    direction VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND' CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    
    -- Invoice identification
    invoice_id VARCHAR(255),
    invoice_date DATE,
    due_date DATE,
    purchase_order VARCHAR(255),
    
    -- Customer information
    customer_name VARCHAR(255),
    customer_id VARCHAR(255),
    customer_email VARCHAR(255),
    customer_tax_id VARCHAR(50),
    customer_address TEXT,
    customer_address_recipient VARCHAR(255),
    
    -- Vendor information
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255),
    vendor_tax_id VARCHAR(50),
    vendor_address TEXT,
    vendor_address_recipient VARCHAR(255),
    
    -- Address information
    billing_address TEXT,
    billing_address_recipient VARCHAR(255),
    shipping_address TEXT,
    shipping_address_recipient VARCHAR(255),
    remittance_address TEXT,
    remittance_address_recipient VARCHAR(255),
    service_address TEXT,
    service_address_recipient VARCHAR(255),
    
    -- Service period
    service_start_date DATE,
    service_end_date DATE,
    
    -- Financial information
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    subtotal DECIMAL(15,2),
    total_discount DECIMAL(15,2),
    total_tax DECIMAL(15,2),
    invoice_total DECIMAL(15,2),
    amount_due DECIMAL(15,2),
    previous_unpaid_balance DECIMAL(15,2),
    payment_term VARCHAR(255),
    
    -- Additional information
    note TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_document_type (document_type),
    INDEX idx_state (state),
    INDEX idx_direction (direction),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_customer_email (customer_email),
    INDEX idx_vendor_email (vendor_email)
);
```

### Related Tables
```sql
-- Payment details table
CREATE TABLE document_payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    iban VARCHAR(50),
    swift VARCHAR(20),
    bank_account_number VARCHAR(50),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax details table
CREATE TABLE document_tax_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    rate VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    date DATE,
    description TEXT,
    quantity DECIMAL(10,3),
    product_code VARCHAR(100),
    tax DECIMAL(15,2),
    tax_rate VARCHAR(20),
    unit VARCHAR(20),
    unit_price DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table
CREATE TABLE document_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_data BYTEA,
    file_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Integration Notes

### Required Fields for Document Creation
- `document_type` (default: "INVOICE")
- `state` (default: "DRAFT") 
- `direction` (default: "OUTBOUND")
- `currency` (default: "EUR")

### Optional Fields
All other fields are optional and can be empty strings or null values.

### Data Types
- **Numeric fields**: Use decimal for financial amounts to avoid floating-point precision issues
- **Date fields**: Use ISO 8601 format (YYYY-MM-DD)
- **Enum fields**: Use predefined values only
- **String fields**: Most have no specific length limits in the API

### Validation Rules
- Document must be in DRAFT state before sending
- UBL validation required before sending via Peppol
- File attachments must be valid file types and sizes

## Implementation Considerations

1. **UUID Primary Keys**: Use UUIDs for better distribution and security
2. **Decimal Precision**: Use DECIMAL(15,2) for financial amounts
3. **Cascade Deletes**: Related records should be deleted when parent document is deleted
4. **Indexing**: Index frequently queried fields for performance
5. **File Storage**: Consider storing large files externally (S3, etc.) and keeping only metadata in database
6. **Audit Trail**: Consider adding audit fields for tracking document state changes
7. **Validation**: Implement server-side validation matching API requirements

## Next Steps

1. Create database migration scripts
2. Implement document CRUD operations
3. Add validation logic for required fields
4. Implement file upload handling for attachments
5. Add document state management
6. Implement Peppol sending functionality
7. Add error handling and logging
