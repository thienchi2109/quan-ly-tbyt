-- =============================================================================
-- REALTIME DEPLOYMENT: Enable Realtime Publications for Custom Auth System
-- Date: 2024-12-29  
-- Purpose: Enable Realtime, disable RLS, và cấu hình permissions cho custom auth
-- Actions: 
--   1. Disable RLS policies (cần thiết cho custom auth)
--   2. Enable Realtime Publications cho 9 tables chính
--   3. Grant permissions cho anon role (để custom auth hoạt động)
-- =============================================================================

-- =============================================================================
-- SECTION 1: DISABLE RLS và XÓA POLICIES (QUAN TRỌNG!)
-- =============================================================================

-- Disable RLS cho tất cả bảng và xóa policies
ALTER TABLE thiet_bi DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for thiet_bi" ON thiet_bi;

ALTER TABLE nhan_vien DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime read for nhan_vien" ON nhan_vien;

ALTER TABLE nhat_ky_su_dung DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for nhat_ky_su_dung" ON nhat_ky_su_dung;

ALTER TABLE lich_su_thiet_bi DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for lich_su_thiet_bi" ON lich_su_thiet_bi;

ALTER TABLE yeu_cau_luan_chuyen DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for yeu_cau_luan_chuyen" ON yeu_cau_luan_chuyen;

ALTER TABLE lich_su_luan_chuyen DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for lich_su_luan_chuyen" ON lich_su_luan_chuyen;

ALTER TABLE ke_hoach_bao_tri DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for ke_hoach_bao_tri" ON ke_hoach_bao_tri;

ALTER TABLE cong_viec_bao_tri DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for cong_viec_bao_tri" ON cong_viec_bao_tri;

ALTER TABLE yeu_cau_sua_chua DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable realtime for yeu_cau_sua_chua" ON yeu_cau_sua_chua;

-- =============================================================================
-- SECTION 2: ENABLE Realtime Publications
-- =============================================================================

-- Enable realtime cho tất cả tables chính
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS thiet_bi;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS nhan_vien;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS nhat_ky_su_dung;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS lich_su_thiet_bi;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS yeu_cau_luan_chuyen;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS lich_su_luan_chuyen;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ke_hoach_bao_tri;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS cong_viec_bao_tri;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS yeu_cau_sua_chua;

-- =============================================================================
-- SECTION 3: Cấu hình permissions cho Realtime với Custom Auth
-- =============================================================================

-- Grant permissions cho anon role (vì app sử dụng anon key với custom auth)
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT SELECT ON realtime.messages TO anon;

-- Grant full access cho các bảng chính với anon role (cho custom auth)
GRANT ALL ON thiet_bi TO anon;
GRANT ALL ON nhan_vien TO anon; 
GRANT ALL ON nhat_ky_su_dung TO anon;
GRANT ALL ON lich_su_thiet_bi TO anon;
GRANT ALL ON yeu_cau_luan_chuyen TO anon;
GRANT ALL ON lich_su_luan_chuyen TO anon;
GRANT ALL ON ke_hoach_bao_tri TO anon;
GRANT ALL ON cong_viec_bao_tri TO anon;
GRANT ALL ON yeu_cau_sua_chua TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- SECTION 4: Verify Configuration
-- =============================================================================

-- Kiểm tra RLS status (should all be false)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'thiet_bi',
    'nhan_vien', 
    'nhat_ky_su_dung',
    'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen',
    'lich_su_luan_chuyen',
    'ke_hoach_bao_tri',
    'cong_viec_bao_tri',
    'yeu_cau_sua_chua'
)
ORDER BY tablename;

-- Kiểm tra publications đã được enable
SELECT 
    'REALTIME PUBLICATIONS VERIFICATION' as check_type,
    COUNT(*) as enabled_tables,
    CASE 
        WHEN COUNT(*) = 9 THEN '✅ HOÀN HẢO - Tất cả 9 tables đã enable!'
        WHEN COUNT(*) > 0 THEN '⚠️  PARTIAL - Chỉ có ' || COUNT(*) || '/9 tables'
        ELSE '❌ THẤT BẠI - Không có table nào'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 REALTIME DEPLOYMENT HOÀN TẤT!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS đã được GỠ BỎ thành công!';
    RAISE NOTICE '📡 Realtime Publications đã được ENABLE cho 9 tables';
    RAISE NOTICE '🔓 Custom auth system sẽ hoạt động bình thường';
    RAISE NOTICE '🔑 Permissions đã được grant cho anon role';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Chạy MANUAL_POST_VERIFICATION.sql để verify';
    RAISE NOTICE '   2. Test ứng dụng có real-time updates';
    RAISE NOTICE '   3. Monitor performance improvement';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  LƯU Ý: Bảo mật được xử lý ở application layer';
    RAISE NOTICE '    thông qua custom authentication system hiện có.';
    RAISE NOTICE '';
    RAISE NOTICE '🆘 NẾU CÓ VẤN ĐỀ: Chạy MANUAL_ROLLBACK_SIMPLE.sql';
END $$; 