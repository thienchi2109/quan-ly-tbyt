-- =====================================================
-- SECURITY MIGRATION PLAN - MEDICAL EQUIPMENT MANAGEMENT
-- =====================================================
-- This script provides a comprehensive migration plan to improve security
-- Execute in order: Phase 1 -> Phase 2 -> Phase 3

-- =====================================================
-- PHASE 1: PASSWORD HASHING & BASIC SECURITY
-- =====================================================

-- Step 1.1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1.2: Add hashed password column
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- Step 1.3: Hash existing passwords
UPDATE nhan_vien 
SET hashed_password = crypt(password, gen_salt('bf', 12))
WHERE hashed_password IS NULL;

-- Step 1.4: Create secure authentication function
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  id INTEGER,
  username VARCHAR(50),
  full_name VARCHAR(100),
  role VARCHAR(20),
  khoa_phong VARCHAR(100),
  created_at TIMESTAMPTZ,
  session_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id INTEGER;
  v_session_token TEXT;
BEGIN
  -- Verify credentials
  SELECT nv.id INTO v_user_id
  FROM nhan_vien nv
  WHERE nv.username = p_username
    AND nv.hashed_password = crypt(p_password, nv.hashed_password);

  IF v_user_id IS NULL THEN
    RETURN; -- Invalid credentials
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex') || '.' || extract(epoch from now())::text;

  -- Insert session record
  INSERT INTO user_sessions (user_id, session_token, expires_at)
  VALUES (v_user_id, v_session_token, now() + interval '24 hours');

  -- Return user data without password
  RETURN QUERY
  SELECT 
    nv.id,
    nv.username,
    nv.full_name,
    nv.role,
    nv.khoa_phong,
    nv.created_at,
    v_session_token
  FROM nhan_vien nv
  WHERE nv.id = v_user_id;
END;
$$;

-- Step 1.5: Create session management table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  user_agent TEXT,
  ip_address INET,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Step 1.6: Session validation function
CREATE OR REPLACE FUNCTION validate_session(p_session_token TEXT)
RETURNS TABLE(
  user_id INTEGER,
  username VARCHAR(50),
  role VARCHAR(20),
  khoa_phong VARCHAR(100),
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last activity and return user info if session is valid
  UPDATE user_sessions 
  SET last_activity = NOW()
  WHERE session_token = p_session_token
    AND expires_at > NOW()
    AND is_active = TRUE;

  IF FOUND THEN
    RETURN QUERY
    SELECT 
      nv.id,
      nv.username,
      nv.role,
      nv.khoa_phong,
      TRUE as is_valid
    FROM user_sessions us
    JOIN nhan_vien nv ON nv.id = us.user_id
    WHERE us.session_token = p_session_token;
  ELSE
    RETURN QUERY
    SELECT NULL::INTEGER, NULL::VARCHAR(50), NULL::VARCHAR(20), NULL::VARCHAR(100), FALSE;
  END IF;
END;
$$;

-- Step 1.7: Session cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR is_active = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- PHASE 2: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Step 2.1: Enable RLS on critical tables
ALTER TABLE nhan_vien ENABLE ROW LEVEL SECURITY;
ALTER TABLE thiet_bi ENABLE ROW LEVEL SECURITY;
ALTER TABLE yeu_cau_sua_chua ENABLE ROW LEVEL SECURITY;
ALTER TABLE yeu_cau_luan_chuyen ENABLE ROW LEVEL SECURITY;
ALTER TABLE lich_bao_tri ENABLE ROW LEVEL SECURITY;

-- Step 2.2: Helper function for current user context
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE(
  user_id INTEGER,
  role VARCHAR(20),
  khoa_phong VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nv.id,
    nv.role,
    nv.khoa_phong
  FROM nhan_vien nv
  WHERE nv.id = current_setting('app.current_user_id', true)::integer;
END;
$$;

-- Step 2.3: User table policies
CREATE POLICY "users_own_profile" ON nhan_vien
  FOR SELECT USING (
    id = current_setting('app.current_user_id', true)::integer
  );

CREATE POLICY "admins_all_users" ON nhan_vien
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM get_current_user_context() 
      WHERE role = 'admin'
    )
  );

-- Step 2.4: Equipment table policies
CREATE POLICY "equipment_department_access" ON thiet_bi
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM get_current_user_context() ctx
      WHERE ctx.role IN ('admin', 'to_qltb')
      OR ctx.khoa_phong = thiet_bi.khoa_phong_quan_ly
    )
  );

CREATE POLICY "equipment_modify_permissions" ON thiet_bi
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM get_current_user_context() ctx
      WHERE ctx.role IN ('admin', 'to_qltb')
      OR (ctx.role = 'qltb_khoa' AND ctx.khoa_phong = thiet_bi.khoa_phong_quan_ly)
    )
  );

-- Step 2.5: Repair requests policies
CREATE POLICY "repair_requests_access" ON yeu_cau_sua_chua
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM get_current_user_context() ctx
      JOIN thiet_bi tb ON tb.id = yeu_cau_sua_chua.thiet_bi_id
      WHERE ctx.role IN ('admin', 'to_qltb')
      OR ctx.khoa_phong = tb.khoa_phong_quan_ly
      OR ctx.id = yeu_cau_sua_chua.nguoi_yeu_cau_id
    )
  );

-- =====================================================
-- PHASE 3: AUDIT LOGGING & MONITORING
-- =====================================================

-- Step 3.1: Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES nhan_vien(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Step 3.2: Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    COALESCE(current_setting('app.current_user_id', true)::integer, 0),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 3.3: Apply audit triggers to critical tables
CREATE TRIGGER audit_nhan_vien AFTER INSERT OR UPDATE OR DELETE ON nhan_vien
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_thiet_bi AFTER INSERT OR UPDATE OR DELETE ON thiet_bi
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =====================================================
-- CLEANUP & FINALIZATION
-- =====================================================

-- Step 4.1: Drop old password column (ONLY AFTER TESTING)
-- ALTER TABLE nhan_vien DROP COLUMN password;
-- ALTER TABLE nhan_vien RENAME COLUMN hashed_password TO password;

-- Step 4.2: Create scheduled job for session cleanup
-- This should be run via cron or pg_cron extension
-- SELECT cron.schedule('cleanup-sessions', '0 */6 * * *', 'SELECT cleanup_expired_sessions();');

-- Step 4.3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_context() TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify password hashing
-- SELECT username, password IS NULL as old_password_removed, hashed_password IS NOT NULL as new_password_set FROM nhan_vien;

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- Test authentication
-- SELECT * FROM authenticate_user('admin', 'admin123');

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to invalidate session
CREATE OR REPLACE FUNCTION invalidate_session(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE
  WHERE session_token = p_session_token;

  RETURN FOUND;
END;
$$;

-- Function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$;

-- Function to create new user with hashed password
CREATE OR REPLACE FUNCTION create_user(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_khoa_phong TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id INTEGER;
BEGIN
  -- Validate inputs
  IF NOT validate_username(p_username) THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;

  -- No password validation - allow any password

  -- Insert new user
  INSERT INTO nhan_vien (username, hashed_password, full_name, role, khoa_phong)
  VALUES (p_username, crypt(p_password, gen_salt('bf', 12)), p_full_name, p_role, p_khoa_phong)
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- Function to change password
CREATE OR REPLACE FUNCTION change_password(
  p_user_id INTEGER,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hash TEXT;
BEGIN
  -- Verify old password
  SELECT hashed_password INTO current_hash
  FROM nhan_vien
  WHERE id = p_user_id;

  IF current_hash IS NULL OR current_hash != crypt(p_old_password, current_hash) THEN
    RETURN FALSE;
  END IF;

  -- No password validation - allow any password

  -- Update password
  UPDATE nhan_vien
  SET hashed_password = crypt(p_new_password, gen_salt('bf', 12))
  WHERE id = p_user_id;

  -- Invalidate all existing sessions for this user
  UPDATE user_sessions
  SET is_active = FALSE
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION invalidate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_current_user_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION change_password(INTEGER, TEXT, TEXT) TO authenticated;
