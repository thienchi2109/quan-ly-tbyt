"use client"

import { Calendar, CheckCircle, Settings, Trash2, Wrench, ArrowRightLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { type Equipment } from "@/lib/data"

export type Attachment = {
  id: string
  ten_file: string
  duong_dan_luu_tru: string
  thiet_bi_id: number
}

export type HistoryItem = {
  id: number
  ngay_thuc_hien: string
  loai_su_kien: string
  mo_ta: string
  chi_tiet: {
    mo_ta_su_co?: string
    hang_muc_sua_chua?: string
    nguoi_yeu_cau?: string
    cong_viec_id?: number
    thang?: number
    ten_ke_hoach?: string
    khoa_phong?: string
    nam?: number
    ma_yeu_cau?: string
    loai_hinh?: string
    khoa_phong_hien_tai?: string
    khoa_phong_nhan?: string
    don_vi_nhan?: string
  } | null
}

export const getStatusVariant = (status: Equipment["tinh_trang_hien_tai"]) => {
  switch (status) {
    case "Hoạt động":
      return "default"
    case "Chờ bảo trì":
    case "Chờ hiệu chuẩn/kiểm định":
      return "secondary"
    case "Chờ sửa chữa":
      return "destructive"
    case "Ngưng sử dụng":
    case "Chưa có nhu cầu sử dụng":
      return "outline"
    default:
      return "outline"
  }
}

export const getClassificationVariant = (classification: Equipment["phan_loai_theo_nd98"]) => {
  if (!classification) return "outline"
  const trimmed = classification.trim().toUpperCase()
  if (trimmed === "A" || trimmed === "LOẠI A") return "default"
  if (trimmed === "B" || trimmed === "LOẠI B" || trimmed === "C" || trimmed === "LOẠI C") return "secondary"
  if (trimmed === "D" || trimmed === "LOẠI D") return "destructive"
  return "outline"
}

export const renderEquipmentFieldValue = (equipment: Equipment, key: keyof Equipment) => {
  const value = equipment[key]

  if (key === "tinh_trang_hien_tai") {
    const statusValue = value as Equipment["tinh_trang_hien_tai"]
    return statusValue ? (
      <Badge variant={getStatusVariant(statusValue)}>{statusValue}</Badge>
    ) : (
      <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
    )
  }

  if (key === "phan_loai_theo_nd98") {
    const classification = value as Equipment["phan_loai_theo_nd98"]
    return classification ? (
      <Badge variant={getClassificationVariant(classification)}>{classification.trim()}</Badge>
    ) : (
      <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
    )
  }

  if (key === "gia_goc") {
    return value ? `${Number(value).toLocaleString()} đ` : <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
  }

  if (value === null || value === undefined || value === "") {
    return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
  }

  return String(value)
}

export const getHistoryIcon = (eventType: string) => {
  switch (eventType) {
    case "Sửa chữa":
      return <Wrench className="h-4 w-4 text-muted-foreground" />
    case "Bảo trì":
    case "Bảo trì định kỳ":
    case "Bảo trì dự phòng":
      return <Settings className="h-4 w-4 text-muted-foreground" />
    case "Luân chuyển":
    case "Luân chuyển nội bộ":
    case "Luân chuyển bên ngoài":
      return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
    case "Hiệu chuẩn":
    case "Kiểm định":
      return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    case "Thanh lý":
      return <Trash2 className="h-4 w-4 text-muted-foreground" />
    default:
      return <Calendar className="h-4 w-4 text-muted-foreground" />
  }
}

export const columnLabels: Record<keyof Equipment, string> = {
  id: "ID",
  ma_thiet_bi: "Mã thiết bị",
  ten_thiet_bi: "Tên thiết bị",
  model: "Model",
  serial: "Serial",
  cau_hinh_thiet_bi: "Cấu hình",
  phu_kien_kem_theo: "Phụ kiện kèm theo",
  hang_san_xuat: "Hãng sản xuất",
  noi_san_xuat: "Nơi sản xuất",
  nam_san_xuat: "Năm sản xuất",
  ngay_nhap: "Ngày nhập",
  ngay_dua_vao_su_dung: "Ngày đưa vào sử dụng",
  nguon_kinh_phi: "Nguồn kinh phí",
  gia_goc: "Giá gốc",
  nam_tinh_hao_mon: "Năm tính hao mòn",
  ty_le_hao_mon: "Tỷ lệ hao mòn theo TT23",
  han_bao_hanh: "Hạn bảo hành",
  vi_tri_lap_dat: "Vị trí lắp đặt",
  nguoi_dang_truc_tiep_quan_ly: "Người sử dụng",
  khoa_phong_quan_ly: "Khoa/phòng quản lý",
  tinh_trang_hien_tai: "Tình trạng",
  ghi_chu: "Ghi chú",
  chu_ky_bt_dinh_ky: "Chu kỳ BT định kỳ (ngày)",
  ngay_bt_tiep_theo: "Ngày BT tiếp theo",
  chu_ky_hc_dinh_ky: "Chu kỳ HC định kỳ (ngày)",
  ngay_hc_tiep_theo: "Ngày HC tiếp theo",
  chu_ky_kd_dinh_ky: "Chu kỳ KĐ định kỳ (ngày)",
  ngay_kd_tiep_theo: "Ngày KĐ tiếp theo",
  phan_loai_theo_nd98: "Phân loại theo NĐ98",
}

export const filterableColumns: (keyof Equipment)[] = [
  "khoa_phong_quan_ly",
  "vi_tri_lap_dat",
  "nguoi_dang_truc_tiep_quan_ly",
  "phan_loai_theo_nd98",
  "tinh_trang_hien_tai",
]
