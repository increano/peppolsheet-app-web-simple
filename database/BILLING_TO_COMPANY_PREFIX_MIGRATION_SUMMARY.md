# Billing to Company Prefix Migration Summary

This document summarizes all the changes required to rename `billing_` prefix to `company_` prefix in the business_entities and business_entities_staging tables, including all related functions, triggers, RLS policies, and application code.

## Database Changes

### 1. Column Renames

#### business_entities table:
```sql
ALTER TABLE business_entities 
RENAME COLUMN billing_street_address TO company_street_address;

ALTER TABLE business_entities 
RENAME COLUMN billing_city TO company_city;

ALTER TABLE business_entities 
RENAME COLUMN billing_state TO company_state;

ALTER TABLE business_entities 
RENAME COLUMN billing_postal_code TO company_postal_code;

ALTER TABLE business_entities 
RENAME COLUMN billing_country TO company_country;
```

#### business_entities_staging table:
```sql
ALTER TABLE business_entities_staging 
RENAME COLUMN billing_street_address TO company_street_address;

ALTER TABLE business_entities_staging 
RENAME COLUMN billing_city TO company_city;

ALTER TABLE business_entities_staging 
RENAME COLUMN billing_state TO company_state;

ALTER TABLE business_entities_staging 
RENAME COLUMN billing_postal_code TO company_postal_code;

ALTER TABLE business_entities_staging 
RENAME COLUMN billing_country TO company_country;
```

### 2. Index Updates

```sql
-- Drop old indexes
DROP INDEX IF EXISTS idx_business_entities_billing_country;
DROP INDEX IF EXISTS idx_business_entities_name_billing_country;
DROP INDEX IF EXISTS idx_business_entities_tax_id_billing_country;

-- Create new indexes
CREATE INDEX idx_business_entities_company_country ON business_entities(company_country);
CREATE INDEX idx_business_entities_name_company_country ON business_entities(name, company_country);
CREATE UNIQUE INDEX idx_business_entities_tax_id_company_country ON business_entities(tax_id, company_country) WHERE tax_id IS NOT NULL;
```

### 3. Function Updates

#### compose_company_address function:
```sql
CREATE OR REPLACE FUNCTION compose_company_address(
    p_street_address TEXT,
    p_city TEXT,
    p_postal_code TEXT,
    p_country TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        p_street_address || 
        CASE WHEN p_city IS NOT NULL THEN ', ' || p_city ELSE '' END ||
        CASE WHEN p_postal_code IS NOT NULL THEN ', ' || p_postal_code ELSE '' END ||
        CASE WHEN p_country IS NOT NULL THEN ', ' || p_country ELSE '' END,
        ''
    );
END;
$$ LANGUAGE plpgsql;
```

#### search_business_entities function:
```sql
CREATE OR REPLACE FUNCTION search_business_entities(
    p_name TEXT DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    name TEXT,
    tax_id TEXT,
    industry TEXT,
    company_street_address TEXT,
    company_city TEXT,
    company_state TEXT,
    company_postal_code TEXT,
    company_country TEXT,
    peppol_scheme TEXT,
    currency TEXT,
    match_type TEXT,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be.id,
        be.name,
        be.tax_id,
        be.industry,
        be.company_street_address,
        be.company_city,
        be.company_state,
        be.company_postal_code,
        be.company_country,
        be.peppol_scheme,
        be.currency,
        CASE 
            WHEN p_tax_id IS NOT NULL AND be.tax_id = p_tax_id THEN 'exact_tax_id'
            WHEN be.name = p_name AND be.company_country = p_country THEN 'exact_name_country'
            WHEN be.name ILIKE '%' || p_name || '%' THEN 'partial_name'
            ELSE 'fuzzy_match'
        END as match_type,
        CASE 
            WHEN p_tax_id IS NOT NULL AND be.tax_id = p_tax_id THEN 100
            WHEN be.name = p_name AND be.company_country = p_country THEN 90
            WHEN be.name ILIKE '%' || p_name || '%' THEN 70
            ELSE 50
        END as match_score
    FROM business_entities be
    WHERE (p_name IS NULL OR be.name ILIKE '%' || p_name || '%')
        AND (p_tax_id IS NULL OR be.tax_id = p_tax_id)
        AND (p_country IS NULL OR be.company_country = p_country)
    ORDER BY match_score DESC, be.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

#### verify_business_entity function:
```sql
CREATE OR REPLACE FUNCTION verify_business_entity(
    p_name TEXT,
    p_tax_id TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name TEXT,
    tax_id TEXT,
    industry TEXT,
    company_street_address TEXT,
    company_city TEXT,
    company_state TEXT,
    company_postal_code TEXT,
    company_country TEXT,
    peppol_scheme TEXT,
    currency TEXT,
    verification_status TEXT,
    match_confidence INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be.id,
        be.name,
        be.tax_id,
        be.industry,
        be.company_street_address,
        be.company_city,
        be.company_state,
        be.company_postal_code,
        be.company_country,
        be.peppol_scheme,
        be.currency,
        CASE 
            WHEN p_tax_id IS NOT NULL AND be.tax_id = p_tax_id THEN 'verified'
            WHEN be.name = p_name AND be.company_country = p_country THEN 'verified'
            ELSE 'unverified'
        END as verification_status,
        CASE 
            WHEN p_tax_id IS NOT NULL AND be.tax_id = p_tax_id THEN 100
            WHEN be.name = p_name AND be.company_country = p_country THEN 90
            ELSE 0
        END as match_confidence
    FROM business_entities be
    WHERE (p_tax_id IS NOT NULL AND be.tax_id = p_tax_id AND be.company_country = p_country)
        OR (be.name = p_name AND be.company_country = p_country);
END;
$$ LANGUAGE plpgsql;
```

### 4. Trigger Updates

#### validate_business_entity_address trigger:
```sql
CREATE OR REPLACE FUNCTION validate_business_entity_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that either both street address and city are provided, or neither
    IF (NEW.company_street_address IS NULL OR NEW.company_street_address = '') OR
       (NEW.company_city IS NULL OR NEW.company_city = '') THEN
        RAISE EXCEPTION 'Both company_street_address and company_city must be provided together';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_validate_business_entity_address ON business_entities;

-- Create new trigger
CREATE TRIGGER trigger_validate_business_entity_address
    BEFORE INSERT OR UPDATE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION validate_business_entity_address();
```

### 5. RLS Policy Updates

```sql
-- Update RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can view business entities" ON business_entities;
CREATE POLICY "Users can view business entities" ON business_entities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert business entities" ON business_entities;
CREATE POLICY "Users can insert business entities" ON business_entities
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update business entities" ON business_entities;
CREATE POLICY "Users can update business entities" ON business_entities
    FOR UPDATE USING (true);
```

### 6. View Updates

#### suppliers_view:
```sql
CREATE OR REPLACE VIEW suppliers_view AS
SELECT 
    id,
    name,
    tax_id,
    company_street_address,
    company_city,
    company_postal_code,
    company_country,
    created_at,
    updated_at,
    created_by,
    tenant_id
FROM business_entities;
```

#### customers_view:
```sql
CREATE OR REPLACE VIEW customers_view AS
SELECT 
    id,
    name,
    tax_id,
    company_street_address,
    company_city,
    company_postal_code,
    company_country,
    created_at,
    updated_at,
    created_by,
    tenant_id
FROM business_entities;
```

## Application Code Changes

### 1. TypeScript Interface Updates

#### lib/entity-flagging.ts:
- Updated `BusinessEntity` interface to use `company_` prefix
- Updated function references to use new field names

#### lib/staging-service.ts:
- Updated all database field mappings from `billing_` to `company_`
- Updated all function parameters and return types

### 2. Component Updates

#### components/invoice/business-entity/business-entity-form.tsx:
- Updated form field mappings to use `company_` prefix

### 3. Template Updates

#### public/business_entities_import_template.csv:
- Updated CSV header from `billing_address` to `company_address`
- Updated all related field names

## Documentation Updates

### 1. Database Schema Files

#### database/create_staging_table.sql:
- Updated table definition to use `company_` prefix

#### database/rollback_and_new_verification_system.sql:
- Updated all function parameters and table references
- Updated trigger validation logic

#### database/remove_business_entities_fields.sql:
- Updated view definitions to use `company_` prefix

### 2. Analysis Documents

#### BUSINESS_ENTITIES_VS_E_INVOICE_ANALYSIS.md:
- Updated field mapping tables
- Updated function examples
- Updated SQL examples

## Migration Steps

1. **Backup the database** before making any changes
2. **Run the database migration** using the provided SQL scripts
3. **Deploy the updated application code**
4. **Test all functionality** to ensure everything works correctly
5. **Update any external integrations** that might reference the old field names

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting the application code changes
2. Running the reverse migration to rename columns back to `billing_` prefix
3. Restoring any functions, triggers, and policies to their original state

## Testing Checklist

- [ ] Database column renames successful
- [ ] Indexes created correctly
- [ ] Functions updated and working
- [ ] Triggers functioning properly
- [ ] RLS policies working
- [ ] Application code compiles without errors
- [ ] Business entity creation works
- [ ] Business entity search works
- [ ] CSV import works with new field names
- [ ] All existing data preserved
- [ ] No breaking changes to existing functionality
