-- Migration: Remove all suppliers and customers tables
-- This script removes all supplier and customer related tables and their dependencies

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS suppliers_view CASCADE;
DROP VIEW IF EXISTS customers_view CASCADE;

-- Step 2: Drop foreign key constraints that reference suppliers/customers tables
-- Remove foreign keys from invoices table
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;

-- Remove foreign keys from bills table
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_supplier_id_fkey;

-- Remove foreign keys from expenses table
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_supplier_id_fkey;

-- Remove foreign keys from contacts table (if any)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_supplier_id_fkey;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_customer_id_fkey;

-- Step 3: Drop the tables in the correct order (dependent tables first)

-- Drop new suppliers table (links to business_entities)
DROP TABLE IF EXISTS suppliers CASCADE;

-- Drop new customers table (links to business_entities)
DROP TABLE IF EXISTS customers CASCADE;

-- Drop old suppliers table
DROP TABLE IF EXISTS suppliers_old CASCADE;

-- Drop old customers table
DROP TABLE IF EXISTS customers_old CASCADE;

-- Step 4: Remove columns that reference suppliers/customers from other tables

-- Remove customer_id from invoices table
ALTER TABLE invoices DROP COLUMN IF EXISTS customer_id;

-- Remove supplier_id from bills table
ALTER TABLE bills DROP COLUMN IF EXISTS supplier_id;

-- Remove supplier_id from expenses table
ALTER TABLE expenses DROP COLUMN IF EXISTS supplier_id;

-- Step 5: Drop any indexes related to suppliers/customers
DROP INDEX IF EXISTS idx_suppliers_tenant_id;
DROP INDEX IF EXISTS idx_suppliers_business_entity_id;
DROP INDEX IF EXISTS idx_customers_tenant_id;
DROP INDEX IF EXISTS idx_customers_business_entity_id;
DROP INDEX IF EXISTS idx_suppliers_old_tenant_id;
DROP INDEX IF EXISTS idx_customers_old_tenant_id;

-- Step 6: Drop any functions that specifically reference suppliers/customers
-- (These would be custom functions that only work with these tables)
DROP FUNCTION IF EXISTS get_supplier_info(UUID);
DROP FUNCTION IF EXISTS get_customer_info(UUID);
DROP FUNCTION IF EXISTS search_suppliers(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS search_customers(TEXT, TEXT, INTEGER);

-- Step 7: Drop any triggers related to suppliers/customers
DROP TRIGGER IF EXISTS trigger_validate_supplier ON suppliers;
DROP TRIGGER IF EXISTS trigger_validate_customer ON customers;
DROP TRIGGER IF EXISTS trigger_validate_supplier_old ON suppliers_old;
DROP TRIGGER IF EXISTS trigger_validate_customer_old ON customers_old;

-- Step 8: Drop any RLS policies for suppliers/customers tables
-- (These are automatically dropped when tables are dropped, but being explicit)

-- Step 9: Update any remaining references in the application
-- Note: This step would require updating application code separately

-- Step 10: Verify the removal
-- Check that no foreign key constraints remain that reference the dropped tables
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name LIKE '%supplier%' OR ccu.table_name LIKE '%customer%')
    AND tc.table_schema = 'public';

-- Step 11: Clean up any orphaned sequences or other objects
-- (PostgreSQL will automatically clean up most dependencies)

-- Migration completed
-- All suppliers and customers tables have been removed
