-- =============================================
-- ROLLBACK AND NEW VERIFICATION SYSTEM IMPLEMENTATION
-- =============================================
-- This script:
-- 1. Rolls back the previous verification system
-- 2. Implements the new staging-based verification system
-- 3. Maintains data integrity throughout the process

-- =============================================
-- STEP 1: ROLLBACK PREVIOUS VERIFICATION SYSTEM
-- =============================================

-- Drop all verification-related functions
DROP FUNCTION IF EXISTS admin_approve_entity(UUID);
DROP FUNCTION IF EXISTS admin_reject_entity(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_merge_entities(UUID, UUID[]);
DROP FUNCTION IF EXISTS admin_flag_entity(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS admin_get_flagged_entities();
DROP FUNCTION IF EXISTS support_view_user_data(UUID);
DROP FUNCTION IF EXISTS support_reset_user_password(UUID);
DROP FUNCTION IF EXISTS support_disable_user_account(UUID, TEXT);
DROP FUNCTION IF EXISTS editor_update_system_content(VARCHAR, JSONB);
DROP FUNCTION IF EXISTS editor_manage_templates(JSONB);
DROP FUNCTION IF EXISTS technical_view_system_metrics();
DROP FUNCTION IF EXISTS technical_cleanup_old_data(INTEGER);
DROP FUNCTION IF EXISTS technical_export_audit_log(DATE, DATE);
DROP FUNCTION IF EXISTS get_user_role(TEXT);
DROP FUNCTION IF EXISTS log_audit_action(VARCHAR, UUID, JSONB);

-- Drop verification-related tables
DROP TABLE IF EXISTS entity_flags CASCADE;
DROP TABLE IF EXISTS system_audit_log CASCADE;

-- Remove verification columns from business_entities table
ALTER TABLE business_entities 
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS flagged_for_review,
DROP COLUMN IF EXISTS admin_notes;

-- Drop verification-related indexes
DROP INDEX IF EXISTS idx_entity_flags_business_entity_id;
DROP INDEX IF EXISTS idx_entity_flags_resolved;
DROP INDEX IF EXISTS idx_entity_flags_flag_type;
DROP INDEX IF EXISTS idx_system_audit_log_user_id;
DROP INDEX IF EXISTS idx_system_audit_log_user_role;
DROP INDEX IF EXISTS idx_system_audit_log_performed_at;
DROP INDEX IF EXISTS idx_business_entities_verification_status;
DROP INDEX IF EXISTS idx_business_entities_flagged_for_review;

-- =============================================
-- STEP 2: CREATE NEW STAGING-BASED VERIFICATION SYSTEM
-- =============================================

-- Create staging table for unverified business entities
CREATE TABLE business_entities_staging (
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
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'archived')),
    admin_notes TEXT,
    source_type VARCHAR(50) DEFAULT 'manual' CHECK (source_type IN ('manual', 'csv_import', 'api')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Create staging entity flags table
CREATE TABLE staging_entity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staging_entity_id UUID REFERENCES business_entities_staging(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('suspicious', 'duplicate', 'missing_data', 'format_issue')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Create system audit log for staging operations
CREATE TABLE staging_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('admin', 'support', 'editor', 'technical')),
    action_type VARCHAR(50) NOT NULL,
    staging_entity_id UUID REFERENCES business_entities_staging(id),
    target_entity_id UUID REFERENCES business_entities(id),
    action_details JSONB,
    performed_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_business_entities_staging_status ON business_entities_staging(verification_status);
CREATE INDEX idx_business_entities_staging_submitted_at ON business_entities_staging(submitted_at);
CREATE INDEX idx_business_entities_staging_submitted_by ON business_entities_staging(submitted_by);
CREATE INDEX idx_staging_entity_flags_staging_entity_id ON staging_entity_flags(staging_entity_id);
CREATE INDEX idx_staging_entity_flags_resolved ON staging_entity_flags(resolved);
CREATE INDEX idx_staging_entity_flags_flag_type ON staging_entity_flags(flag_type);
CREATE INDEX idx_staging_audit_log_user_id ON staging_audit_log(user_id);
CREATE INDEX idx_staging_audit_log_user_role ON staging_audit_log(user_role);
CREATE INDEX idx_staging_audit_log_performed_at ON staging_audit_log(performed_at);

-- =============================================
-- STEP 3: CREATE RLS POLICIES FOR STAGING TABLES
-- =============================================

-- Enable RLS on staging tables
ALTER TABLE business_entities_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_entity_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for business_entities_staging
-- Users can see their own submissions, admins can see all
CREATE POLICY "Users can view their own staging submissions" ON business_entities_staging
    FOR SELECT USING (
        submitted_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- Only admins can update staging entities
CREATE POLICY "Only admins can update staging entities" ON business_entities_staging
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- Users can insert their own submissions
CREATE POLICY "Users can insert their own staging submissions" ON business_entities_staging
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- RLS Policy for staging_entity_flags
-- Admins can see all flags
CREATE POLICY "Admins can view all staging flags" ON staging_entity_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- Only admins can manage staging flags
CREATE POLICY "Only admins can manage staging flags" ON staging_entity_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- RLS Policy for staging_audit_log
-- Users can view their own audit logs
CREATE POLICY "Users can view their own staging audit logs" ON staging_audit_log
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own audit logs
CREATE POLICY "Users can insert their own staging audit logs" ON staging_audit_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- STEP 4: CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to detect user role from environment
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS VARCHAR(50) AS $$
DECLARE
    admin_email TEXT;
    support_emails TEXT[];
    editor_emails TEXT[];
    technical_emails TEXT[];
BEGIN
    -- Get environment variables (these will be set in the application)
    admin_email := current_setting('app.admin_user_email', true);
    support_emails := string_to_array(current_setting('app.support_user_emails', true), ',');
    editor_emails := string_to_array(current_setting('app.editor_user_emails', true), ',');
    technical_emails := string_to_array(current_setting('app.technical_user_emails', true), ',');
    
    -- Check role based on email
    IF user_email = admin_email THEN
        RETURN 'admin';
    ELSIF user_email = ANY(support_emails) THEN
        RETURN 'support';
    ELSIF user_email = ANY(editor_emails) THEN
        RETURN 'editor';
    ELSIF user_email = ANY(technical_emails) THEN
        RETURN 'technical';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log staging audit actions
CREATE OR REPLACE FUNCTION log_staging_audit_action(
    p_action_type VARCHAR(50),
    p_staging_entity_id UUID DEFAULT NULL,
    p_target_entity_id UUID DEFAULT NULL,
    p_action_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get user email
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = v_user_id;
    
    -- Get user role
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'User has no assigned role';
    END IF;
    
    -- Insert audit log
    INSERT INTO staging_audit_log (
        user_id, 
        user_role, 
        action_type, 
        staging_entity_id,
        target_entity_id,
        action_details
    ) VALUES (
        v_user_id,
        v_user_role,
        p_action_type,
        p_staging_entity_id,
        p_target_entity_id,
        p_action_details
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 5: CREATE STAGING MANAGEMENT FUNCTIONS
-- =============================================

-- Function to submit entity to staging
CREATE OR REPLACE FUNCTION submit_entity_to_staging(
    p_name TEXT,
    p_business_name TEXT DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_company_street_address TEXT DEFAULT NULL,
    p_company_city TEXT DEFAULT NULL,
    p_company_state TEXT DEFAULT NULL,
    p_company_postal_code TEXT DEFAULT NULL,
    p_company_country TEXT DEFAULT 'US',
    p_peppol_scheme TEXT DEFAULT NULL,
    p_currency TEXT DEFAULT 'USD',
    p_source_type VARCHAR(50) DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
    v_staging_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Insert into staging
    INSERT INTO business_entities_staging (
        name, business_name, tax_id, email, phone, website,
            industry, company_street_address, company_city, company_state,
    company_postal_code, company_country, peppol_scheme, currency,
        submitted_by, source_type
    ) VALUES (
        p_name, p_business_name, p_tax_id, p_email, p_phone, p_website,
        p_industry, p_company_street_address, p_company_city, p_company_state,
        p_company_postal_code, p_company_country, p_peppol_scheme, p_currency,
        v_user_id, p_source_type
    ) RETURNING id INTO v_staging_id;
    
    -- Log audit action
    PERFORM log_staging_audit_action(
        'submit_entity',
        v_staging_id,
        NULL,
        jsonb_build_object('source_type', p_source_type)
    );
    
    RETURN v_staging_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve staging entity
CREATE OR REPLACE FUNCTION approve_staging_entity(staging_id UUID)
RETURNS UUID AS $$
DECLARE
    v_entity_data business_entities_staging%ROWTYPE;
    v_new_entity_id UUID;
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can approve staging entities';
    END IF;
    
    -- Get staging entity data
    SELECT * INTO v_entity_data 
    FROM business_entities_staging 
    WHERE id = staging_id AND verification_status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Staging entity not found or not pending';
    END IF;
    
    -- Insert into production business_entities table
    INSERT INTO business_entities (
        name, business_name, tax_id, email, phone, website,
            industry, company_street_address, company_city, company_state,
    company_postal_code, company_country, peppol_scheme, currency
    ) VALUES (
        v_entity_data.name, v_entity_data.business_name, v_entity_data.tax_id,
        v_entity_data.email, v_entity_data.phone, v_entity_data.website,
        v_entity_data.industry, v_entity_data.company_street_address,
        v_entity_data.company_city, v_entity_data.company_state,
        v_entity_data.company_postal_code, v_entity_data.company_country,
        v_entity_data.peppol_scheme, v_entity_data.currency
    ) RETURNING id INTO v_new_entity_id;
    
    -- Update staging status
    UPDATE business_entities_staging 
    SET 
        verification_status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = staging_id;
    
    -- Mark all flags as resolved
    UPDATE staging_entity_flags 
    SET 
        resolved = true,
        resolved_by = auth.uid(),
        resolved_at = now(),
        resolution_notes = 'Entity approved and moved to production'
    WHERE staging_entity_id = staging_id AND resolved = false;
    
    -- Log audit action
    PERFORM log_staging_audit_action(
        'approve_staging_entity',
        staging_id,
        v_new_entity_id,
        jsonb_build_object('action', 'approved', 'new_entity_id', v_new_entity_id)
    );
    
    RETURN v_new_entity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject staging entity
CREATE OR REPLACE FUNCTION reject_staging_entity(staging_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can reject staging entities';
    END IF;
    
    -- Update staging status
    UPDATE business_entities_staging 
    SET 
        verification_status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = reason
    WHERE id = staging_id AND verification_status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Staging entity not found or not pending';
    END IF;
    
    -- Mark all flags as resolved
    UPDATE staging_entity_flags 
    SET 
        resolved = true,
        resolved_by = auth.uid(),
        resolved_at = now(),
        resolution_notes = 'Entity rejected: ' || reason
    WHERE staging_entity_id = staging_id AND resolved = false;
    
    -- Log audit action
    PERFORM log_staging_audit_action(
        'reject_staging_entity',
        staging_id,
        NULL,
        jsonb_build_object('action', 'rejected', 'reason', reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending staging entities for admin review
CREATE OR REPLACE FUNCTION get_pending_staging_entities()
RETURNS TABLE (
    staging_id UUID,
    entity_name TEXT,
    entity_email TEXT,
    entity_tax_id TEXT,
    submitted_at TIMESTAMPTZ,
    source_type VARCHAR(50),
    flag_count INTEGER,
    flags JSONB
) AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can view pending staging entities';
    END IF;
    
    RETURN QUERY
    SELECT 
        bes.id as staging_id,
        bes.business_name as entity_name,
        bes.email as entity_email,
        bes.tax_id as entity_tax_id,
        bes.submitted_at,
        bes.source_type,
        COUNT(sef.id)::INTEGER as flag_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', sef.id,
                    'type', sef.flag_type,
                    'description', sef.description,
                    'created_at', sef.created_at,
                    'resolved', sef.resolved
                ) ORDER BY sef.created_at DESC
            ) FILTER (WHERE sef.id IS NOT NULL),
            '[]'::jsonb
        ) as flags
    FROM business_entities_staging bes
    LEFT JOIN staging_entity_flags sef ON bes.id = sef.staging_entity_id AND sef.resolved = false
    WHERE bes.verification_status = 'pending'
    GROUP BY bes.id, bes.business_name, bes.email, bes.tax_id, bes.submitted_at, bes.source_type
    ORDER BY bes.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to flag staging entity
CREATE OR REPLACE FUNCTION flag_staging_entity(staging_id UUID, flag_type VARCHAR, description TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can flag staging entities';
    END IF;
    
    -- Insert flag
    INSERT INTO staging_entity_flags (
        staging_entity_id,
        flag_type,
        description
    ) VALUES (
        staging_id,
        flag_type,
        description
    );
    
    -- Log audit action
    PERFORM log_staging_audit_action(
        'flag_staging_entity',
        staging_id,
        NULL,
        jsonb_build_object('flag_type', flag_type, 'description', description)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 6: CREATE TRIGGERS FOR AUTOMATIC FLAGGING
-- =============================================

-- Function to automatically flag suspicious entities
CREATE OR REPLACE FUNCTION auto_flag_staging_entity()
RETURNS TRIGGER AS $$
BEGIN
    -- Flag generic names
    IF NEW.name ILIKE '%test%' OR NEW.name ILIKE '%example%' OR NEW.name ILIKE '%demo%' THEN
        INSERT INTO staging_entity_flags (staging_entity_id, flag_type, description)
        VALUES (NEW.id, 'suspicious', 'Generic or suspicious company name detected');
    END IF;
    
    -- Flag missing contact information
    IF (NEW.email IS NULL OR NEW.email = '') AND (NEW.phone IS NULL OR NEW.phone = '') THEN
        INSERT INTO staging_entity_flags (staging_entity_id, flag_type, description)
        VALUES (NEW.id, 'missing_data', 'No contact information provided (email or phone required)');
    END IF;
    
    -- Flag incomplete address
        IF (NEW.company_street_address IS NULL OR NEW.company_street_address = '') OR
       (NEW.company_city IS NULL OR NEW.company_city = '') THEN
        INSERT INTO staging_entity_flags (staging_entity_id, flag_type, description)
        VALUES (NEW.id, 'missing_data', 'Incomplete billing address information');
    END IF;
    
    -- Flag missing tax ID
    IF NEW.tax_id IS NULL OR NEW.tax_id = '' THEN
        INSERT INTO staging_entity_flags (staging_entity_id, flag_type, description)
        VALUES (NEW.id, 'missing_data', 'No tax ID provided');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic flagging
CREATE TRIGGER trigger_auto_flag_staging_entity
    AFTER INSERT ON business_entities_staging
    FOR EACH ROW
    EXECUTE FUNCTION auto_flag_staging_entity();

-- =============================================
-- STEP 7: CREATE CLEANUP FUNCTIONS
-- =============================================

-- Function to cleanup old staging data
CREATE OR REPLACE FUNCTION cleanup_old_staging_data(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin or technical
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role NOT IN ('admin', 'technical') THEN
        RAISE EXCEPTION 'Only admin or technical users can cleanup staging data';
    END IF;
    
    -- Archive old approved/rejected entities
    UPDATE business_entities_staging 
    SET verification_status = 'archived'
    WHERE verification_status IN ('approved', 'rejected') 
    AND reviewed_at < now() - (retention_days || ' days')::INTERVAL;
    
    -- Delete old audit logs
    DELETE FROM staging_audit_log 
    WHERE performed_at < now() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    PERFORM log_staging_audit_action(
        'cleanup_staging_data',
        NULL,
        NULL,
        jsonb_build_object('retention_days', retention_days, 'deleted_count', v_deleted_count)
    );
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 8: VERIFICATION COMPLETE
-- =============================================

-- Log the migration completion (only if admin user exists)
DO $$
DECLARE
    v_admin_user_id UUID;
    v_admin_email TEXT;
BEGIN
    -- Get admin email from settings
    v_admin_email := current_setting('app.admin_user_email', true);
    
    -- Only log if admin email is configured and user exists
    IF v_admin_email IS NOT NULL THEN
        SELECT id INTO v_admin_user_id 
        FROM auth.users 
        WHERE email = v_admin_email 
        LIMIT 1;
        
        IF v_admin_user_id IS NOT NULL THEN
            INSERT INTO staging_audit_log (user_id, user_role, action_type, action_details)
            VALUES (
                v_admin_user_id,
                'admin',
                'system_migration',
                jsonb_build_object(
                    'migration_type', 'rollback_and_new_verification_system',
                    'timestamp', now(),
                    'status', 'completed'
                )
            );
        END IF;
    END IF;
    
    -- Display completion message
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New staging-based verification system is now active.';
    RAISE NOTICE 'Previous verification system has been rolled back.';
    RAISE NOTICE 'Production business_entities table is now clean and verification-free.';
    
    -- Display configuration reminder if needed
    IF v_admin_email IS NULL THEN
        RAISE NOTICE 'WARNING: ADMIN_USER_EMAIL environment variable is not set.';
        RAISE NOTICE 'Please configure ADMIN_USER_EMAIL in your .env.local file for admin functionality.';
    ELSIF v_admin_user_id IS NULL THEN
        RAISE NOTICE 'WARNING: Admin user with email % does not exist in auth.users table.', v_admin_email;
        RAISE NOTICE 'Please ensure the admin user exists or update ADMIN_USER_EMAIL in your .env.local file.';
    END IF;
END $$;
