-- =============================================================================
-- MIGRATION: Enable Realtime Publications for QLTBYT System
-- Date: 2024-12-29
-- Purpose: Bật tính năng Realtime Publications cho các bảng chính
--          để tăng hiệu năng và cập nhật dữ liệu theo thời gian thực
-- =============================================================================

-- Enable the realtime extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "realtime";

-- =============================================================================
-- SECTION 1: Enable Realtime for main tables
-- =============================================================================

-- Enable realtime for Equipment table (thiet_bi)
ALTER PUBLICATION supabase_realtime ADD TABLE thiet_bi;

-- Enable realtime for Users table (nhan_vien)  
ALTER PUBLICATION supabase_realtime ADD TABLE nhan_vien;

-- Enable realtime for Usage Logs table (nhat_ky_su_dung)
ALTER PUBLICATION supabase_realtime ADD TABLE nhat_ky_su_dung;

-- Enable realtime for Equipment History table (lich_su_thiet_bi)
ALTER PUBLICATION supabase_realtime ADD TABLE lich_su_thiet_bi;

-- Enable realtime for Transfer Requests table (yeu_cau_luan_chuyen)
ALTER PUBLICATION supabase_realtime ADD TABLE yeu_cau_luan_chuyen;

-- Enable realtime for Transfer History table (lich_su_luan_chuyen)
ALTER PUBLICATION supabase_realtime ADD TABLE lich_su_luan_chuyen;

-- Enable realtime for Maintenance Plans table (ke_hoach_bao_tri)
ALTER PUBLICATION supabase_realtime ADD TABLE ke_hoach_bao_tri;

-- Enable realtime for Maintenance Tasks table (cong_viec_bao_tri)
ALTER PUBLICATION supabase_realtime ADD TABLE cong_viec_bao_tri;

-- Enable realtime for Repair Requests table (yeu_cau_sua_chua)
ALTER PUBLICATION supabase_realtime ADD TABLE yeu_cau_sua_chua;

-- =============================================================================
-- SECTION 2: Enable Row Level Security (RLS) for Realtime
-- =============================================================================

-- Equipment table - Allow all operations for authenticated users
ALTER TABLE thiet_bi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for thiet_bi" ON thiet_bi
    FOR ALL TO authenticated
    USING (true);

-- Users table - Allow read for authenticated users, restrict modifications
ALTER TABLE nhan_vien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime read for nhan_vien" ON nhan_vien
    FOR SELECT TO authenticated
    USING (true);

-- Usage Logs table - Allow all operations for authenticated users
ALTER TABLE nhat_ky_su_dung ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for nhat_ky_su_dung" ON nhat_ky_su_dung
    FOR ALL TO authenticated
    USING (true);

-- Equipment History table - Allow all operations for authenticated users
ALTER TABLE lich_su_thiet_bi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for lich_su_thiet_bi" ON lich_su_thiet_bi
    FOR ALL TO authenticated
    USING (true);

-- Transfer Requests table - Allow all operations for authenticated users
ALTER TABLE yeu_cau_luan_chuyen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for yeu_cau_luan_chuyen" ON yeu_cau_luan_chuyen
    FOR ALL TO authenticated
    USING (true);

-- Transfer History table - Allow all operations for authenticated users
ALTER TABLE lich_su_luan_chuyen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for lich_su_luan_chuyen" ON lich_su_luan_chuyen
    FOR ALL TO authenticated
    USING (true);

-- Maintenance Plans table - Allow all operations for authenticated users
ALTER TABLE ke_hoach_bao_tri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for ke_hoach_bao_tri" ON ke_hoach_bao_tri
    FOR ALL TO authenticated
    USING (true);

-- Maintenance Tasks table - Allow all operations for authenticated users
ALTER TABLE cong_viec_bao_tri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for cong_viec_bao_tri" ON cong_viec_bao_tri
    FOR ALL TO authenticated
    USING (true);

-- Repair Requests table - Allow all operations for authenticated users
ALTER TABLE yeu_cau_sua_chua ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable realtime for yeu_cau_sua_chua" ON yeu_cau_sua_chua
    FOR ALL TO authenticated
    USING (true);

-- =============================================================================
-- SECTION 3: Create helper function to check realtime status
-- =============================================================================

CREATE OR REPLACE FUNCTION check_realtime_publications()
RETURNS TABLE (
    table_name text,
    is_published boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        EXISTS(
            SELECT 1 
            FROM pg_publication_tables pt 
            WHERE pt.pubname = 'supabase_realtime' 
            AND pt.tablename = t.tablename
        ) as is_published
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
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
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECTION 4: Grant necessary permissions
-- =============================================================================

-- Grant usage on realtime schema
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO anon;

-- Grant select permissions on realtime.messages for authenticated users
GRANT SELECT ON realtime.messages TO authenticated;

-- =============================================================================
-- VERIFICATION: Check that publications are enabled
-- =============================================================================

-- Run this to verify publications are working
-- SELECT * FROM check_realtime_publications();

-- Display enabled publications
SELECT 
    pubname as publication_name,
    tablename as table_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Realtime Publications đã được kích hoạt thành công!';
    RAISE NOTICE '📡 Các bảng sau đã được thêm vào supabase_realtime publication:';
    RAISE NOTICE '   - thiet_bi (Equipment)';
    RAISE NOTICE '   - nhan_vien (Users)';
    RAISE NOTICE '   - nhat_ky_su_dung (Usage Logs)';
    RAISE NOTICE '   - lich_su_thiet_bi (Equipment History)';
    RAISE NOTICE '   - yeu_cau_luan_chuyen (Transfer Requests)';
    RAISE NOTICE '   - lich_su_luan_chuyen (Transfer History)';
    RAISE NOTICE '   - ke_hoach_bao_tri (Maintenance Plans)';
    RAISE NOTICE '   - cong_viec_bao_tri (Maintenance Tasks)';
    RAISE NOTICE '   - yeu_cau_sua_chua (Repair Requests)';
    RAISE NOTICE '🔒 Row Level Security policies đã được thiết lập';
    RAISE NOTICE '🚀 Ứng dụng bây giờ sẽ nhận được cập nhật realtime!';
END $$; 