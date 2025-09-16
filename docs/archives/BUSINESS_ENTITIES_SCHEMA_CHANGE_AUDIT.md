# Business Entities Schema Change Audit

## Overview
This audit analyzes the impact of removing the following fields from the `business_entities` table:
- `email`
- `phone`
- `business_name`
- `billing_state`
- `status`
- `notes`
- `source`
- `custom_fields`

## Current Usage Analysis

### 1. Email Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:207` - Used in business entity mapping
- `components/invoice/business-entity/business-entity-form.tsx:78,116,187,422` - Form field and data handling
- `components/invoice/business-entity/business-entity-search.tsx:82,189` - Search results display
- `components/dashboard/admin-dashboard.tsx:218` - Admin dashboard display

#### **Impact Assessment:**
- **High Impact** - Email is used in multiple UI components for display and form handling
- **Required Changes:** Remove email field from forms, search results, and admin displays
- **Data Loss:** All existing email data will be lost

### 2. Phone Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:208` - Used in business entity mapping
- `components/invoice/business-entity/business-entity-form.tsx:79,117,188,432` - Form field and data handling
- `components/invoice/business-entity/business-entity-search.tsx:83` - Search results mapping

#### **Impact Assessment:**
- **Medium Impact** - Phone is used in forms and search functionality
- **Required Changes:** Remove phone field from forms and search results
- **Data Loss:** All existing phone data will be lost

### 3. Business Name Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:207` - Used in business entity mapping
- `components/dashboard/business.tsx:108,137` - Business listing display
- `components/invoice/business-entity/business-entity-search.tsx:81` - Search results mapping
- `app/[locale]/dashboard/partners/page.tsx:229,497,614` - Partners page filtering and display

#### **Impact Assessment:**
- **High Impact** - Business name is used extensively for display and search
- **Required Changes:** Update all business listings to use only `name` field
- **Data Loss:** All existing business_name data will be lost

### 4. Billing State Field

#### **Direct Usage in Components:**
- No direct usage found in current codebase

#### **Impact Assessment:**
- **Low Impact** - No current usage detected
- **Required Changes:** None
- **Data Loss:** All existing billing_state data will be lost

### 5. Status Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:223,229` - Used in custom_fields mapping
- `app/[locale]/dashboard/partners/page.tsx:167` - Partners data mapping

#### **Database Usage:**
- `database/external_verification_schema.sql:40` - Index on verification_status
- `database/external_verification_functions.sql:511` - Count query using verification_status

#### **Impact Assessment:**
- **Medium Impact** - Status is used in data mapping and database functions
- **Required Changes:** Update data mapping logic, review database functions
- **Data Loss:** All existing status data will be lost

### 6. Notes Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:225` - Used in business entity mapping
- `components/invoice/business-entity/business-entity-form.tsx:86,125,496` - Form field and data handling
- `components/invoice/business-entity/business-entity-search.tsx:90` - Search results mapping

#### **Impact Assessment:**
- **Medium Impact** - Notes are used in forms and search functionality
- **Required Changes:** Remove notes field from forms and search results
- **Data Loss:** All existing notes data will be lost

### 7. Source Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:226` - Used in business entity mapping

#### **Impact Assessment:**
- **Low Impact** - Only used in data mapping
- **Required Changes:** Remove from data mapping
- **Data Loss:** All existing source data will be lost

### 8. Custom Fields Field

#### **Direct Usage in Components:**
- `components/dashboard/add-new-business.tsx:227-235` - Used extensively for storing additional data

#### **Impact Assessment:**
- **High Impact** - Custom_fields is used to store important metadata
- **Required Changes:** Find alternative storage for PEPPOL info, industry data, etc.
- **Data Loss:** All existing custom_fields data will be lost

## Database Impact Analysis

### **Indexes to Remove:**
- `idx_business_entities_verification_status` (if status field is removed)
- Any other indexes on the removed fields

### **Functions to Update:**
- `database/external_verification_functions.sql` - Update count queries
- Any RLS policies that reference removed fields

### **Staging Table Impact:**
- `business_entities_staging` table has similar fields that may need alignment

## Migration Strategy

### **Phase 1: Code Updates**
1. Remove field references from all components
2. Update data mapping logic
3. Remove form fields from business entity forms
4. Update search and display logic

### **Phase 2: Database Schema**
1. Create backup of current data
2. Remove columns from business_entities table
3. Drop related indexes
4. Update any database functions

### **Phase 3: Testing**
1. Test all affected components
2. Verify data integrity
3. Test search functionality
4. Test form submissions

## Risk Assessment

### **High Risk:**
- **Data Loss:** All data in removed fields will be permanently lost
- **UI Breaking:** Multiple components will break if not updated
- **Search Functionality:** Business name search will be affected

### **Medium Risk:**
- **Form Functionality:** Business entity forms will need updates
- **Admin Dashboard:** Admin displays will need updates

### **Low Risk:**
- **Billing State:** No current usage detected
- **Source Field:** Minimal usage

## Recommendations

### **Before Proceeding:**
1. **Data Backup:** Create complete backup of business_entities table
2. **Alternative Storage:** Consider where to store important data (PEPPOL info, industry data)
3. **Gradual Migration:** Consider removing fields one by one to minimize risk
4. **Testing Environment:** Test changes in development environment first

### **Alternative Approaches:**
1. **Keep Custom Fields:** Consider keeping `custom_fields` for flexible data storage
2. **Soft Removal:** Mark fields as deprecated instead of removing
3. **Data Migration:** Migrate important data to alternative storage before removal

## Files Requiring Updates

### **Components:**
- `components/dashboard/add-new-business.tsx`
- `components/invoice/business-entity/business-entity-form.tsx`
- `components/invoice/business-entity/business-entity-search.tsx`
- `components/dashboard/business.tsx`
- `components/dashboard/admin-dashboard.tsx`
- `app/[locale]/dashboard/partners/page.tsx`

### **Database Files:**
- `database/external_verification_schema.sql`
- `database/external_verification_functions.sql`
- Any other SQL files referencing these fields

### **Documentation:**
- Update all documentation referencing these fields
- Update CSV import templates
- Update API documentation

## Conclusion

This schema change will have **significant impact** on the application, particularly:
- **High impact** on UI components and forms
- **Data loss** for all removed fields
- **Breaking changes** to search and display functionality

**Recommendation:** Proceed with extreme caution and consider keeping `custom_fields` for flexible data storage, especially for PEPPOL information and industry data that may be needed in the future.

---

**Audit Date:** $(date)
**Auditor:** AI Assistant
**Status:** Pending Approval
