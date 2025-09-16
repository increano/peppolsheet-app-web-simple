-- Create staging table for business entities
CREATE TABLE IF NOT EXISTS business_entities_staging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_name TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    industry TEXT,
    company_street_address TEXT,
    company_city TEXT,
    company_state TEXT,
    company_postal_code TEXT,
    company_country TEXT DEFAULT 'US',
    peppol_scheme TEXT,
    currency TEXT DEFAULT 'USD',
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('customer', 'supplier')),
    customer_number TEXT,
    supplier_number TEXT,
    storecove_receiver_identifier TEXT,
    storecove_sender_identifier TEXT,
    payment_terms TEXT,
    credit_limit TEXT,
    preferred_payment_method TEXT,
    bank_account_number TEXT,
    bank_routing_number TEXT,
    bank_name TEXT,
    credit_rating TEXT,
    submitted_by TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_entities_staging_status ON business_entities_staging(status);
CREATE INDEX IF NOT EXISTS idx_business_entities_staging_submitted_by ON business_entities_staging(submitted_by);
CREATE INDEX IF NOT EXISTS idx_business_entities_staging_submitted_at ON business_entities_staging(submitted_at);

-- Add RLS policies
ALTER TABLE business_entities_staging ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own staging entities
CREATE POLICY "Users can insert their own staging entities" ON business_entities_staging
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own staging entities
CREATE POLICY "Users can view their own staging entities" ON business_entities_staging
    FOR SELECT USING (true);

-- Allow admins to update staging entities
CREATE POLICY "Admins can update staging entities" ON business_entities_staging
    FOR UPDATE USING (true);

-- Allow admins to delete staging entities
CREATE POLICY "Admins can delete staging entities" ON business_entities_staging
    FOR DELETE USING (true);
