-- Migration: Remove all billing and invoice related tables
-- This script removes bills, bill_items, expenses, invoices, invoice_items, and payments tables

-- Step 1: Drop dependent views first (if any exist)
DROP VIEW IF EXISTS invoice_summary_view CASCADE;
DROP VIEW IF EXISTS bill_summary_view CASCADE;
DROP VIEW IF EXISTS expense_summary_view CASCADE;
DROP VIEW IF EXISTS payment_summary_view CASCADE;

-- Step 2: Drop foreign key constraints that reference these tables
-- Remove foreign keys from webhook_events table
ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_invoice_id_fkey;
ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_payment_id_fkey;

-- Step 3: Drop the tables in the correct order (dependent tables first)

-- Drop line items tables first (they reference the main tables)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;

-- Drop payments table (references invoices)
DROP TABLE IF EXISTS payments CASCADE;

-- Drop main transaction tables
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;

-- Step 4: Drop any indexes related to these tables
DROP INDEX IF EXISTS idx_invoices_tenant_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_invoices_due_date;
DROP INDEX IF EXISTS idx_bills_tenant_id;
DROP INDEX IF EXISTS idx_bills_status;
DROP INDEX IF EXISTS idx_bills_due_date;
DROP INDEX IF EXISTS idx_expenses_tenant_id;
DROP INDEX IF EXISTS idx_expenses_status;
DROP INDEX IF EXISTS idx_payments_tenant_id;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_invoice_items_invoice_id;
DROP INDEX IF EXISTS idx_bill_items_bill_id;

-- Step 5: Drop any functions that specifically reference these tables
DROP FUNCTION IF EXISTS calculate_invoice_totals(UUID);
DROP FUNCTION IF EXISTS calculate_bill_totals(UUID);
DROP FUNCTION IF EXISTS update_invoice_status(UUID);
DROP FUNCTION IF EXISTS update_bill_status(UUID);
DROP FUNCTION IF EXISTS process_payment(UUID, NUMERIC);
DROP FUNCTION IF EXISTS get_invoice_summary(UUID);
DROP FUNCTION IF EXISTS get_bill_summary(UUID);

-- Step 6: Drop any triggers related to these tables
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_items;
DROP TRIGGER IF EXISTS trigger_update_bill_totals ON bill_items;
DROP TRIGGER IF EXISTS trigger_update_payment_status ON payments;
DROP TRIGGER IF EXISTS trigger_validate_invoice ON invoices;
DROP TRIGGER IF EXISTS trigger_validate_bill ON bills;

-- Step 7: Drop any RLS policies for these tables
-- (These are automatically dropped when tables are dropped, but being explicit)

-- Step 8: Verify the removal
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
    AND (ccu.table_name LIKE '%invoice%' OR ccu.table_name LIKE '%bill%' OR ccu.table_name LIKE '%expense%' OR ccu.table_name LIKE '%payment%')
    AND tc.table_schema = 'public';

-- Step 9: Clean up any orphaned sequences or other objects
-- (PostgreSQL will automatically clean up most dependencies)

-- Migration completed
-- All billing and invoice related tables have been removed
