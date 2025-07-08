-- =============================================================================
-- MANUAL EMERGENCY ROLLBACK - CHỈ TẮT REALTIME
-- Copy/paste vào Supabase Dashboard > SQL Editor khi có sự cố
-- =============================================================================

-- ⚠️  QUAN TRỌNG: Script này CHỈ tắt Realtime, không ảnh hưởng app
-- App sẽ tiếp tục hoạt động bình thường, chỉ mất real-time updates

-- =============================================================================
-- STEP 1: DISABLE REALTIME PUBLICATIONS
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
-- STEP 2: VERIFY ROLLBACK
-- =============================================================================

-- Kiểm tra xem còn bao nhiêu tables trong realtime
SELECT 
    '🚨 ROLLBACK VERIFICATION' as check_type,
    COUNT(*) as remaining_tables,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ROLLBACK THÀNH CÔNG - Realtime đã tắt'
        ELSE '⚠️  VẪN CÒN ' || COUNT(*) || ' TABLES ACTIVE'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'thiet_bi', 'nhan_vien', 'nhat_ky_su_dung', 'lich_su_thiet_bi',
    'yeu_cau_luan_chuyen', 'lich_su_luan_chuyen', 'ke_hoach_bao_tri',
    'cong_viec_bao_tri', 'yeu_cau_sua_chua'
);

-- Hiển thị tables nào vẫn còn active (nếu có)
SELECT 
    '📋 STILL ACTIVE TABLES' as info,
    tablename,
    '⚠️  NEEDS MANUAL REMOVAL' as action
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
    RAISE NOTICE '🚨 EMERGENCY ROLLBACK COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Realtime Publications: DISABLED';
    RAISE NOTICE '🔓 RLS: KHÔNG THAY ĐỔI (vẫn disabled)';
    RAISE NOTICE '🔑 Permissions: KHÔNG THAY ĐỔI (vẫn granted)';
    RAISE NOTICE '';
    RAISE NOTICE '📱 App sẽ hoạt động như trước khi enable Realtime';
    RAISE NOTICE '⚡ Performance sẽ trở về polling mode';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 TO RE-ENABLE: Chạy lại 20241229_fix_realtime_without_rls.sql';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Test ứng dụng ngay lập tức';
    RAISE NOTICE '   2. Kiểm tra app hoạt động bình thường';
    RAISE NOTICE '   3. Monitor trong 10 phút';
    RAISE NOTICE '   4. Report issue nếu vẫn có vấn đề';
END $$; 