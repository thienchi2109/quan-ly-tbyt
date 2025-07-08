-- =============================================================================
-- COMPLETE ROLLBACK: Revert All Realtime Changes
-- Date: 2024-12-29
-- Purpose: Rollback tất cả changes về trạng thái ban đầu an toàn
-- =============================================================================

-- =============================================================================
-- STEP 1: DISABLE REALTIME PUBLICATIONS (Ưu tiên cao nhất)
-- =============================================================================

-- Remove tất cả tables khỏi realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS thiet_bi;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS nhan_vien;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS nhat_ky_su_dung;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS lich_su_thiet_bi;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS yeu_cau_luan_chuyen;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS lich_su_luan_chuyen;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS ke_hoach_bao_tri;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS cong_viec_bao_tri;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS yeu_cau_sua_chua;

-- =============================================================================
-- STEP 2: REVOKE PERMISSIONS (Nếu cần tăng cường security)
-- =============================================================================

-- NOTE: CHỈ CHẠY phần này nếu muốn tăng cường security
-- Để lại comment để user tự quyết định

/*
-- Revoke permissions từ anon role (CẢNH BÁO: Có thể break app!)
REVOKE ALL ON thiet_bi FROM anon;
REVOKE ALL ON nhan_vien FROM anon;
REVOKE ALL ON nhat_ky_su_dung FROM anon;
REVOKE ALL ON lich_su_thiet_bi FROM anon;
REVOKE ALL ON yeu_cau_luan_chuyen FROM anon;
REVOKE ALL ON lich_su_luan_chuyen FROM anon;
REVOKE ALL ON ke_hoach_bao_tri FROM anon;
REVOKE ALL ON cong_viec_bao_tri FROM anon;
REVOKE ALL ON yeu_cau_sua_chua FROM anon;
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM anon;
*/

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

-- Kiểm tra realtime publications đã được remove
SELECT 
    'Realtime Publications' as component,
    COUNT(*) as remaining_tables,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ DISABLED'
        ELSE '⚠️  STILL ACTIVE'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- Kiểm tra RLS status (should remain disabled for custom auth)
SELECT 
    'RLS Status' as component,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 ENABLED (May cause issues)'
        ELSE '🔓 DISABLED (Good for custom auth)'
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
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚨 ROLLBACK HOÀN TẤT!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Realtime Publications: DISABLED';
    RAISE NOTICE '🔓 RLS: VẪN DISABLED (cần thiết cho custom auth)';
    RAISE NOTICE '🔑 Permissions: VẪN GRANTED (để app hoạt động)';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Ứng dụng sẽ hoạt động như trước, chỉ mất Realtime';
    RAISE NOTICE '⚡ Performance sẽ trở về polling như cũ';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️  QUAN TRỌNG: RLS vẫn disabled để tránh break app';
    RAISE NOTICE '    Nếu cần enable RLS, phải config lại custom auth';
END $$; 