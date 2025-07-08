-- =============================================================================
-- SIMPLE POST-DEPLOYMENT VERIFICATION
-- Version đơn giản để tránh syntax errors phức tạp
-- Copy/paste vào Supabase Dashboard > SQL Editor
-- =============================================================================

-- STEP 1: VERIFY REALTIME PUBLICATIONS
SELECT 
    'REALTIME CHECK' as check_name,
    COUNT(*) as enabled_tables,
    CASE 
        WHEN COUNT(*) = 9 THEN 'SUCCESS - All 9 tables enabled'
        WHEN COUNT(*) > 0 THEN 'PARTIAL - Only ' || COUNT(*) || '/9 tables'
        ELSE 'FAILED - No tables in realtime'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- STEP 2: LIST EACH TABLE STATUS
SELECT 
    'TABLE DETAIL' as check_name,
    tablename as table_name,
    'ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
)
ORDER BY tablename;

-- STEP 3: VERIFY RLS STATUS (should all be disabled)
SELECT 
    'RLS CHECK' as check_name,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'STILL ENABLED - May cause issues'
        ELSE 'DISABLED - Good for custom auth'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
)
ORDER BY tablename;

-- STEP 4: VERIFY PERMISSIONS
SELECT 
    'PERMISSIONS CHECK' as check_name,
    COUNT(*) as granted_permissions,
    CASE 
        WHEN COUNT(*) >= 27 THEN 'SUFFICIENT PERMISSIONS'
        WHEN COUNT(*) > 0 THEN 'PARTIAL - Only ' || COUNT(*) || ' permissions'
        ELSE 'NO PERMISSIONS GRANTED'
    END as status
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
AND table_schema = 'public'
AND table_name IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- STEP 5: TEST DATA ACCESS
SELECT 
    'ACCESS TEST' as check_name,
    'thiet_bi table' as component,
    COUNT(*) as record_count,
    'ACCESSIBLE' as status
FROM thiet_bi
LIMIT 1;

SELECT 
    'ACCESS TEST' as check_name,
    'nhan_vien table' as component,
    COUNT(*) as record_count,
    'ACCESSIBLE' as status
FROM nhan_vien
LIMIT 1; 