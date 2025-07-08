-- =====================================================
-- SAFE INDEXES ONLY - VERIFIED COLUMNS
-- =====================================================
-- This migration creates only indexes for columns that are confirmed to exist
-- Based on actual code analysis and avoiding any risky assumptions

-- =====================================================
-- 1. REPAIR REQUESTS INDEXES (yeu_cau_sua_chua)
-- =====================================================
-- Only create indexes for columns we know exist from the code

-- Status filtering (confirmed from code)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_trang_thai
ON yeu_cau_sua_chua (trang_thai);

-- Equipment reference for JOINs (confirmed from code)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_thiet_bi_id
ON yeu_cau_sua_chua (thiet_bi_id);

-- Date filtering (confirmed from code)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_ngay_yeu_cau
ON yeu_cau_sua_chua (ngay_yeu_cau);

CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_ngay_hoan_thanh
ON yeu_cau_sua_chua (ngay_hoan_thanh);

-- Requester filtering (confirmed from code - TEXT field)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_nguoi_yeu_cau
ON yeu_cau_sua_chua (nguoi_yeu_cau);

-- Text search on description only (confirmed column)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_mo_ta_trgm
ON yeu_cau_sua_chua USING gin (mo_ta_su_co gin_trgm_ops);

-- =====================================================
-- 2. MAINTENANCE PLANS INDEXES (ke_hoach_bao_tri)
-- =====================================================

-- Year filtering
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_nam
ON ke_hoach_bao_tri (nam);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_trang_thai
ON ke_hoach_bao_tri (trang_thai);

-- Creation date
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_created_at
ON ke_hoach_bao_tri (created_at);

-- =====================================================
-- 3. MAINTENANCE SCHEDULES INDEXES (lich_bao_tri)
-- =====================================================

-- Equipment reference
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_thiet_bi_id
ON lich_bao_tri (thiet_bi_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_trang_thai
ON lich_bao_tri (trang_thai);

-- Maintenance date
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_ngay_bao_tri
ON lich_bao_tri (ngay_bao_tri);

-- Completion date
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_ngay_hoan_thanh
ON lich_bao_tri (ngay_hoan_thanh);

-- Composite index for equipment + date queries
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_equipment_date
ON lich_bao_tri (thiet_bi_id, ngay_bao_tri DESC);

-- =====================================================
-- 4. STAFF INDEXES (nhan_vien)
-- =====================================================

-- Department filtering (for role-based access)
CREATE INDEX IF NOT EXISTS idx_nhan_vien_khoa_phong
ON nhan_vien (khoa_phong);

-- User ID reference (confirmed from code)
CREATE INDEX IF NOT EXISTS idx_nhan_vien_user_id
ON nhan_vien (user_id);

-- Name search
CREATE INDEX IF NOT EXISTS idx_nhan_vien_ho_ten_trgm
ON nhan_vien USING gin (ho_ten gin_trgm_ops);

-- =====================================================
-- 5. PERFORMANCE MONITORING
-- =====================================================

-- Create simple index usage monitoring view
CREATE OR REPLACE VIEW safe_index_usage AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE relname IN ('yeu_cau_sua_chua', 'lich_bao_tri', 'ke_hoach_bao_tri', 'nhan_vien')
ORDER BY relname, idx_scan DESC;

-- =====================================================
-- 6. INDEX COMMENTS
-- =====================================================

COMMENT ON INDEX idx_yeu_cau_sua_chua_mo_ta_trgm IS 'GIN index for text search on repair request descriptions';
COMMENT ON INDEX idx_lich_bao_tri_equipment_date IS 'Composite index for maintenance schedule queries';
COMMENT ON INDEX idx_nhan_vien_khoa_phong IS 'Index for role-based access control';
COMMENT ON VIEW safe_index_usage IS 'Monitor usage of safe indexes';

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

/*
To verify these indexes work, run:

-- Check repair request filtering
EXPLAIN ANALYZE SELECT * FROM yeu_cau_sua_chua WHERE trang_thai = 'Chờ xử lý';

-- Check maintenance schedule by equipment
EXPLAIN ANALYZE SELECT * FROM lich_bao_tri WHERE thiet_bi_id = 1 ORDER BY ngay_bao_tri DESC;

-- Check department filtering
EXPLAIN ANALYZE SELECT * FROM nhan_vien WHERE khoa_phong = 'Khoa Nội';

-- Check text search
EXPLAIN ANALYZE SELECT * FROM yeu_cau_sua_chua WHERE mo_ta_su_co ILIKE '%máy%';
*/
