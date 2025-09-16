-- External Verification System Database Functions
-- Role-Based Functions for Admin, Support, Editor, and Technical Users

-- =============================================
-- ADMIN FUNCTIONS - Entity Review & Management
-- =============================================

-- Function to approve a business entity
CREATE OR REPLACE FUNCTION admin_approve_entity(entity_id UUID)
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
        RAISE EXCEPTION 'Only admin users can approve entities';
    END IF;
    
    -- Update entity status
    UPDATE business_entities 
    SET 
        verification_status = 'approved',
        flagged_for_review = false,
        admin_notes = COALESCE(admin_notes, '') || E'\nApproved by admin on ' || now()::text,
        updated_at = now()
    WHERE id = entity_id;
    
    -- Mark flags as resolved
    UPDATE entity_flags 
    SET 
        resolved = true,
        resolved_by = auth.uid(),
        resolved_at = now(),
        resolution_notes = 'Entity approved by admin'
    WHERE business_entity_id = entity_id AND resolved = false;
    
    -- Log audit action
    PERFORM log_audit_action(
        'approve_entity',
        entity_id,
        jsonb_build_object('action', 'approve', 'notes', 'Entity approved by admin')
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a business entity
CREATE OR REPLACE FUNCTION admin_reject_entity(entity_id UUID, reason TEXT)
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
        RAISE EXCEPTION 'Only admin users can reject entities';
    END IF;
    
    -- Update entity status
    UPDATE business_entities 
    SET 
        verification_status = 'rejected',
        flagged_for_review = false,
        admin_notes = COALESCE(admin_notes, '') || E'\nRejected by admin on ' || now()::text || ': ' || reason,
        updated_at = now()
    WHERE id = entity_id;
    
    -- Mark flags as resolved
    UPDATE entity_flags 
    SET 
        resolved = true,
        resolved_by = auth.uid(),
        resolved_at = now(),
        resolution_notes = 'Entity rejected by admin: ' || reason
    WHERE business_entity_id = entity_id AND resolved = false;
    
    -- Log audit action
    PERFORM log_audit_action(
        'reject_entity',
        entity_id,
        jsonb_build_object('action', 'reject', 'reason', reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge duplicate entities
CREATE OR REPLACE FUNCTION admin_merge_entities(primary_id UUID, duplicate_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
    v_duplicate_id UUID;
    v_merged_count INTEGER := 0;
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can merge entities';
    END IF;
    
    -- Validate primary entity exists
    IF NOT EXISTS (SELECT 1 FROM business_entities WHERE id = primary_id) THEN
        RAISE EXCEPTION 'Primary entity does not exist';
    END IF;
    
    -- Merge each duplicate entity
    FOREACH v_duplicate_id IN ARRAY duplicate_ids LOOP
        -- Skip if duplicate is the same as primary
        IF v_duplicate_id = primary_id THEN
            CONTINUE;
        END IF;
        
        -- Update supplier relationships
        UPDATE suppliers 
        SET business_entity_id = primary_id, updated_at = now()
        WHERE business_entity_id = v_duplicate_id;
        
        -- Update customer relationships
        UPDATE customers 
        SET business_entity_id = primary_id, updated_at = now()
        WHERE business_entity_id = v_duplicate_id;
        
        -- Update contact relationships
        UPDATE contacts 
        SET business_entity_id = primary_id, updated_at = now()
        WHERE business_entity_id = v_duplicate_id;
        
        -- Mark flags as resolved
        UPDATE entity_flags 
        SET 
            resolved = true,
            resolved_by = auth.uid(),
            resolved_at = now(),
            resolution_notes = 'Entity merged into ' || primary_id::text
        WHERE business_entity_id = v_duplicate_id AND resolved = false;
        
        -- Archive the duplicate entity (soft delete)
        UPDATE business_entities 
        SET 
            verification_status = 'archived',
            admin_notes = COALESCE(admin_notes, '') || E'\nArchived due to merge on ' || now()::text,
            updated_at = now()
        WHERE id = v_duplicate_id;
        
        v_merged_count := v_merged_count + 1;
    END LOOP;
    
    -- Log audit action
    PERFORM log_audit_action(
        'merge_entities',
        primary_id,
        jsonb_build_object(
            'action', 'merge', 
            'merged_count', v_merged_count,
            'duplicate_ids', duplicate_ids
        )
    );
    
    RETURN v_merged_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to flag an entity for review
CREATE OR REPLACE FUNCTION admin_flag_entity(entity_id UUID, flag_type VARCHAR, description TEXT)
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
        RAISE EXCEPTION 'Only admin users can flag entities';
    END IF;
    
    -- Insert flag
    INSERT INTO entity_flags (
        business_entity_id,
        flag_type,
        description
    ) VALUES (
        entity_id,
        flag_type,
        description
    );
    
    -- Update entity status
    UPDATE business_entities 
    SET 
        flagged_for_review = true,
        updated_at = now()
    WHERE id = entity_id;
    
    -- Log audit action
    PERFORM log_audit_action(
        'flag_entity',
        entity_id,
        jsonb_build_object('flag_type', flag_type, 'description', description)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flagged entities for admin review
CREATE OR REPLACE FUNCTION admin_get_flagged_entities()
RETURNS TABLE (
    entity_id UUID,
    entity_name TEXT,
    entity_email TEXT,
    entity_tax_id TEXT,
    verification_status VARCHAR(20),
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
        RAISE EXCEPTION 'Only admin users can view flagged entities';
    END IF;
    
    RETURN QUERY
    SELECT 
        be.id as entity_id,
        be.business_name as entity_name,
        be.email as entity_email,
        be.tax_id as entity_tax_id,
        be.verification_status,
        COUNT(ef.id)::INTEGER as flag_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ef.id,
                    'type', ef.flag_type,
                    'description', ef.description,
                    'created_at', ef.created_at,
                    'resolved', ef.resolved
                ) ORDER BY ef.created_at DESC
            ) FILTER (WHERE ef.id IS NOT NULL),
            '[]'::jsonb
        ) as flags
    FROM business_entities be
    LEFT JOIN entity_flags ef ON be.id = ef.business_entity_id AND ef.resolved = false
    WHERE be.flagged_for_review = true
    GROUP BY be.id, be.business_name, be.email, be.tax_id, be.verification_status
    ORDER BY flag_count DESC, be.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SUPPORT FUNCTIONS - User Assistance
-- =============================================

-- Function to view user data (for support)
CREATE OR REPLACE FUNCTION support_view_user_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is support
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'support' THEN
        RAISE EXCEPTION 'Only support users can view user data';
    END IF;
    
    -- Get user data
    SELECT jsonb_build_object(
        'user_id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in', u.last_sign_in_at,
        'email_confirmed', u.email_confirmed_at IS NOT NULL,
        'user_metadata', u.user_metadata,
        'tenants', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'tenant_id', t.id,
                    'tenant_name', t.name,
                    'role', ut.role
                )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM auth.users u
    LEFT JOIN user_tenants ut ON u.id = ut.user_id
    LEFT JOIN tenants t ON ut.tenant_id = t.id
    WHERE u.id = user_id
    GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at, u.user_metadata;
    
    -- Log audit action
    PERFORM log_audit_action(
        'view_user_data',
        NULL,
        jsonb_build_object('target_user_id', user_id)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user password (for support)
CREATE OR REPLACE FUNCTION support_reset_user_password(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is support
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'support' THEN
        RAISE EXCEPTION 'Only support users can reset passwords';
    END IF;
    
    -- Log audit action
    PERFORM log_audit_action(
        'reset_user_password',
        NULL,
        jsonb_build_object('target_user_id', user_id)
    );
    
    -- Note: Actual password reset would be handled by Supabase Auth
    -- This function just logs the action
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable user account (for support)
CREATE OR REPLACE FUNCTION support_disable_user_account(user_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is support
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'support' THEN
        RAISE EXCEPTION 'Only support users can disable accounts';
    END IF;
    
    -- Log audit action
    PERFORM log_audit_action(
        'disable_user_account',
        NULL,
        jsonb_build_object('target_user_id', user_id, 'reason', reason)
    );
    
    -- Note: Actual account disabling would be handled by Supabase Auth
    -- This function just logs the action
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EDITOR FUNCTIONS - Content Management
-- =============================================

-- Function to update system content (for editors)
CREATE OR REPLACE FUNCTION editor_update_system_content(content_type VARCHAR, content JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is editor
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'editor' THEN
        RAISE EXCEPTION 'Only editor users can update system content';
    END IF;
    
    -- Log audit action
    PERFORM log_audit_action(
        'update_system_content',
        NULL,
        jsonb_build_object('content_type', content_type, 'content', content)
    );
    
    -- Note: Actual content update would be handled by application logic
    -- This function just logs the action
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manage templates (for editors)
CREATE OR REPLACE FUNCTION editor_manage_templates(template_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is editor
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'editor' THEN
        RAISE EXCEPTION 'Only editor users can manage templates';
    END IF;
    
    -- Log audit action
    PERFORM log_audit_action(
        'manage_templates',
        NULL,
        jsonb_build_object('template_data', template_data)
    );
    
    -- Note: Actual template management would be handled by application logic
    -- This function just logs the action
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TECHNICAL FUNCTIONS - System Maintenance
-- =============================================

-- Function to view system metrics (for technical users)
CREATE OR REPLACE FUNCTION technical_view_system_metrics()
RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is technical
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'technical' THEN
        RAISE EXCEPTION 'Only technical users can view system metrics';
    END IF;
    
    -- Get system metrics
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_tenants', (SELECT COUNT(*) FROM tenants),
        'total_business_entities', (SELECT COUNT(*) FROM business_entities),
        'flagged_entities', (SELECT COUNT(*) FROM business_entities WHERE flagged_for_review = true),
        'pending_verification', (SELECT COUNT(*) FROM business_entities WHERE verification_status = 'pending'),
        'audit_log_entries', (SELECT COUNT(*) FROM system_audit_log),
        'system_health', 'healthy'
    ) INTO v_result;
    
    -- Log audit action
    PERFORM log_audit_action(
        'view_system_metrics',
        NULL,
        v_result
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old data (for technical users)
CREATE OR REPLACE FUNCTION technical_cleanup_old_data(retention_days INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
    v_deleted_count INTEGER := 0;
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is technical
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'technical' THEN
        RAISE EXCEPTION 'Only technical users can cleanup data';
    END IF;
    
    -- Cleanup old audit logs (keep only retention_days worth)
    DELETE FROM system_audit_log 
    WHERE performed_at < now() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log audit action
    PERFORM log_audit_action(
        'cleanup_old_data',
        NULL,
        jsonb_build_object('retention_days', retention_days, 'deleted_count', v_deleted_count)
    );
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export audit log (for technical users)
CREATE OR REPLACE FUNCTION technical_export_audit_log(start_date DATE, end_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_user_role VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Get current user info
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if user is technical
    v_user_role := get_user_role(v_user_email);
    
    IF v_user_role != 'technical' THEN
        RAISE EXCEPTION 'Only technical users can export audit logs';
    END IF;
    
    -- Get audit log data
    SELECT jsonb_build_object(
        'export_date', now(),
        'date_range', jsonb_build_object('start_date', start_date, 'end_date', end_date),
        'total_entries', COUNT(*),
        'entries', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', sal.id,
                    'user_id', sal.user_id,
                    'user_role', sal.user_role,
                    'action_type', sal.action_type,
                    'target_entity_id', sal.target_entity_id,
                    'action_details', sal.action_details,
                    'performed_at', sal.performed_at
                ) ORDER BY sal.performed_at DESC
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM system_audit_log sal
    WHERE DATE(sal.performed_at) BETWEEN start_date AND end_date;
    
    -- Log audit action
    PERFORM log_audit_action(
        'export_audit_log',
        NULL,
        jsonb_build_object('start_date', start_date, 'end_date', end_date)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
