-- =============================================================================
-- FINAL STATUS CHECK - Riêng biệt để tránh syntax errors
-- Chạy sau khi đã verify basic checks
-- =============================================================================

-- Lấy các counts để đánh giá overall status
WITH deployment_status AS (
    SELECT 
        (SELECT COUNT(*) FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime'
         AND tablename IN (
             'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
             'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
             'cong_viec_bao_tri', 'yeu_cau_sua_chua'
         )) as realtime_count,
        
        (SELECT COUNT(*) FROM pg_tables 
         WHERE schemaname = 'public' 
         AND rowsecurity = true
         AND tablename IN (
             'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
             'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
             'cong_viec_bao_tri', 'yeu_cau_sua_chua'
         )) as rls_enabled_count,
        
        (SELECT COUNT(*) FROM information_schema.table_privileges 
         WHERE grantee = 'anon' 
         AND table_schema = 'public'
         AND table_name IN (
             'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
             'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
             'cong_viec_bao_tri', 'yeu_cau_sua_chua'
         )) as permission_count
)
SELECT 
    'OVERALL STATUS' as check_name,
    realtime_count || '/9' as realtime_tables,
    rls_enabled_count as rls_still_enabled,
    permission_count as total_permissions,
    CASE 
        WHEN realtime_count = 9 AND rls_enabled_count = 0 AND permission_count >= 27 THEN
            'PERFECT DEPLOYMENT - Ready to use!'
        WHEN realtime_count >= 7 AND rls_enabled_count = 0 AND permission_count >= 20 THEN
            'GOOD DEPLOYMENT - Minor issues'
        ELSE
            'ISSUES DETECTED - Check individual results'
    END as final_status
FROM deployment_status;

-- Simple message based on results
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime'
              AND tablename = 'thiet_bi') > 0 THEN
            'SUCCESS: Realtime is now active! Test your app for real-time updates.'
        ELSE
            'WARNING: Realtime not fully enabled. Check deployment logs.'
    END as deployment_message; 