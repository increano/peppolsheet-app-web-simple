-- External Verification System Database Schema
-- Environment-Based Role System Implementation

-- 1. Add verification fields to business_entities table
ALTER TABLE business_entities 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Create entity_flags table for admin review
CREATE TABLE IF NOT EXISTS entity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_entity_id UUID REFERENCES business_entities(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('suspicious', 'duplicate', 'missing_data', 'format_issue')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 3. Create system_audit_log table for all role-based actions
CREATE TABLE IF NOT EXISTS system_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('admin', 'support', 'editor', 'technical')),
    action_type VARCHAR(50) NOT NULL,
    target_entity_id UUID REFERENCES business_entities(id),
    action_details JSONB,
    performed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_flags_business_entity_id ON entity_flags(business_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_flags_resolved ON entity_flags(resolved);
CREATE INDEX IF NOT EXISTS idx_entity_flags_flag_type ON entity_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_user_id ON system_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_user_role ON system_audit_log(user_role);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_performed_at ON system_audit_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_business_entities_verification_status ON business_entities(verification_status);
CREATE INDEX IF NOT EXISTS idx_business_entities_flagged_for_review ON business_entities(flagged_for_review);

-- 5. Create RLS policies for entity_flags
ALTER TABLE entity_flags ENABLE ROW LEVEL SECURITY;

-- Admin can see all flags
CREATE POLICY "Admin can view all entity flags" ON entity_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- Admin can insert/update flags
CREATE POLICY "Admin can manage entity flags" ON entity_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = current_setting('app.admin_user_email', true)
        )
    );

-- 6. Create RLS policies for system_audit_log
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- All role users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON system_audit_log
    FOR SELECT USING (user_id = auth.uid());

-- All role users can insert their own audit logs
CREATE POLICY "Users can insert their own audit logs" ON system_audit_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 7. Create function to detect user role from environment
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

-- 8. Create function to log audit actions
CREATE OR REPLACE FUNCTION log_audit_action(
    p_action_type VARCHAR(50),
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
    INSERT INTO system_audit_log (
        user_id, 
        user_role, 
        action_type, 
        target_entity_id, 
        action_details
    ) VALUES (
        v_user_id,
        v_user_role,
        p_action_type,
        p_target_entity_id,
        p_action_details
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
