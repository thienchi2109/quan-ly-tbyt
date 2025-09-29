# 🏥 Hệ thống Quản lý Thiết bị Y tế (QLTBYT)

## 📋 Tổng quan

Hệ thống quản lý thiết bị y tế hiện đại được xây dựng bằng Next.js và Supabase, hỗ trợ quản lý toàn diện thiết bị y tế trong các cơ sở y tế.

## ✨ Tính năng chính

### 🔐 Quản lý người dùng và phân quyền
- Đăng nhập an toàn với phân quyền theo vai trò
- Quản lý tài khoản người dùng (Admin, Tổ QLTB, QLTB Khoa/Phòng, Nhân viên)
- Lọc dữ liệu theo phòng ban cho nhân viên

### 📦 Quản lý danh mục thiết bị
- Thêm, sửa, xóa thông tin thiết bị
- Import/Export danh sách qua Excel
- Quét mã QR để truy cập nhanh thông tin
- Theo dõi tình trạng thiết bị theo thời gian thực

### 🔧 Yêu cầu sửa chữa
- Tạo và theo dõi yêu cầu sửa chữa
- Workflow duyệt yêu cầu có phân quyền
- Quản lý trạng thái và lịch sử sửa chữa

### 🛠️ Kế hoạch bảo trì
- Lập kế hoạch bảo trì định kỳ
- Tạo hàng loạt công việc bảo trì
- Theo dõi tiến độ thực hiện

### ↔️ Luân chuyển thiết bị
- Quản lý luân chuyển nội bộ và bên ngoài
- Theo dõi trạng thái luân chuyển
- Lịch sử di chuyển thiết bị

### 📊 Báo cáo và thống kê nâng cao
- **Báo cáo Xuất-Nhập-Tồn** với 6 sheet Excel:
  - Tổng quan và chi tiết giao dịch
  - Thống kê theo khoa/phòng
  - **Phân bố trạng thái thiết bị** ⭐
  - **Phân bố theo khoa/phòng** ⭐  
  - **Phân bố theo vị trí** ⭐
- Báo cáo bảo trì và sử dụng thiết bị
- Biểu đồ trực quan tương tác

### 📱 Progressive Web App (PWA)
- Cài đặt như app native trên mobile
- Hoạt động offline với dữ liệu cached
- Giao diện responsive tối ưu cho mọi thiết bị

## 🏗️ Kiến trúc kỹ thuật

### Frontend
- **Next.js 14** với App Router
- **TypeScript** cho type safety
- **Tailwind CSS** và **shadcn/ui** cho UI
- **React Query (TanStack Query)** cho data fetching
- **Zustand** cho state management

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** cho bảo mật
- **Real-time subscriptions** cho cập nhật tức thời

### Tính năng bổ sung
- **XLSX** cho export/import Excel
- **QR Scanner** cho quét mã thiết bị  
- **Chart.js** cho visualization
- **Date-fns** cho xử lý thời gian

## 🚀 Triển khai

### Môi trường phát triển
```bash
# Clone repository
git clone https://github.com/thienchi2109/quan-ly-tbyt.git
cd quan-ly-tbyt

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Điền thông tin Supabase vào .env.local

# Run development server
npm run dev
```

### Môi trường production
- **Cloudflare Pages** cho hosting
- **Supabase Cloud** cho database và auth
- **CI/CD** tự động qua GitHub Actions

## 📁 Cấu trúc thư mục

```
quan-ly-tbyt/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── lib/                 # Utilities và configs
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── database/
│   └── migrations/          # SQL migration files
└── docs/                    # Documentation
```

## 🔒 Bảo mật

- **Row Level Security** trên tất cả bảng database
- **JWT Authentication** qua Supabase Auth
- **Role-based Access Control** (RBAC)
- **Input validation** và **SQL injection protection**

## 📈 Hiệu năng

- **Code splitting** và **lazy loading**
- **Image optimization** với Next.js
- **Database indexing** cho truy vấn nhanh
- **Caching** với React Query và localStorage

## 🛠️ Cập nhật gần đây

### Version 2.1.0 (Tháng 12, 2024)
- ✅ **Nâng cấp báo cáo Excel** với 3 dataset mới
- ✅ **Phân bố trạng thái thiết bị** 
- ✅ **Phân bố theo khoa/phòng**
- ✅ **Phân bố theo vị trí**
- ✅ Tối ưu hóa database với indexes mới
- ✅ Cải thiện UI/UX cho mobile

## 📚 Tài liệu

- [Hướng dẫn sử dụng](./HUONG_DAN_SU_DUNG.md)
- [Hướng dẫn triển khai](./DEPLOYMENT.md)
- [CI/CD Setup](./CI-CD.md)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Hỗ trợ

- **GitHub Issues**: [Báo cáo lỗi](https://github.com/thienchi2109/quan-ly-tbyt/issues)
- **Email**: thienchi2109@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Phát triển bởi team QLTBYT với ❤️ cho cộng đồng y tế Việt Nam*
