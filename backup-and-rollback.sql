-- =====================================================
-- BACKUP & ROLLBACK SCRIPT
-- =====================================================
-- Execute this BEFORE running the security migration

-- =====================================================
-- STEP 1: CREATE BACKUP TABLES
-- =====================================================

-- Backup current nhan_vien table
CREATE TABLE IF NOT EXISTS nhan_vien_backup_$(date +%Y%m%d_%H%M%S) AS 
SELECT * FROM nhan_vien;

-- Backup current auth context (if exists)
CREATE TABLE IF NOT EXISTS auth_context_backup AS
SELECT 
  'pre_migration' as backup_type,
  NOW() as backup_time,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'to_qltb') as to_qltb_count,
  COUNT(*) FILTER (WHERE role = 'qltb_khoa') as qltb_khoa_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count
FROM nhan_vien;

-- =====================================================
-- STEP 2: VERIFICATION QUERIES (RUN BEFORE MIGRATION)
-- =====================================================

-- Verify current data integrity
SELECT 
  'PRE-MIGRATION CHECK' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE password IS NOT NULL) as users_with_password,
  COUNT(*) FILTER (WHERE password = '') as users_empty_password,
  COUNT(*) FILTER (WHERE password IS NULL) as users_null_password
FROM nhan_vien;

-- Check current admin account
SELECT 
  'ADMIN ACCOUNT CHECK' as status,
  username,
  role,
  CASE WHEN password IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status
FROM nhan_vien 
WHERE role = 'admin';

-- =====================================================
-- STEP 3: ROLLBACK PROCEDURES
-- =====================================================

-- EMERGENCY ROLLBACK FUNCTION
CREATE OR REPLACE FUNCTION emergency_rollback()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  backup_table_name TEXT;
  result_message TEXT;
BEGIN
  -- Find the most recent backup table
  SELECT table_name INTO backup_table_name
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'nhan_vien_backup_%'
  ORDER BY table_name DESC 
  LIMIT 1;
  
  IF backup_table_name IS NULL THEN
    RETURN 'ERROR: No backup table found!';
  END IF;
  
  -- Disable RLS temporarily
  ALTER TABLE nhan_vien DISABLE ROW LEVEL SECURITY;
  
  -- Drop new columns if they exist
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS hashed_password;
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS is_active;
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS password_reset_required;
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS password_reset_at;
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS disabled_at;
  ALTER TABLE nhan_vien DROP COLUMN IF EXISTS disabled_reason;
  
  -- Restore from backup
  EXECUTE format('
    DELETE FROM nhan_vien;
    INSERT INTO nhan_vien SELECT * FROM %I;
  ', backup_table_name);
  
  -- Drop new tables if they exist
  DROP TABLE IF EXISTS user_sessions;
  DROP TABLE IF EXISTS audit_log;
  
  -- Drop new functions
  DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT);
  DROP FUNCTION IF EXISTS validate_session(TEXT);
  DROP FUNCTION IF EXISTS get_current_user_context();
  DROP FUNCTION IF EXISTS cleanup_expired_sessions();
  DROP FUNCTION IF EXISTS admin_reset_password(INTEGER, TEXT, TEXT);
  DROP FUNCTION IF EXISTS admin_toggle_user_status(INTEGER, TEXT, BOOLEAN, TEXT);
  DROP FUNCTION IF EXISTS admin_generate_temp_password(INTEGER, TEXT);
  DROP FUNCTION IF EXISTS admin_get_user_status(INTEGER, TEXT);
  DROP FUNCTION IF EXISTS validate_password_strength(TEXT);
  
  result_message := format('ROLLBACK COMPLETED: Restored from %s', backup_table_name);
  
  -- Log rollback
  INSERT INTO auth_context_backup VALUES (
    'post_rollback',
    NOW(),
    (SELECT COUNT(*) FROM nhan_vien),
    (SELECT COUNT(*) FROM nhan_vien WHERE role = 'admin'),
    (SELECT COUNT(*) FROM nhan_vien WHERE role = 'to_qltb'),
    (SELECT COUNT(*) FROM nhan_vien WHERE role = 'qltb_khoa'),
    (SELECT COUNT(*) FROM nhan_vien WHERE role = 'user')
  );
  
  RETURN result_message;
END;
$$;

-- =====================================================
-- STEP 4: QUICK ROLLBACK COMMANDS
-- =====================================================

-- To execute emergency rollback, run:
-- SELECT emergency_rollback();

-- To verify rollback success, run:
-- SELECT * FROM auth_context_backup ORDER BY backup_time;

-- =====================================================
-- STEP 5: FRONTEND ROLLBACK
-- =====================================================

-- If you need to rollback frontend changes:
-- 1. Revert to original auth-context.tsx
-- 2. Remove SecureAuthProvider import
-- 3. Restore original login logic

-- Original login logic (for reference):
/*
const login = async (username: string, password: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('nhan_vien')
    .select('*')
    .eq('username', username.trim())
    .single();

  if (error || !data) {
    return false;
  }

  if (data && data.password === password) {
    const sessionData = {
      user: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    setUser(data);
    return true;
  }
  
  return false;
};
*/

-- =====================================================
-- STEP 6: VERIFICATION AFTER ROLLBACK
-- =====================================================

-- Run these queries after rollback to verify:
/*
-- Check table structure
\d nhan_vien

-- Check data integrity
SELECT COUNT(*) FROM nhan_vien;

-- Test admin login (manually in app)
-- Username: admin, Password: admin123

-- Verify no new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_sessions', 'audit_log');

-- Should return empty result
*/

-- =====================================================
-- STEP 7: CLEANUP BACKUP TABLES (AFTER SUCCESSFUL MIGRATION)
-- =====================================================

-- Only run this after confirming migration is successful for 1+ weeks
/*
DROP TABLE IF EXISTS nhan_vien_backup_20241220_143000; -- Replace with actual backup table name
DROP TABLE IF EXISTS auth_context_backup;
DROP FUNCTION IF EXISTS emergency_rollback();
*/
