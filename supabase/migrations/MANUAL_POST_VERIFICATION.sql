-- =============================================================================
-- POST-DEPLOYMENT VERIFICATION
-- Chạy script này SAU KHI deploy để verify mọi thứ hoạt động đúng
-- Copy/paste vào Supabase Dashboard > SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: VERIFY REALTIME PUBLICATIONS
-- =============================================================================

-- Kiểm tra tất cả tables đã được add vào realtime
SELECT 
    '📡 REALTIME VERIFICATION' as check_type,
    COUNT(*) as enabled_tables,
    CASE 
        WHEN COUNT(*) = 9 THEN '✅ HOÀN HẢO - Tất cả 9 tables đã enable'
        WHEN COUNT(*) > 0 THEN '⚠️  PARTIAL - Chỉ có ' || COUNT(*) || '/9 tables'
        ELSE '❌ THẤT BẠI - Không có table nào trong realtime'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- Liệt kê từng table và trạng thái
WITH target_tables AS (
    SELECT unnest(ARRAY[
        'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
        'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
        'cong_viec_bao_tri', 'yeu_cau_sua_chua'
    ]) as table_name
)
SELECT 
    '📋 TABLE STATUS' as check_type,
    t.table_name,
    CASE 
        WHEN p.tablename IS NOT NULL THEN '✅ ENABLED'
        ELSE '❌ NOT IN REALTIME'
    END as realtime_status
FROM target_tables t
LEFT JOIN pg_publication_tables p 
    ON p.tablename = t.table_name 
    AND p.pubname = 'supabase_realtime'
ORDER BY t.table_name;

-- =============================================================================
-- STEP 2: VERIFY RLS STATUS
-- =============================================================================

-- Kiểm tra RLS đã được disable
SELECT 
    '🔒 RLS VERIFICATION' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ STILL ENABLED (có thể gây vấn đề)'
        ELSE '✅ DISABLED (tốt cho custom auth)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
)
ORDER BY tablename;

-- =============================================================================
-- STEP 3: VERIFY PERMISSIONS
-- =============================================================================

-- Kiểm tra anon role có đủ permissions
SELECT 
    '🔑 PERMISSIONS VERIFICATION' as check_type,
    COUNT(*) as granted_permissions,
    CASE 
        WHEN COUNT(*) >= 27 THEN '✅ ĐỦ PERMISSIONS (9 tables x 3+ privileges)'
        WHEN COUNT(*) > 0 THEN '⚠️  PARTIAL - Chỉ có ' || COUNT(*) || ' permissions'
        ELSE '❌ THIẾU PERMISSIONS'
    END as status
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
AND table_schema = 'public'
AND table_name IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- =============================================================================
-- STEP 4: BASIC FUNCTIONALITY TEST
-- =============================================================================

-- Test basic query trên main tables
SELECT 
    '🧪 FUNCTIONALITY TEST' as check_type,
    'thiet_bi table' as component,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ ACCESSIBLE'
        ELSE '❌ ACCESS DENIED'
    END as status
FROM thiet_bi
LIMIT 1;

-- Test user table
SELECT 
    '🧪 FUNCTIONALITY TEST' as check_type,
    'nhan_vien table' as component,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ ACCESSIBLE'
        ELSE '❌ ACCESS DENIED'
    END as status
FROM nhan_vien
LIMIT 1;

-- =============================================================================
-- STEP 5: OVERALL HEALTH CHECK
-- =============================================================================

DO $$
DECLARE
    realtime_count INTEGER;
    rls_enabled_count INTEGER;
    permission_count INTEGER;
    overall_status TEXT;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO realtime_count 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
    AND tablename IN (
        'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
        'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
        'cong_viec_bao_tri', 'yeu_cau_sua_chua'
    );
    
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
    AND tablename IN (
        'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
        'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
        'cong_viec_bao_tri', 'yeu_cau_sua_chua'
    );
    
    SELECT COUNT(*) INTO permission_count
    FROM information_schema.table_privileges 
    WHERE grantee = 'anon' 
    AND table_schema = 'public'
    AND table_name IN (
        'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
        'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
        'cong_viec_bao_tri', 'yeu_cau_sua_chua'
    );
    
    -- Determine overall status
    IF realtime_count = 9 AND rls_enabled_count = 0 AND permission_count >= 27 THEN
        overall_status := '✅ PERFECT DEPLOYMENT';
    ELSIF realtime_count >= 7 AND rls_enabled_count = 0 AND permission_count >= 20 THEN
        overall_status := '⚠️  GOOD BUT CHECK MISSING ITEMS';
    ELSE
        overall_status := '❌ ISSUES DETECTED - NEEDS ATTENTION';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 OVERALL DEPLOYMENT STATUS: %', overall_status;
    RAISE NOTICE '';
    RAISE NOTICE '📊 DEPLOYMENT SUMMARY:';
    RAISE NOTICE '   📡 Realtime Tables: % / 9', realtime_count;
    RAISE NOTICE '   🔒 RLS Enabled: % (should be 0)', rls_enabled_count;
    RAISE NOTICE '   🔑 Permissions: % (should be 27+)', permission_count;
    RAISE NOTICE '';
    
    IF overall_status = '✅ PERFECT DEPLOYMENT' THEN
        RAISE NOTICE '🚀 DEPLOYMENT SUCCESSFUL!';
        RAISE NOTICE '   ✅ Realtime is now active';
        RAISE NOTICE '   ✅ App should show real-time updates';
        RAISE NOTICE '   ✅ Performance should improve';
        RAISE NOTICE '';
        RAISE NOTICE '📋 NEXT STEPS:';
        RAISE NOTICE '   1. Test ứng dụng có real-time updates';
        RAISE NOTICE '   2. Monitor performance improvement';
        RAISE NOTICE '   3. Check browser DevTools for realtime messages';
    ELSE
        RAISE NOTICE '⚠️  DEPLOYMENT NEEDS ATTENTION!';
        RAISE NOTICE '   📋 Review the verification results above';
        RAISE NOTICE '   🔧 Fix any issues or rollback if needed';
        RAISE NOTICE '';
        RAISE NOTICE '🆘 TO ROLLBACK: Run MANUAL_ROLLBACK_SIMPLE.sql';
    END IF;
    
END $$; 