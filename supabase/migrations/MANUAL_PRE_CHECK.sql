-- =============================================================================
-- MANUAL PRE-DEPLOYMENT CHECK
-- Chạy script này TRƯỚC KHI deploy để kiểm tra trạng thái hiện tại
-- Copy/paste vào Supabase Dashboard > SQL Editor
-- =============================================================================

-- STEP 1: Kiểm tra RLS status hiện tại
SELECT 
    '🔒 RLS STATUS CHECK' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 ENABLED (có thể gây vấn đề với custom auth)'
        ELSE '🔓 DISABLED (tốt cho custom auth)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
)
ORDER BY tablename;

-- STEP 2: Kiểm tra Realtime Publications hiện tại  
SELECT 
    '📡 REALTIME STATUS' as check_type,
    COUNT(*) as current_realtime_tables,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ CHƯA ENABLE'
        ELSE '✅ ĐÃ ENABLE (' || COUNT(*) || ' tables)'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- STEP 3: Liệt kê các tables hiện có trong realtime (nếu có)
SELECT 
    '📋 CURRENT REALTIME TABLES' as check_type,
    tablename,
    '✅ ACTIVE' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- STEP 4: Kiểm tra permissions cho anon role
SELECT 
    '🔑 PERMISSIONS CHECK' as check_type,
    tablename,
    privilege_type,
    '✅ GRANTED' as status
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
AND table_schema = 'public'
AND table_name IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
)
ORDER BY tablename, privilege_type;

-- STEP 5: Test connection basic
SELECT 
    '🔌 CONNECTION TEST' as check_type,
    'Database connection' as component,
    '✅ OK - bạn đang thấy kết quả này' as status,
    now() as timestamp;

-- =============================================================================
-- SUMMARY MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 PRE-DEPLOYMENT CHECK COMPLETED';
    RAISE NOTICE '';
    RAISE NOTICE '📋 REVIEW THE RESULTS ABOVE:';
    RAISE NOTICE '   - RLS Status: Should be DISABLED for custom auth';
    RAISE NOTICE '   - Realtime: May be 0 tables (normal before deployment)';
    RAISE NOTICE '   - Permissions: Should show GRANTED for anon role';
    RAISE NOTICE '';
    RAISE NOTICE '✅ IF ALL LOOKS GOOD: Proceed with deployment';
    RAISE NOTICE '❌ IF ISSUES FOUND: Fix before deploying';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT: Run 20241229_fix_realtime_without_rls.sql';
END $$; 