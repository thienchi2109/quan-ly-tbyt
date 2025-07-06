-- =====================================================
-- ENHANCED AUTHENTICATION WITH DUAL MODE SUPPORT
-- =====================================================
-- Support both hashed and plain text passwords during transition

-- Enhanced authentication function với dual mode support
CREATE OR REPLACE FUNCTION authenticate_user_dual_mode(
    p_username TEXT,
    p_password TEXT
)
RETURNS TABLE(
    user_id BIGINT,
    username TEXT,
    full_name TEXT,
    role TEXT,
    khoa_phong TEXT,
    authentication_mode TEXT,
    is_authenticated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    auth_result BOOLEAN := FALSE;
    auth_mode TEXT := 'unknown';
BEGIN
    -- Get user record
    SELECT id, nv.username, password, hashed_password, full_name, nv.role, khoa_phong
    INTO user_record
    FROM nhan_vien nv
    WHERE nv.username = p_username;
    
    -- If user not found
    IF user_record.id IS NULL THEN
        RETURN QUERY SELECT 
            NULL::BIGINT, 
            p_username, 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT,
            'user_not_found'::TEXT, 
            FALSE;
        RETURN;
    END IF;
    
    -- 🚨 SECURITY: Block "hashed password" và suspicious strings
    IF p_password IN ('hashed password', 'hashed_password', 'hash', '') OR 
       p_password LIKE '%hash%' OR 
       p_password LIKE '%crypt%' OR
       LENGTH(p_password) > 200 THEN
        RETURN QUERY SELECT 
            user_record.id,
            user_record.username::TEXT,
            user_record.full_name,
            user_record.role,
            user_record.khoa_phong,
            'blocked_suspicious'::TEXT,
            FALSE;
        RETURN;
    END IF;
    
    -- Try hashed password authentication first (preferred)
    IF user_record.hashed_password IS NOT NULL AND user_record.hashed_password != '' THEN
        auth_result := (user_record.hashed_password = crypt(p_password, user_record.hashed_password));
        IF auth_result THEN
            auth_mode := 'hashed';
        END IF;
    END IF;
    
    -- Fallback to plain text authentication (backward compatibility)
    IF NOT auth_result AND user_record.password IS NOT NULL AND user_record.password != 'hashed password' THEN
        auth_result := (user_record.password = p_password);
        IF auth_result THEN
            auth_mode := 'plain_text';
        END IF;
    END IF;
    
    -- Return authentication result
    RETURN QUERY SELECT 
        user_record.id,
        user_record.username::TEXT,
        user_record.full_name,
        user_record.role,
        user_record.khoa_phong,
        auth_mode,
        auth_result;
END;
$$;

-- Function để check authentication status của user
CREATE OR REPLACE FUNCTION get_user_auth_status(p_user_id BIGINT)
RETURNS TABLE(
    user_id BIGINT,
    username TEXT,
    has_hashed_password BOOLEAN,
    has_plain_password BOOLEAN,
    auth_mode TEXT,
    migration_status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    migration_record RECORD;
BEGIN
    -- Get user info
    SELECT id, nv.username, password, hashed_password
    INTO user_record
    FROM nhan_vien nv
    WHERE nv.id = p_user_id;
    
    -- Get migration status
    SELECT migration_status 
    INTO migration_record
    FROM password_migration_log pml
    WHERE pml.user_id = p_user_id
    ORDER BY migration_timestamp DESC
    LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        RETURN QUERY SELECT 
            user_record.id,
            user_record.username::TEXT,
            (user_record.hashed_password IS NOT NULL AND user_record.hashed_password != ''),
            (user_record.password IS NOT NULL AND user_record.password != 'hashed password'),
            CASE 
                WHEN user_record.hashed_password IS NOT NULL AND user_record.hashed_password != '' 
                     AND user_record.password = 'hashed password' THEN 'hashed_only'
                WHEN user_record.hashed_password IS NOT NULL AND user_record.hashed_password != '' 
                     AND user_record.password != 'hashed password' THEN 'dual_mode'
                WHEN user_record.password IS NOT NULL AND user_record.password != 'hashed password' THEN 'plain_text_only'
                ELSE 'unknown'
            END::TEXT,
            COALESCE(migration_record.migration_status, 'not_migrated')::TEXT;
    END IF;
END;
$$;

-- Session validation function (simplified)
CREATE OR REPLACE FUNCTION validate_session_simple(p_session_token TEXT)
RETURNS TABLE(
    user_id BIGINT,
    username TEXT,
    role TEXT,
    khoa_phong TEXT,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- For now, return basic validation based on token format
    -- In production, này should be enhanced với proper session storage
    IF p_session_token IS NULL OR LENGTH(p_session_token) < 10 THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
        RETURN;
    END IF;
    
    -- Simple validation - in real implementation, check against session table
    -- For now, we'll just validate token format
    IF p_session_token LIKE 'session_%' OR p_session_token LIKE 'fallback_%' THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, TRUE;
    ELSE
        RETURN QUERY SELECT NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
    END IF;
END;
$$;

-- Function để get migration statistics
CREATE OR REPLACE FUNCTION get_migration_statistics()
RETURNS TABLE(
    total_users BIGINT,
    migrated_users BIGINT,
    pending_users BIGINT,
    failed_users BIGINT,
    migration_progress NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN hashed_password IS NOT NULL AND hashed_password != '' THEN 1 END) as migrated,
        COUNT(CASE WHEN hashed_password IS NULL OR hashed_password = '' THEN 1 END) as pending,
        (SELECT COUNT(*) FROM password_migration_log WHERE migration_status = 'failed') as failed
    INTO stats
    FROM nhan_vien;
    
    RETURN QUERY SELECT 
        stats.total,
        stats.migrated,
        stats.pending,
        stats.failed,
        CASE WHEN stats.total > 0 THEN ROUND((stats.migrated::NUMERIC / stats.total::NUMERIC) * 100, 2) ELSE 0 END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION authenticate_user_dual_mode(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_status(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session_simple(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_migration_statistics() TO authenticated;

-- Add comments
COMMENT ON FUNCTION authenticate_user_dual_mode(TEXT, TEXT) IS 'Enhanced authentication supporting both hashed and plain text passwords with security blocks';
COMMENT ON FUNCTION get_user_auth_status(INTEGER) IS 'Get authentication status and mode for a specific user';
COMMENT ON FUNCTION validate_session_simple(TEXT) IS 'Simple session validation function';
COMMENT ON FUNCTION get_migration_statistics() IS 'Get overall migration progress statistics'; 