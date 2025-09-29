# Changelog

All notable changes to the QLTBYT (Quản lý Thiết bị Y tế) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2024-12-29

### Added
- **Enhanced Excel Export for Reports**: Extended Excel export functionality with 3 new comprehensive datasets
  - **Device Status Distribution** (`Phân bố trạng thái thiết bị`): Shows count and percentage of devices by status (Active, Waiting for repair, etc.)
  - **Device Distribution by Department** (`Phân bố theo Khoa/Phòng`): Equipment breakdown by department with status analysis
  - **Device Distribution by Location** (`Phân bố theo Vị trí`): Equipment breakdown by physical location with status analysis
- New Excel sheets now included in export:
  - Sheet 4: Device Status Distribution with percentage calculations
  - Sheet 5: Department-wise equipment distribution with activity ratios
  - Sheet 6: Location-wise equipment distribution with activity ratios

### Changed
- **Reports Excel Export**: Now generates 6 sheets instead of 3 (Tổng quan, Chi tiết, Thống kê + 3 new distribution sheets)
- **Export Dialog**: Updated to fetch and display equipment distribution data
- **Column Widths**: Optimized Excel column widths for better readability of new data

### Technical Details
- Integrated `useEquipmentDistribution` hook in export dialog
- Added data generation functions for status and distribution analysis
- Enhanced `createMultiSheetExcel` usage with proper column formatting
- Leveraged existing equipment distribution data infrastructure

---

## [2.0.0] - 2024-12-15

### Added
- **Department-based Data Filtering**: Implemented role-based data access control
  - Non-admin users now see only equipment from their assigned department
  - Department-specific caching for improved performance
  - Visual indicators showing active department filters

### Changed
- **Equipment Page**: Added department filtering for non-admin users
- **Cache Strategy**: Updated to include department-specific cache keys
- **User Experience**: Added notification banners for department-filtered views

### Security
- Enhanced data access control based on user department assignments
- Improved row-level security for department-specific data access

---

## [1.5.0] - 2024-11-30

### Added
- **Progressive Web App (PWA)** functionality
- **QR Code Scanner** for equipment identification
- **Real-time Usage Analytics Dashboard**
- **Equipment Transfer Management** system

### Improved
- **Mobile responsiveness** across all pages
- **Performance optimization** with code splitting and lazy loading
- **Database indexing** for faster queries

---

## [1.0.0] - 2024-10-15

### Added
- Initial release of QLTBYT system
- **User Management** with role-based access control
- **Equipment Inventory** management
- **Repair Request** workflow
- **Maintenance Planning** system
- **Basic Reporting** functionality
- **Supabase Integration** for backend services

### Features
- Equipment CRUD operations
- Excel import/export for equipment data
- User authentication and authorization
- Basic equipment status tracking
- Repair request management
- Maintenance scheduling

---

## Development Guidelines

### Version Numbering
- **Major version** (X.0.0): Breaking changes or major feature additions
- **Minor version** (X.Y.0): New features, backwards compatible
- **Patch version** (X.Y.Z): Bug fixes, small improvements

### Commit Message Format
```
type(scope): description

Examples:
feat(reports): add device status distribution to Excel export
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
```

### Release Process
1. Update version in `package.json`
2. Update this CHANGELOG.md
3. Create git tag with version number
4. Deploy to production environment
5. Update documentation if needed

---

*For more details about each release, see the [GitHub Releases](https://github.com/thienchi2109/quan-ly-tbyt/releases) page.*