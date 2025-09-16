# CSV Import Analysis & Business Entity Management Strategy

## 📊 Database Schema Analysis

### 1. Business Entities Table (`public.business_entities`)
**Core shared entity data (no tenant_id - shared across all tenants):**
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required) - Company display name
- `email` (VARCHAR, Optional) - Primary contact email
- `phone` (VARCHAR, Optional) - Primary contact phone
- `website` (VARCHAR, Optional) - Company website
- `business_name` (VARCHAR, Optional) - Legal business name
- `tax_id` (VARCHAR, Optional) - Tax identification number
- `industry` (VARCHAR, Optional) - Business industry/sector
- `billing_street_address` (TEXT, Optional) - Billing address
- `billing_city` (VARCHAR, Optional) - Billing city
- `billing_state` (VARCHAR, Optional) - Billing state/province
- `billing_postal_code` (VARCHAR, Optional) - Billing postal code
- `billing_country` (VARCHAR, Default: 'US') - Billing country
- `peppol_scheme` (VARCHAR, Optional) - PEPPOL identifier scheme
- `currency` (VARCHAR, Default: 'USD') - Preferred currency
- `custom_fields` (JSONB, Default: '{}') - Flexible custom data
- `notes` (TEXT, Optional) - Additional notes
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())

### 2. Customers Table (`public.customers`)
**Tenant-specific customer relationships:**
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Required) - Tenant that owns this relationship
- `business_entity_id` (UUID, Required) - Reference to business_entities
- `customer_number` (VARCHAR, Optional) - Internal customer number
- `storecove_receiver_identifier` (VARCHAR, Optional) - PEPPOL receiver ID
- `default_payment_terms` (INTEGER, Default: 30) - Payment terms in days
- `credit_limit` (NUMERIC, Optional) - Credit limit amount
- `status` (VARCHAR, Default: 'active') - Relationship status
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())

**Note**: Shipping address fields were removed from the customers table as they are unnecessary for invoicing purposes. The billing address stored in the `business_entities` table is sufficient for all invoicing and legal requirements.

### 3. Suppliers Table (`public.suppliers`)
**Tenant-specific supplier relationships:**
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Required) - Tenant that owns this relationship
- `business_entity_id` (UUID, Required) - Reference to business_entities
- `supplier_number` (VARCHAR, Optional) - Internal supplier number
- `default_payment_terms` (INTEGER, Default: 30) - Payment terms in days
- `preferred_payment_method` (VARCHAR, Optional) - Preferred payment method
- `bank_account_number` (VARCHAR, Optional) - Bank account number
- `bank_routing_number` (VARCHAR, Optional) - Bank routing number
- `bank_name` (VARCHAR, Optional) - Bank name
- `storecove_sender_identifier` (VARCHAR, Optional) - PEPPOL sender ID
- `status` (VARCHAR, Default: 'active') - Relationship status
- `credit_rating` (VARCHAR, Optional) - Credit rating assessment
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())

### 4. Contacts Table (`public.contacts`)
**Contact persons linked to business entities:**
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Required) - Tenant that owns this contact
- `business_entity_id` (UUID, Required) - Reference to business_entities
- `first_name` (VARCHAR, Required) - Contact first name
- `last_name` (VARCHAR, Required) - Contact last name
- `email` (VARCHAR, Optional) - Contact email address
- `phone` (VARCHAR, Optional) - Contact phone number
- `job_title` (VARCHAR, Optional) - Job title/position
- `department` (VARCHAR, Optional) - Department
- `is_primary` (BOOLEAN, Default: false) - Primary contact flag
- `status` (VARCHAR, Default: 'active') - Contact status
- `notes` (TEXT, Optional) - Additional notes
- `created_at` (TIMESTAMPTZ, Default: now())
- `updated_at` (TIMESTAMPTZ, Default: now())



## 🔄 Add Customers/Vendors Dialog Flow Analysis

### Current Implementation Analysis

Based on the existing `AddNewBusiness` component (`components/dashboard/add-new-business.tsx`):

#### 1. **Search-Based Flow**
- **Search Bar**: Users type to search for existing companies
- **Search Results Table**: Displays found companies with selection checkboxes
- **Selected Companies**: Shows chosen companies for bulk operations
- **Bulk Actions**: "Add as Suppliers" or "Add as Customers" buttons

#### 2. **Manual Entry Flow**
- **Manual Form**: Direct input form for new business entities
- **Validation**: Real-time validation and formatting
- **Similar Entities Detection**: Shows potential duplicates before creation

#### 3. **Bulk Import Flow**
- **File Upload**: CSV file upload with preview
- **Data Validation**: Validates CSV structure and data
- **Preview Table**: Shows parsed data before import
- **Error Handling**: Highlights validation errors
- **Confirmation**: Final confirmation before database insertion

### Recommended Enhanced Flow

#### 1. **Unified Entry Point**
```
Add Customers/Vendors Dialog
├── Search Tab
│   ├── Search existing business entities
│   ├── Select multiple entities
│   └── Choose relationship type (customer/supplier)
├── Manual Entry Tab
│   ├── Single entity form
│   ├── Real-time validation
│   └── Similar entities detection
└── Bulk Import Tab
    ├── CSV upload
    ├── Data preview & validation
    └── Relationship type selection
```

#### 2. **Business Entity Creation Process**
```
1. User Input (Search/Manual/CSV)
   ↓
2. Application-Level Validation
   ├── Check for existing business entities
   ├── Validate required fields
   └── Format data (phone, tax_id, etc.)
   ↓
3. Duplicate Detection
   ├── Exact matches (tax_id + country)
   ├── Fuzzy matches (name similarity)
   └── Show similar entities modal
   ↓
4. Business Entity Creation
   ├── Create in business_entities table
   ├── Generate UUID for new entity
   └── Return entity ID
   ↓
5. Relationship Creation
   ├── Create customer/supplier relationship
   ├── Link to tenant_id
   └── Add relationship-specific data
   ↓
6. Contact Creation (if provided)
   ├── Create contact records
   ├── Link to business_entity_id
   └── Set primary contact if specified
```

#### 3. **CSV Import Process**
```
1. File Upload & Parsing
   ├── Validate CSV format
   ├── Parse headers and data
   └── Detect column mappings
   ↓
2. Data Validation
   ├── Required field validation
   ├── Data type validation
   ├── Format validation (email, phone, etc.)
   └── Business logic validation
   ↓
3. Duplicate Detection
   ├── Check existing business entities
   ├── Group similar entities
   └── Show merge options
   ↓
4. Preview & Confirmation
   ├── Show validated data
   ├── Highlight errors/warnings
   ├── Allow user corrections
   └── Confirm import
   ↓
5. Batch Processing
   ├── Create business entities
   ├── Create relationships
   ├── Create contacts
   └── Handle errors gracefully
```

## 🎯 Key Implementation Requirements

### 1. **Business Entity Management**
- **Application-Level Creation**: All business entity creation happens at application level
- **Duplicate Prevention**: Use `find_existing_business_entities()` function for duplicate detection
- **Validation**: Comprehensive validation before database insertion
- **Error Handling**: Graceful error handling with user-friendly messages

### 2. **Relationship Management**
- **Tenant Isolation**: All relationships include tenant_id for proper isolation
- **Flexible Assignment**: Same business entity can be customer for one tenant, supplier for another
- **Bulk Operations**: Support for bulk relationship creation
- **Status Management**: Active/inactive status for relationships

### 3. **Contact Management**
- **One-to-Many**: Multiple contacts per business entity
- **Primary Contact**: Support for primary contact designation
- **Tenant Ownership**: Contacts owned by tenant users
- **Bulk Import**: Support for contact import via CSV

### 4. **CSV Import Features**
- **Template Download**: Provide CSV template with all available fields
- **Column Mapping**: Auto-detect and allow manual column mapping
- **Data Preview**: Show parsed data before import
- **Error Reporting**: Detailed error reporting with row numbers
- **Partial Import**: Allow partial imports with error handling
- **Progress Tracking**: Show import progress for large files

### 5. **User Experience**
- **Search Integration**: Seamless integration with existing search functionality
- **Auto-Complete**: Auto-complete for existing business entities
- **Validation Feedback**: Real-time validation feedback
- **Bulk Operations**: Efficient bulk add/remove operations
- **Responsive Design**: Mobile-friendly interface



## 🔧 Technical Implementation Notes

### 1. **Database Functions to Use**
- `find_existing_business_entities()` - For duplicate detection
- `create_customer_relationship()` - For customer relationship creation
- `create_supplier_relationship()` - For supplier relationship creation
- `create_contact_relationship()` - For contact creation
- `search_business_entities_api()` - For internal search

### 2. **API Endpoints Needed**
- `POST /api/business-entities/bulk-import` - CSV import endpoint
- `GET /api/business-entities/template` - CSV template download
- `POST /api/business-entities/validate-csv` - CSV validation endpoint
- `GET /api/business-entities/search` - Enhanced search with pagination

### 3. **Frontend Components**
- Enhanced `AddNewBusiness` component with tabs
- CSV upload and preview component
- Bulk relationship management component
- Contact management component
- Validation and error display components

### 4. **Security Considerations**
- File size limits for CSV uploads
- File type validation (CSV only)
- Rate limiting for bulk operations
- Tenant isolation enforcement
- Input sanitization and validation

This comprehensive analysis provides the foundation for implementing robust CSV import functionality while maintaining the existing business entity management architecture and ensuring proper multi-tenant isolation.

## CSV Import Requirements

### Business Entities & Relationships CSV

**File Name:** `business_entities_import.csv`

| CSV Field | Database Field | Type | Required | Description |
|-----------|----------------|------|----------|-------------|
| `company_name` | `business_entities.name` | VARCHAR | ✅ | Company display name |
| `business_name` | `business_entities.business_name` | VARCHAR | ❌ | Legal business name |
| `tax_id` | `business_entities.tax_id` | VARCHAR | ❌ | Tax identification number |
| `email` | `business_entities.email` | VARCHAR | ❌ | Primary email address |
| `phone` | `business_entities.phone` | VARCHAR | ❌ | Primary phone number |
| `website` | `business_entities.website` | VARCHAR | ❌ | Company website |
| `industry` | `business_entities.industry` | VARCHAR | ❌ | Industry/activity code |
| `billing_address` | `business_entities.billing_street_address` | TEXT | ❌ | Billing street address |
| `billing_city` | `business_entities.billing_city` | VARCHAR | ❌ | Billing city |
| `billing_state` | `business_entities.billing_state` | VARCHAR | ❌ | Billing state/province |
| `billing_postal_code` | `business_entities.billing_postal_code` | VARCHAR | ❌ | Billing postal code |
| `billing_country` | `business_entities.billing_country` | VARCHAR | ❌ | Billing country (default: 'US') |
| `peppol_scheme` | `business_entities.peppol_scheme` | VARCHAR | ❌ | PEPPOL identifier scheme |
| `currency` | `business_entities.currency` | VARCHAR | ❌ | Default currency (default: 'USD') |
| `relationship_type` | N/A | VARCHAR | ✅ | 'customer' or 'supplier' |
| `customer_number` | `customers.customer_number` | VARCHAR | ❌ | Internal customer number |
| `supplier_number` | `suppliers.supplier_number` | VARCHAR | ❌ | Internal supplier number |
| `payment_terms` | `customers.default_payment_terms` / `suppliers.default_payment_terms` | INTEGER | ❌ | Payment terms in days (default: 30) |
| `credit_limit` | `customers.credit_limit` | NUMERIC | ❌ | Credit limit for customers |
| `preferred_payment_method` | `suppliers.preferred_payment_method` | VARCHAR | ❌ | Preferred payment method for suppliers |
| `bank_account_number` | `suppliers.bank_account_number` | VARCHAR | ❌ | Bank account number for suppliers |
| `bank_routing_number` | `suppliers.bank_routing_number` | VARCHAR | ❌ | Bank routing number for suppliers |
| `bank_name` | `suppliers.bank_name` | VARCHAR | ❌ | Bank name for suppliers |
| `credit_rating` | `suppliers.credit_rating` | VARCHAR | ❌ | Credit rating for suppliers |
| `storecove_receiver_identifier` | `customers.storecove_receiver_identifier` | VARCHAR | ❌ | PEPPOL receiver ID for customers |
| `storecove_sender_identifier` | `suppliers.storecove_sender_identifier` | VARCHAR | ❌ | PEPPOL sender ID for suppliers |

**Example CSV:**
```csv
company_name,business_name,tax_id,email,phone,website,industry,billing_address,billing_city,billing_state,billing_postal_code,billing_country,peppol_scheme,currency,relationship_type,customer_number,supplier_number,payment_terms,credit_limit,preferred_payment_method,bank_account_number,bank_routing_number,bank_name,credit_rating,storecove_receiver_identifier,storecove_sender_identifier
"Acme Corp","Acme Corporation Inc","123456789","info@acme.com","+1-555-0123","https://acme.com","Technology","123 Business St","New York","NY","10001","US","0106","USD","customer","CUST001","",30,50000,"","","","","","",""
"Tech Solutions","Tech Solutions LLC","987654321","contact@techsolutions.com","+1-555-0456","https://techsolutions.com","Software","456 Tech Ave","San Francisco","CA","94102","US","0106","USD","supplier","","SUPP001",30,,"Bank Transfer","1234567890","987654321","Tech Bank","excellent","",""
```

### Contacts CSV

**File Name:** `contacts_import.csv`

| CSV Field | Database Field | Type | Required | Description |
|-----------|----------------|------|----------|-------------|
| `company_name` | N/A | VARCHAR | ✅ | Company name to link contact (must match business_entities.name) |
| `tax_id` | N/A | VARCHAR | ❌ | Tax ID to link contact (alternative to company_name) |
| `first_name` | `contacts.first_name` | VARCHAR | ✅ | Contact's first name |
| `last_name` | `contacts.last_name` | VARCHAR | ✅ | Contact's last name |
| `email` | `contacts.email` | VARCHAR | ❌ | Contact's email address |
| `phone` | `contacts.phone` | VARCHAR | ❌ | Contact's phone number |
| `job_title` | `contacts.job_title` | VARCHAR | ❌ | Contact's job title |
| `department` | `contacts.department` | VARCHAR | ❌ | Contact's department |
| `is_primary_contact` | `contacts.is_primary_contact` | BOOLEAN | ❌ | Whether this is the primary contact (default: false) |

**Example CSV:**
```csv
company_name,tax_id,first_name,last_name,email,phone,job_title,department,is_primary_contact
"Acme Corp","123456789","John","Doe","john.doe@acme.com","+1-555-0124","CEO","Executive",true
"Acme Corp","123456789","Jane","Smith","jane.smith@acme.com","+1-555-0125","CFO","Finance",false
"Tech Solutions","987654321","Mike","Johnson","mike.johnson@techsolutions.com","+1-555-0457","CTO","Technology",true
"Tech Solutions","987654321","Sarah","Wilson","sarah.wilson@techsolutions.com","+1-555-0458","VP Sales","Sales",false
```

## Import Process

### Step 1: Import Business Entities & Relationships
1. Upload `business_entities_import.csv`
2. System creates/updates business entities
3. System creates customer/supplier relationships based on `relationship_type`
4. System validates PEPPOL identifiers with Storecove

### Step 2: Import Contacts
1. Upload `contacts_import.csv`
2. System matches contacts to business entities using `company_name` or `tax_id`
3. System creates contact records linked to business entities
4. System validates primary contact constraints

### Import Validation Rules
- **Business Entity Matching**: Contacts are linked using `company_name` (exact match) or `tax_id` (exact match)
- **Primary Contact**: Only one contact per business entity per tenant can be marked as primary
- **Duplicate Prevention**: System checks for existing contacts with same email/phone before creating
- **Relationship Validation**: Ensures business entity exists before creating relationships
