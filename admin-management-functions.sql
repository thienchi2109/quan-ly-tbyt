-- =====================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- =====================================================
-- Functions for system administrators to manage user accounts

-- Function to reset user password (Admin only)
CREATE OR REPLACE FUNCTION admin_reset_password(
  p_admin_user_id INTEGER,
  p_target_username TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
  target_user_id INTEGER;
BEGIN
  -- Verify admin permissions
  SELECT role INTO admin_role
  FROM nhan_vien
  WHERE id = p_admin_user_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- No password validation - allow any password
  
  -- Get target user ID
  SELECT id INTO target_user_id
  FROM nhan_vien
  WHERE username = p_target_username;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_target_username;
  END IF;
  
  -- Update password
  UPDATE nhan_vien
  SET hashed_password = crypt(p_new_password, gen_salt('bf', 12)),
      password_reset_required = TRUE,
      password_reset_at = NOW()
  WHERE id = target_user_id;
  
  -- Invalidate all existing sessions for target user
  UPDATE user_sessions
  SET is_active = FALSE
  WHERE user_id = target_user_id;
  
  -- Log the action
  INSERT INTO audit_log (
    user_id, action, resource_type, resource_id, 
    new_values, ip_address
  ) VALUES (
    p_admin_user_id, 'PASSWORD_RESET', 'nhan_vien', target_user_id,
    jsonb_build_object('target_user', p_target_username, 'reset_by_admin', true),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$;

-- Function to disable/enable user account
CREATE OR REPLACE FUNCTION admin_toggle_user_status(
  p_admin_user_id INTEGER,
  p_target_username TEXT,
  p_is_active BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
  target_user_id INTEGER;
  current_status BOOLEAN;
BEGIN
  -- Verify admin permissions
  SELECT role INTO admin_role
  FROM nhan_vien
  WHERE id = p_admin_user_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get target user info
  SELECT id, is_active INTO target_user_id, current_status
  FROM nhan_vien
  WHERE username = p_target_username;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_target_username;
  END IF;
  
  -- Prevent admin from disabling themselves
  IF target_user_id = p_admin_user_id AND p_is_active = FALSE THEN
    RAISE EXCEPTION 'Cannot disable your own account';
  END IF;
  
  -- Update user status
  UPDATE nhan_vien
  SET is_active = p_is_active,
      disabled_at = CASE WHEN p_is_active = FALSE THEN NOW() ELSE NULL END,
      disabled_reason = CASE WHEN p_is_active = FALSE THEN p_reason ELSE NULL END
  WHERE id = target_user_id;
  
  -- If disabling, invalidate all sessions
  IF p_is_active = FALSE THEN
    UPDATE user_sessions
    SET is_active = FALSE
    WHERE user_id = target_user_id;
  END IF;
  
  -- Log the action
  INSERT INTO audit_log (
    user_id, action, resource_type, resource_id,
    old_values, new_values, ip_address
  ) VALUES (
    p_admin_user_id, 
    CASE WHEN p_is_active THEN 'USER_ENABLED' ELSE 'USER_DISABLED' END,
    'nhan_vien', target_user_id,
    jsonb_build_object('is_active', current_status),
    jsonb_build_object('is_active', p_is_active, 'reason', p_reason),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$;

-- Function to generate temporary password
CREATE OR REPLACE FUNCTION admin_generate_temp_password(
  p_admin_user_id INTEGER,
  p_target_username TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
  target_user_id INTEGER;
  temp_password TEXT;
BEGIN
  -- Verify admin permissions
  SELECT role INTO admin_role
  FROM nhan_vien
  WHERE id = p_admin_user_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Generate secure temporary password
  temp_password := 'Temp' || floor(random() * 9000 + 1000)::text || '!';
  
  -- Reset password using the temp password
  IF admin_reset_password(p_admin_user_id, p_target_username, temp_password) THEN
    RETURN temp_password;
  ELSE
    RAISE EXCEPTION 'Failed to generate temporary password';
  END IF;
END;
$$;

-- Function to get user account status
CREATE OR REPLACE FUNCTION admin_get_user_status(
  p_admin_user_id INTEGER,
  p_target_username TEXT DEFAULT NULL
)
RETURNS TABLE(
  username VARCHAR(50),
  full_name VARCHAR(100),
  role VARCHAR(20),
  khoa_phong VARCHAR(100),
  is_active BOOLEAN,
  last_login TIMESTAMPTZ,
  failed_attempts INTEGER,
  password_reset_required BOOLEAN,
  created_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  disabled_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Verify admin permissions
  SELECT nv.role INTO admin_role
  FROM nhan_vien nv
  WHERE nv.id = p_admin_user_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return user status information
  RETURN QUERY
  SELECT 
    nv.username,
    nv.full_name,
    nv.role,
    nv.khoa_phong,
    nv.is_active,
    us.last_activity as last_login,
    COALESCE(fa.attempt_count, 0) as failed_attempts,
    nv.password_reset_required,
    nv.created_at,
    nv.disabled_at,
    nv.disabled_reason
  FROM nhan_vien nv
  LEFT JOIN (
    SELECT user_id, MAX(last_activity) as last_activity
    FROM user_sessions
    WHERE is_active = TRUE
    GROUP BY user_id
  ) us ON us.user_id = nv.id
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) as attempt_count
    FROM audit_log
    WHERE action = 'LOGIN_FAILED'
      AND timestamp > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
  ) fa ON fa.user_id = nv.id
  WHERE (p_target_username IS NULL OR nv.username = p_target_username)
  ORDER BY nv.username;
END;
$$;

-- Add required columns to nhan_vien table
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
ALTER TABLE nhan_vien ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Simple password validation function (no restrictions)
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check that password is not empty
  RETURN password IS NOT NULL AND length(trim(password)) > 0;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_reset_password(INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_user_status(INTEGER, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_generate_temp_password(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_status(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_password_strength(TEXT) TO authenticated;
