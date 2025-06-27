# Interactive Equipment Distribution Charts

## Tổng quan

Tính năng **Interactive Equipment Distribution Charts** đã được thêm vào tab **Xuất-Nhập-Tồn** trong trang **Báo cáo** để cung cấp khả năng phân tích và trực quan hóa phân bố thiết bị y tế theo vị trí và khoa/phòng một cách tương tác.

## Các tính năng chính

### 1. Equipment Distribution Summary
- **Tình trạng tổng thể**: Hiển thị tỷ lệ thiết bị đang hoạt động với thanh tiến trình và badge trạng thái
- **Tổng thiết bị**: Số lượng thiết bị trong hệ thống và thiết bị đang hoạt động
- **Thống kê khoa/phòng**: Số lượng khoa/phòng và số thiết bị trung bình
- **Thống kê vị trí**: Số lượng vị trí và phân bố thiết bị theo vị trí

### 2. Interactive Bar Chart
- **2 chế độ xem**:
  - Theo Khoa/Phòng: Phân bố thiết bị theo từng khoa/phòng
  - Theo Vị trí: Phân bố thiết bị theo vị trí lắp đặt
- **Tính tương tác**: Chuyển đổi giữa các chế độ xem dễ dàng
- **Bộ lọc**: Lọc chéo theo khoa/phòng hoặc vị trí khi xem chế độ còn lại
- **Stacked Bar Chart**: Hiển thị các trạng thái thiết bị trong cùng một cột

### 3. Phân loại trạng thái thiết bị
- **Hoạt động** (Xanh lá): Thiết bị đang sử dụng bình thường
- **Chờ sửa chữa** (Đỏ): Thiết bị cần sửa chữa
- **Chờ bảo trì** (Vàng): Thiết bị cần bảo trì
- **Chờ hiệu chuẩn/kiểm định** (Tím): Thiết bị cần hiệu chuẩn
- **Ngưng sử dụng** (Xám): Thiết bị tạm ngưng
- **Chưa có nhu cầu sử dụng** (Xám nhạt): Thiết bị chưa được sử dụng

## Kiến trúc kỹ thuật

### 1. Hook: `useEquipmentDistribution`
**Đường dẫn**: `src/hooks/use-equipment-distribution.ts`

**Chức năng**:
- Fetch dữ liệu thiết bị từ table `thiet_bi`
- Xử lý và phân loại theo khoa/phòng và vị trí
- Đếm thiết bị theo từng trạng thái
- Caching với React Query (5 phút stale time)

**Interfaces**:
```typescript
interface EquipmentDistributionItem {
  name: string
  total: number
  hoat_dong: number
  cho_sua_chua: number
  cho_bao_tri: number
  cho_hieu_chuan: number
  ngung_su_dung: number
  chua_co_nhu_cau: number
}

interface EquipmentDistributionData {
  byDepartment: EquipmentDistributionItem[]
  byLocation: EquipmentDistributionItem[]
  departments: string[]
  locations: string[]
  totalEquipment: number
}
```

### 2. Component: `InteractiveEquipmentChart`
**Đường dẫn**: `src/components/interactive-equipment-chart.tsx`

**Tính năng**:
- Sử dụng Recharts để hiển thị Stacked Bar Chart
- Tabs để chuyển đổi giữa chế độ xem
- Custom tooltip hiển thị chi tiết từng trạng thái
- Responsive design
- Loading states với Skeleton components

### 3. Component: `EquipmentDistributionSummary`
**Đường dẫn**: `src/components/equipment-distribution-summary.tsx`

**Tính năng**:
- Cards hiển thị thống kê tổng quan
- Health score với progress bar
- Breakdown chi tiết từng trạng thái
- Icons và màu sắc phân biệt trạng thái

### 4. Tích hợp vào Reports Page
**Đường dẫn**: `src/app/(app)/reports/components/inventory-report-tab.tsx`

**Vị trí**: Sau Summary Cards, trước Charts Section
- Equipment Distribution Summary
- Interactive Equipment Chart

## Truy vấn cơ sở dữ liệu

### Bảng chính: `thiet_bi`
```sql
SELECT 
  id,
  ma_thiet_bi,
  ten_thiet_bi,
  khoa_phong_quan_ly,
  vi_tri_lap_dat,
  tinh_trang_hien_tai
FROM thiet_bi
```

### Xử lý dữ liệu
1. **Nhóm theo khoa/phòng**: Đếm thiết bị theo `khoa_phong_quan_ly`
2. **Nhóm theo vị trí**: Đếm thiết bị theo `vi_tri_lap_dat`
3. **Phân loại trạng thái**: Đếm theo `tinh_trang_hien_tai`
4. **Sắp xếp**: Theo tổng số thiết bị giảm dần
5. **Giới hạn**: Top 10 để tối ưu hiển thị

## UI/UX Improvements

### 1. Responsive Design
- Mobile: Stack layout, simplified charts
- Tablet: Grid layout cho summary cards
- Desktop: Full layout với filters

### 2. Loading States
- Skeleton components cho charts
- Loading indicators cho filters
- Error handling với Alert components

### 3. Interactivity
- Hover effects trên chart bars
- Click để xem chi tiết trong tooltip
- Smooth transitions giữa tabs

### 4. Color Scheme
- Màu sắc consistent cho trạng thái
- Contrast cao cho accessibility
- Màu semantic (đỏ cho lỗi, xanh cho tốt)

## Performance Optimizations

### 1. React Query Caching
```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
gcTime: 15 * 60 * 1000,   // 15 minutes
retry: 2
```

### 2. Memoization
- `useMemo` cho data processing
- Tránh re-calculation không cần thiết
- Optimized filtering và sorting

### 3. Lazy Loading
- Components được load async
- Suspense boundaries cho loading states

## Tương lai và Mở rộng

### 1. Tính năng bổ sung
- **Drill-down**: Click vào bar để xem chi tiết thiết bị
- **Export**: Xuất chart thành PDF/PNG
- **Filters nâng cao**: Lọc theo ngày, loại thiết bị, giá trị
- **Comparison**: So sánh giữa các khoảng thời gian

### 2. Chart types khác
- **Pie Charts**: Phân bố tỷ lệ trạng thái
- **Treemap**: Hierarchy view của departments/locations
- **Scatter Plot**: Correlation giữa các metrics
- **Heatmap**: Equipment density by location

### 3. Real-time Updates
- WebSocket integration cho real-time data
- Auto-refresh với configurable intervals
- Notification cho changes quan trọng

### 4. Analytics nâng cao
- **Trends**: Theo dõi thay đổi theo thời gian
- **Predictions**: Machine learning cho maintenance
- **Alerts**: Cảnh báo thiết bị cần chú ý
- **Reports**: Scheduled reports gửi email

## Monitoring và Maintenance

### 1. Performance Monitoring
- Track query response times
- Monitor component render times
- Cache hit/miss ratios

### 2. Error Handling
- Graceful degradation khi API fails
- User-friendly error messages
- Fallback UI states

### 3. Data Quality
- Validation cho equipment status
- Handle missing data gracefully
- Data consistency checks

### 4. User Feedback
- Usage analytics
- User interaction tracking
- Feature adoption metrics

## Kết luận

Tính năng Interactive Equipment Distribution Charts cung cấp một cái nhìn toàn diện và tương tác về phân bố thiết bị y tế, giúp quản lý dễ dàng theo dõi tình trạng và phân bố thiết bị theo khoa/phòng và vị trí. Với kiến trúc modular và hiệu suất được tối ưu, tính năng này có thể dễ dàng mở rộng và tùy chỉnh theo nhu cầu cụ thể của từng bệnh viện. 