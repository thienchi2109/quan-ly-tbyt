-- =====================================================
-- SAFE MIGRATION SCRIPT - STEP 1
-- =====================================================
-- This script implements password hashing with zero downtime
-- and full backward compatibility

-- =====================================================
-- PRE-FLIGHT CHECKS
-- =====================================================

-- Check if backup was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'nhan_vien_backup_%'
  ) THEN
    RAISE EXCEPTION 'ERROR: No backup table found! Please run backup-and-rollback.sql first';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Backup table found, proceeding with migration...';
END $$;

-- =====================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

RAISE NOTICE 'Extensions enabled successfully';

-- =====================================================
-- STEP 2: ADD NEW COLUMNS (NON-BREAKING)
-- =====================================================

-- Add hashed password column (keeps original password intact)
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS hashed_password TEXT;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

RAISE NOTICE 'New columns added successfully';

-- =====================================================
-- STEP 3: HASH EXISTING PASSWORDS
-- =====================================================

-- Hash all existing passwords (original passwords remain untouched)
UPDATE nhan_vien 
SET hashed_password = crypt(password, gen_salt('bf', 12))
WHERE hashed_password IS NULL AND password IS NOT NULL;

-- Verify hashing completed
DO $$
DECLARE
  total_users INTEGER;
  hashed_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM nhan_vien WHERE password IS NOT NULL;
  SELECT COUNT(*) INTO hashed_users FROM nhan_vien WHERE hashed_password IS NOT NULL;
  
  IF total_users != hashed_users THEN
    RAISE EXCEPTION 'ERROR: Password hashing incomplete! Total: %, Hashed: %', total_users, hashed_users;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All % passwords hashed successfully', total_users;
END $$;

-- =====================================================
-- STEP 4: CREATE SESSION MANAGEMENT
-- =====================================================

-- Create session table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

RAISE NOTICE 'Session management tables created successfully';

-- =====================================================
-- STEP 5: CREATE SECURE AUTHENTICATION FUNCTION
-- =====================================================

-- Main authentication function (backward compatible)
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
  v_user_record RECORD;
BEGIN
  -- Try hashed password first (new method)
  SELECT nv.* INTO v_user_record
  FROM nhan_vien nv
  WHERE nv.username = p_username
    AND nv.is_active = TRUE
    AND nv.hashed_password = crypt(p_password, nv.hashed_password);

  -- Fallback to plain text password (backward compatibility)
  IF v_user_record.id IS NULL THEN
    SELECT nv.* INTO v_user_record
    FROM nhan_vien nv
    WHERE nv.username = p_username
      AND nv.is_active = TRUE
      AND nv.password = p_password;
      
    -- If found with plain text, update to hashed
    IF v_user_record.id IS NOT NULL THEN
      UPDATE nhan_vien 
      SET hashed_password = crypt(p_password, gen_salt('bf', 12))
      WHERE id = v_user_record.id;
    END IF;
  END IF;

  -- Return empty if no user found
  IF v_user_record.id IS NULL THEN
    RETURN;
  END IF;

  -- Generate secure session token
  v_session_token := encode(gen_random_bytes(32), 'hex') || '.' || extract(epoch from now())::text;

  -- Clean up old sessions for this user (keep last 5)
  DELETE FROM user_sessions 
  WHERE user_id = v_user_record.id 
    AND id NOT IN (
      SELECT id FROM user_sessions 
      WHERE user_id = v_user_record.id 
      ORDER BY created_at DESC 
      LIMIT 5
    );

  -- Insert new session
  INSERT INTO user_sessions (user_id, session_token, expires_at)
  VALUES (v_user_record.id, v_session_token, now() + interval '24 hours');

  -- Return user data with session token
  RETURN QUERY
  SELECT 
    v_user_record.id,
    v_user_record.username,
    v_user_record.full_name,
    v_user_record.role,
    v_user_record.khoa_phong,
    v_user_record.created_at,
    v_session_token;
END;
$$;

RAISE NOTICE 'Secure authentication function created successfully';

-- =====================================================
-- STEP 6: CREATE SESSION VALIDATION
-- =====================================================

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
    WHERE us.session_token = p_session_token
      AND nv.is_active = TRUE;
  ELSE
    RETURN QUERY
    SELECT NULL::INTEGER, NULL::VARCHAR(50), NULL::VARCHAR(20), NULL::VARCHAR(100), FALSE;
  END IF;
END;
$$;

-- =====================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- =====================================================

-- Session cleanup function
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

-- Simple password validation (no restrictions as requested)
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN password IS NOT NULL AND length(trim(password)) > 0;
END;
$$;

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_password_strength(TEXT) TO authenticated;

-- =====================================================
-- STEP 9: VERIFICATION TESTS
-- =====================================================

-- Test authentication with admin account
DO $$
DECLARE
  test_result RECORD;
BEGIN
  SELECT * INTO test_result FROM authenticate_user('admin', 'admin123');
  
  IF test_result.id IS NULL THEN
    RAISE EXCEPTION 'ERROR: Admin authentication test failed!';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Admin authentication test passed - User ID: %', test_result.id;
END $$;

-- Verify session token generation
DO $$
DECLARE
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO session_count FROM user_sessions;
  
  IF session_count = 0 THEN
    RAISE WARNING 'No sessions found - this is normal for first run';
  ELSE
    RAISE NOTICE 'SUCCESS: % session(s) found in database', session_count;
  END IF;
END $$;

-- =====================================================
-- FINAL STATUS REPORT
-- =====================================================

SELECT 
  'MIGRATION STEP 1 COMPLETED' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE hashed_password IS NOT NULL) as users_with_hashed_password,
  COUNT(*) FILTER (WHERE password IS NOT NULL) as users_with_original_password,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_users
FROM nhan_vien;

RAISE NOTICE '=== MIGRATION STEP 1 COMPLETED SUCCESSFULLY ===';
RAISE NOTICE 'Next step: Update frontend to use authenticate_user() function';
RAISE NOTICE 'Rollback available: SELECT emergency_rollback();';
