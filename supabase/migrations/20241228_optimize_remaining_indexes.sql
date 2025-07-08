-- =====================================================
-- OPTIMIZE REMAINING TABLES INDEXES FOR COMPLETE COVERAGE
-- =====================================================
-- This migration adds missing indexes for tables that haven't been optimized yet:
-- 1. yeu_cau_sua_chua (Repair Requests)
-- 2. ke_hoach_bao_tri (Maintenance Plans)
-- 3. lich_bao_tri (Maintenance Schedules)
-- 4. nhan_vien (Staff/Employees)

-- =====================================================
-- 1. REPAIR REQUESTS INDEXES (yeu_cau_sua_chua)
-- =====================================================

-- Status filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_trang_thai
ON yeu_cau_sua_chua (trang_thai);

-- Equipment reference for JOINs
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_thiet_bi_id
ON yeu_cau_sua_chua (thiet_bi_id);

-- Date filtering and sorting
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_ngay_yeu_cau
ON yeu_cau_sua_chua (ngay_yeu_cau);

CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_ngay_hoan_thanh
ON yeu_cau_sua_chua (ngay_hoan_thanh);

-- User reference for filtering by requester (FULL index, no partial)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_nguoi_yeu_cau
ON yeu_cau_sua_chua (nguoi_yeu_cau);

-- Note: nguoi_xu_ly is not a direct column in yeu_cau_sua_chua table
-- It's accessed via JOIN with profiles table in queries

-- Text search on description only (ghi_chu column may not exist)
CREATE INDEX IF NOT EXISTS idx_yeu_cau_sua_chua_search_text
ON yeu_cau_sua_chua USING gin (
  mo_ta_su_co gin_trgm_ops
);

-- =====================================================
-- 2. MAINTENANCE PLANS INDEXES (ke_hoach_bao_tri)
-- =====================================================

-- Year filtering (common filter)
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_nam
ON ke_hoach_bao_tri (nam);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_trang_thai
ON ke_hoach_bao_tri (trang_thai);

-- Date tracking
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_created_at
ON ke_hoach_bao_tri (created_at);

-- Composite index for year + status
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_year_status
ON ke_hoach_bao_tri (nam, trang_thai);

-- Text search on plan name and description
CREATE INDEX IF NOT EXISTS idx_ke_hoach_bao_tri_search_text
ON ke_hoach_bao_tri USING gin (
  (ten_ke_hoach || ' ' || COALESCE(mo_ta, '')) gin_trgm_ops
);

-- =====================================================
-- 3. MAINTENANCE SCHEDULES INDEXES (lich_bao_tri)
-- =====================================================

-- Equipment reference for JOINs
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_thiet_bi_id
ON lich_bao_tri (thiet_bi_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_trang_thai
ON lich_bao_tri (trang_thai);

-- Maintenance type filtering
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_loai_bao_tri
ON lich_bao_tri (loai_bao_tri);

-- Date filtering and sorting
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_ngay_bao_tri
ON lich_bao_tri (ngay_bao_tri);

CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_ngay_hoan_thanh
ON lich_bao_tri (ngay_hoan_thanh);

-- User reference for filtering by performer (FULL index, no partial)
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_nguoi_thuc_hien
ON lich_bao_tri (nguoi_thuc_hien);

-- Composite index for equipment + date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_equipment_date
ON lich_bao_tri (thiet_bi_id, ngay_bao_tri DESC);

-- Composite index for status + date
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_status_date
ON lich_bao_tri (trang_thai, ngay_bao_tri);

-- Text search on description and notes
CREATE INDEX IF NOT EXISTS idx_lich_bao_tri_search_text
ON lich_bao_tri USING gin (
  (mo_ta || ' ' || COALESCE(ghi_chu, '')) gin_trgm_ops
);

-- =====================================================
-- 4. STAFF/EMPLOYEES INDEXES (nhan_vien)
-- =====================================================

-- Department filtering (for role-based access)
CREATE INDEX IF NOT EXISTS idx_nhan_vien_khoa_phong
ON nhan_vien (khoa_phong);

-- User ID reference for profile lookups (FULL index, no partial)
CREATE INDEX IF NOT EXISTS idx_nhan_vien_user_id
ON nhan_vien (user_id);

-- Text search on employee name
CREATE INDEX IF NOT EXISTS idx_nhan_vien_ho_ten_trgm
ON nhan_vien USING gin (ho_ten gin_trgm_ops);

-- =====================================================
-- 5. PERFORMANCE MONITORING VIEWS
-- =====================================================

-- Create comprehensive index usage monitoring view
CREATE OR REPLACE VIEW comprehensive_index_usage AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE relname IN ('thiet_bi', 'yeu_cau_sua_chua', 'ke_hoach_bao_tri', 'lich_bao_tri', 'yeu_cau_luan_chuyen', 'lich_su_thiet_bi', 'nhan_vien')
ORDER BY relname, idx_scan DESC;

-- =====================================================
-- 6. INDEX COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Note: Removed status_priority composite index due to missing muc_do_uu_tien column
COMMENT ON INDEX idx_yeu_cau_sua_chua_search_text IS 'GIN index for full-text search on repair request descriptions';
COMMENT ON INDEX idx_ke_hoach_bao_tri_year_status IS 'Composite index for maintenance plan year and status filtering';
COMMENT ON INDEX idx_lich_bao_tri_equipment_date IS 'Composite index for maintenance schedule equipment and date queries';
COMMENT ON INDEX idx_nhan_vien_khoa_phong IS 'Index for role-based access control by department';
COMMENT ON VIEW comprehensive_index_usage IS 'Monitor index usage across all major tables';

-- =====================================================
-- 7. QUERY OPTIMIZATION EXAMPLES
-- =====================================================

/*
OPTIMIZED QUERY PATTERNS:

1. Repair Request Filtering:
   SELECT * FROM yeu_cau_sua_chua
   WHERE trang_thai = 'cho_xu_ly'
   ORDER BY ngay_yeu_cau DESC
   -- Uses: idx_yeu_cau_sua_chua_trang_thai

2. Maintenance History by Equipment:
   SELECT * FROM lich_bao_tri
   WHERE thiet_bi_id = 123
   ORDER BY ngay_bao_tri DESC
   -- Uses: idx_lich_bao_tri_equipment_date

3. Department-based Equipment Access:
   SELECT tb.* FROM thiet_bi tb
   JOIN nhan_vien nv ON nv.khoa_phong = tb.khoa_phong_quan_ly
   WHERE nv.user_id = 'user-uuid'
   -- Uses: idx_nhan_vien_khoa_phong, idx_thiet_bi_khoa_phong_quan_ly

4. Maintenance Plan Search:
   SELECT * FROM ke_hoach_bao_tri
   WHERE nam = 2024 AND ten_ke_hoach ILIKE '%keyword%'
   -- Uses: idx_ke_hoach_bao_tri_year_status, idx_ke_hoach_bao_tri_search_text
*/
