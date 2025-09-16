# Search API vs Business Entities Table Field Comparison

## Overview
This document compares the fields returned by the search API with the fields available in the `business_entities` table after the recent schema changes.

## Search API Response Fields

### **Core Company Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `unified_id` | string | Unique identifier | "BE123456789" |
| `company_name` | string | Company name | "Acme Corporation" |
| `source_country` | string | Country code | "BE" |
| `legal_form` | string | Legal form | "BVBA", "SA" |
| `registration_number` | string | Registration number | "1234567890" |
| `vat_number` | string | VAT number | "BE123456789" |

### **Address Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `address.street` | string | Street address | "Rue de la Loi 1" |
| `address.city` | string | City | "Brussels" |
| `address.postal_code` | string | Postal code | "1000" |
| `address.country` | string | Country | "BE" |

### **Contact Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `contact.phone` | string | Phone number | "+32 2 123 45 67" |
| `contact.email` | string | Email address | "info@acme.be" |
| `contact.website` | string | Website | "https://acme.be" |

### **Business Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `business_info.industry_code` | string | Industry code | "6201" |
| `business_info.industry_description` | string | Industry description | "Computer programming activities" |
| `business_info.employee_count` | number | Number of employees | 50 |
| `business_info.founding_date` | string | Founding date | "2020-01-15" |

### **PEPPOL Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `peppol_info.is_registered` | boolean | PEPPOL registration status | true |
| `peppol_info.participant_id` | string | PEPPOL participant ID | "0208:123456789" |
| `peppol_info.supported_document_types` | string[] | Supported document types | ["INVOICE", "CREDIT_NOTE"] |
| `peppol_info.last_updated` | string | Last update date | "2024-01-15T10:30:00Z" |

### **Data Quality**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `data_quality.completeness_score` | number | Data completeness score | 85 |
| `data_quality.last_verified` | string | Last verification date | "2024-01-10T15:45:00Z" |
| `data_quality.source_reliability` | string | Source reliability | "high" |

### **Metadata**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `metadata.created_at` | string | Creation timestamp | "2024-01-01T00:00:00Z" |
| `metadata.updated_at` | string | Last update timestamp | "2024-01-15T10:30:00Z" |
| `metadata.source_system` | string | Source system | "belgian_crossroads" |

## Business Entities Table Fields (After Schema Changes)

### **Current Available Fields**
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| `id` | UUID | Primary key | ✅ Available |
| `name` | TEXT | Company name | ✅ Available |
| `tax_id` | TEXT | Tax/VAT number | ✅ Available |
| `billing_street_address` | TEXT | Billing street address | ✅ Available |
| `billing_city` | TEXT | Billing city | ✅ Available |
| `billing_postal_code` | TEXT | Billing postal code | ✅ Available |
| `billing_country` | TEXT | Billing country | ✅ Available |
| `created_at` | TIMESTAMPTZ | Creation timestamp | ✅ Available |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | ✅ Available |
| `created_by` | UUID | Creator user ID | ✅ Available |
| `tenant_id` | UUID | Tenant ID | ✅ Available |

### **Removed Fields**
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| `email` | TEXT | Email address | ❌ Removed |
| `phone` | TEXT | Phone number | ❌ Removed |
| `business_name` | TEXT | Alternative business name | ❌ Removed |
| `billing_state` | TEXT | Billing state/province | ❌ Removed |
| `status` | TEXT | Entity status | ❌ Removed |
| `notes` | TEXT | Additional notes | ❌ Removed |
| `source` | TEXT | Data source | ❌ Removed |
| `custom_fields` | JSONB | Flexible metadata storage | ❌ Removed |

## Current Data Mapping

### **Direct Mappings (Available)**
| Search API Field | Business Entities Field | Status |
|------------------|------------------------|--------|
| `company_name` | `name` | ✅ Mapped |
| `vat_number` | `tax_id` | ✅ Mapped |
| `address.street` | `billing_street_address` | ✅ Mapped |
| `address.city` | `billing_city` | ✅ Mapped |
| `address.postal_code` | `billing_postal_code` | ✅ Mapped |
| `address.country` | `billing_country` | ✅ Mapped |

### **Lost Data (No Longer Stored)**
| Search API Field | Description | Impact |
|------------------|-------------|--------|
| `contact.email` | Email address | ❌ Lost |
| `contact.phone` | Phone number | ❌ Lost |
| `contact.website` | Website URL | ❌ Lost |
| `business_info.industry_description` | Industry information | ❌ Lost |
| `business_info.employee_count` | Employee count | ❌ Lost |
| `business_info.founding_date` | Founding date | ❌ Lost |
| `legal_form` | Legal form | ❌ Lost |
| `peppol_info.is_registered` | PEPPOL registration status | ❌ Lost |
| `peppol_info.participant_id` | PEPPOL participant ID | ❌ Lost |
| `data_quality.completeness_score` | Data quality score | ❌ Lost |
| `unified_id` | Original API ID | ❌ Lost |

## Current Implementation Analysis

### **What's Working:**
- ✅ Basic company information (name, VAT number)
- ✅ Address information (street, city, postal code, country)
- ✅ Core business entity functionality

### **What's Lost:**
- ❌ Contact information (email, phone, website)
- ❌ Business metadata (industry, employee count, founding date)
- ❌ PEPPOL information (registration status, participant ID)
- ❌ Data quality information
- ❌ Legal form information
- ❌ Original API identifiers

### **Current Mapping Code:**
```typescript
const businessEntities = selectedCompanies.map(company => ({
  name: company.name,
  tax_id: company.vatNumber || company.taxId || null,
  billing_country: company.billingCountry || 'BE',
  billing_city: company.billingCity || company.location.split(',')[0]?.trim() || null,
  billing_street_address: company.billingAddress || null,
  billing_postal_code: company.billingPostalCode || null,
  relationship_type: 'customer', // Default to customer, can be changed later
}))
```

## Recommendations

### **Option 1: Accept Data Loss (Current Approach)**
- **Pros**: Simplified schema, easier maintenance
- **Cons**: Significant data loss, reduced functionality
- **Impact**: Users lose access to contact info, PEPPOL data, industry info

### **Option 2: Restore Custom Fields**
- **Pros**: Preserve all API data in flexible JSONB field
- **Cons**: Less structured data, harder to query
- **Impact**: All data preserved but less accessible

### **Option 3: Add Back Essential Fields**
- **Pros**: Balance between structure and data preservation
- **Cons**: Partial solution, still some data loss
- **Impact**: Restore most important fields (email, phone, PEPPOL info)

### **Option 4: Create Separate Tables**
- **Pros**: Structured data, full preservation
- **Cons**: More complex schema, multiple tables
- **Impact**: Complete data preservation with proper structure

## Conclusion

The current implementation has **significant data loss** compared to what the search API provides. The business entities table now only stores basic company information and address data, while losing:

- **Contact information** (email, phone, website)
- **Business metadata** (industry, employee count, founding date)
- **PEPPOL information** (registration status, participant ID)
- **Data quality metrics**
- **Legal form information**

**Recommendation**: Consider restoring the `custom_fields` JSONB column to preserve the rich data from the search API while maintaining the simplified core schema.

---

**Analysis Date:** $(date)
**Status:** Current implementation reviewed
**Next Steps:** Decide on data preservation strategy
