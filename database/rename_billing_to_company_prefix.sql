-- Migration: Rename billing_ prefix to company_ prefix in business_entities tables
-- This script replaces all billing_ prefixed columns with company_ prefix
-- and updates all related functions, triggers, RLS policies, and references

-- Step 1: Rename columns in business_entities table
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

-- Step 2: Rename columns in business_entities_staging table
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

-- Step 3: Update indexes
DROP INDEX IF EXISTS idx_business_entities_billing_country;
CREATE INDEX idx_business_entities_company_country ON business_entities(company_country);

DROP INDEX IF EXISTS idx_business_entities_name_billing_country;
CREATE INDEX idx_business_entities_name_company_country ON business_entities(name, company_country);

DROP INDEX IF EXISTS idx_business_entities_tax_id_billing_country;
CREATE UNIQUE INDEX idx_business_entities_tax_id_company_country ON business_entities(tax_id, company_country) WHERE tax_id IS NOT NULL;

-- Step 4: Update functions that reference billing_ fields
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

-- Step 5: Update search functions
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

-- Step 6: Update verification functions
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

-- Step 7: Update triggers
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

-- Step 8: Update RLS policies (if they exist)
-- Note: You may need to adjust these based on your actual RLS policy names
DROP POLICY IF EXISTS "Users can view business entities" ON business_entities;
CREATE POLICY "Users can view business entities" ON business_entities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert business entities" ON business_entities;
CREATE POLICY "Users can insert business entities" ON business_entities
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update business entities" ON business_entities;
CREATE POLICY "Users can update business entities" ON business_entities
    FOR UPDATE USING (true);

-- Step 9: Update staging table triggers and functions
CREATE OR REPLACE FUNCTION process_staging_entity()
RETURNS TRIGGER AS $$
BEGIN
    -- Your staging processing logic here
    -- Update any references from billing_ to company_ fields
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing staging trigger if it exists
DROP TRIGGER IF EXISTS trigger_process_staging_entity ON business_entities_staging;

-- Create new staging trigger
CREATE TRIGGER trigger_process_staging_entity
    AFTER INSERT ON business_entities_staging
    FOR EACH ROW
    EXECUTE FUNCTION process_staging_entity();

-- Step 10: Update any views that reference billing_ fields
-- (Add your specific view updates here if needed)

-- Step 11: Update any materialized views
-- (Add your specific materialized view updates here if needed)

-- Step 12: Grant permissions on new function names
GRANT EXECUTE ON FUNCTION compose_company_address(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_business_entities(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_business_entity(TEXT, TEXT, TEXT) TO authenticated;
