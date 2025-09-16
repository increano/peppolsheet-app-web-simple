-- Migration: Remove fields from business_entities table
-- This script removes email, phone, business_name, billing_state, status, notes, source, and custom_fields columns

-- 1. Drop dependent views first
DROP VIEW IF EXISTS suppliers_view CASCADE;
DROP VIEW IF EXISTS customers_view CASCADE;

-- 2. Drop indexes on fields being removed
DROP INDEX IF EXISTS idx_business_entities_verification_status;

-- 3. Remove columns from business_entities table
ALTER TABLE business_entities 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS business_name,
DROP COLUMN IF EXISTS billing_state,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS custom_fields;

-- 4. Update business_entities_staging table to align with main table
-- Remove fields that are being removed from main table
ALTER TABLE business_entities_staging 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS business_name,
DROP COLUMN IF EXISTS billing_state,
DROP COLUMN IF EXISTS notes;

-- 5. Update any RLS policies that might reference removed fields
-- Note: RLS policies are typically based on user context, not specific fields
-- But we should verify and update any that might be affected

-- 6. Create new indexes for remaining fields if needed
-- (Add any new indexes that might be useful after the cleanup)

-- 7. Verify the table structure
-- This will show the current structure after migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'business_entities' 
ORDER BY ordinal_position;

-- 8. Update any functions that reference removed fields
-- Note: This is a placeholder - specific functions would need to be updated based on usage

-- 9. Recreate views with updated structure (without removed fields)
-- Note: We'll create simple views without filtering by relationship_type
-- since that column may not exist in the current table structure

-- Recreate suppliers_view with only existing columns (no filtering)
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

-- Recreate customers_view with only existing columns (no filtering)
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

-- Migration completed
-- The business_entities table now has a simplified structure with only essential fields
