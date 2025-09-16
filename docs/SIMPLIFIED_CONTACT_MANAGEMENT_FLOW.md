# Simplified Contact Management Flow

## Overview

The database design has been significantly simplified and adapted. The system now uses a unified contact management approach where tenant users add contacts (which can be either suppliers or customers) through a streamlined two-phase process.

## Database Design Changes

### **Removed Tables:**
- ❌ `suppliers` / `suppliers_old` - Legacy supplier tables
- ❌ `customers` / `customers_old` - Legacy customer tables  
- ❌ `invoices` / `invoice_items` - Invoice management
- ❌ `bills` / `bill_items` - Bill management
- ❌ `expenses` - Expense tracking
- ❌ `payments` - Payment processing

### **Core Tables (Remaining):**
- ✅ `business_entities` - Central company/business entity storage
- ✅ `business_entities_staging` - Staging area for unverified entities
- ✅ `contacts` - Contact persons linked to business entities
- ✅ `tenants` - Multi-tenant architecture
- ✅ `tenant_users` - User-tenant relationships

## Two-Phase Contact Creation Process

### **Phase 1: Company/Business Entity Creation**

#### **Methods to Add Company:**
1. **Manual Entry** - Tenant user manually enters company details
2. **Search API** - Use external search API to find and import company data
3. **Bulk Import** - Import multiple companies via CSV or other formats

#### **Company Data Storage:**
- **Verified Companies** → Stored directly in `business_entities` table
- **Unverified Companies** → Stored in `business_entities_staging` table for additional verification

#### **Simultaneous Contact Creation:**
- **New Companies** → Company details are simultaneously added to `contacts` table with available business information
- **Existing Companies** → When searching for a business entity already in `business_entities` table, only a contact record is added if it doesn't exist yet, using the available business information details

#### **Company Information Includes:**
- Company name, tax ID, industry
- Address details (street, city, postal code, country)
- Contact information (email, phone, website)
- Banking details (IBAN, SWIFT, bank account)
- PEPPOL scheme and identifiers

### **Phase 2: Contact Person Addition**

#### **Process:**
1. Tenant user selects from existing `contacts` table the record based on the companny details (business entities) filled in
2. Adds contact person details to the selected record
3. Contact person details are added to the existing contact record in `contacts` table

#### **Contact Person Information:**
- Personal details (first name, last name, email, phone)
- Professional details (job title, department)
- Address information (billing, shipping, remittance, service addresses)
- Relationship details (primary contact, status, notes)

## User Interface Flow

### **Adding a New Contact:**

#### **Step 1: Company Selection/Creation**
```
UI Flow:
1. User clicks "Add Contact"
2. User searches for existing company OR creates new company
   - If company exists → Select from list (contact record already exists with business info)
   - If company doesn't exist → Create new company entry
3. Company data is stored in business_entities or business_entities_staging
4. Contact record is simultaneously created in contacts table with available business information
```

#### **Step 2: Contact Person Details**
```
UI Flow:
1. User selects the company from dropdown/list
2. User fills in contact person details
3. Contact person details are added to the existing contact record
4. Contact record is updated in contacts table with personal information
```

### **Company Management:**

#### **Verified vs Staging Companies:**
- **Verified Companies** - Available for immediate contact creation
- **Staging Companies** - Require admin verification before contact creation
- **Search API Integration** - Automatically verifies companies when found

## Key Benefits of Simplified Design

### **1. Unified Data Model**
- Single source of truth for company information
- No duplication between suppliers and customers
- Consistent data structure across all entities

### **2. Streamlined Workflow**
- Two-phase process is intuitive and logical
- Clear separation between company and contact person data
- Flexible verification process for unverified companies

### **3. Reduced Complexity**
- Eliminated complex billing/invoice management
- Simplified database schema
- Easier maintenance and development

### **4. Better Data Quality**
- Centralized company verification process
- Consistent contact person management
- Improved data integrity

## Technical Implementation

### **Database Relationships:**
```
tenants (1) ←→ (many) tenant_users
tenants (1) ←→ (many) business_entities
tenants (1) ←→ (many) contacts
business_entities (1) ←→ (1) contacts (one-to-one relationship)
business_entities_staging (1) ←→ (1) contacts (one-to-one relationship, after verification)
```

### **Key Features:**
- **Multi-tenant Architecture** - Each tenant manages their own contacts
- **Staging Workflow** - Unverified companies go through approval process
- **Unified Contact Management** - One contact record per company with both business and personal information
- **Address Management** - Multiple address types per contact
- **Audit Logging** - Track changes and approvals

## User Experience

### **For Tenant Users:**
1. **Simple Contact Creation** - Clear two-step process
2. **Company Reuse** - Select from existing companies (contact record already exists)
3. **Flexible Data Entry** - Manual entry or API integration
4. **Unified Contact Management** - One record per company with both business and personal information

### **For Administrators:**
1. **Company Verification** - Review and approve staging companies
2. **Data Quality Control** - Ensure accurate company information
3. **Audit Trail** - Track all changes and approvals

## Migration Considerations

### **Application Updates Required:**
- Update UI components to reflect new two-phase flow
- Modify API endpoints for new contact management
- Update TypeScript interfaces for simplified data model
- Remove billing/invoice related features
- Implement company search and verification workflows

### **Data Migration (if needed):**
- Migrate existing supplier/customer data to business_entities
- Convert existing contact information to new structure
- Preserve important historical data if required

## Summary

This simplified design transforms the complex supplier/customer/billing system into a streamlined contact management system focused on:

1. **Company Management** - Centralized business entity storage
2. **Unified Contact Management** - One contact record per company with both business and personal information
3. **Verification Workflow** - Quality control for company data
4. **Multi-tenant Support** - Isolated data per tenant

The new system is more intuitive, maintainable, and focused on the core business need of managing business relationships through a unified contact management approach where each company has exactly one contact record that contains both business entity information and contact person details.

🎃
