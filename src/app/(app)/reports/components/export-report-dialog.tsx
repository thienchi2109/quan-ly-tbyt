"use client"

import * as React from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { createMultiSheetExcel } from "@/lib/excel-utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem, InventorySummary } from "../hooks/use-inventory-data"
import { useEquipmentDistribution, STATUS_LABELS } from "@/hooks/use-equipment-distribution"

interface DateRange {
  from: Date
  to: Date
}

interface ExportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: InventoryItem[]
  summary: InventorySummary
  dateRange: DateRange
  department: string
}

export function ExportReportDialog({
  open,
  onOpenChange,
  data,
  summary,
  dateRange,
  department
}: ExportReportDialogProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = React.useState(false)
  const [fileName, setFileName] = React.useState("")

  // Fetch equipment distribution data for the new sheets
  const { data: equipmentDistribution } = useEquipmentDistribution(
    department === "all" ? undefined : department
  )

  // Generate default filename
  React.useEffect(() => {
    if (open) {
      const fromDate = format(dateRange.from, "dd-MM-yyyy")
      const toDate = format(dateRange.to, "dd-MM-yyyy")
      const defaultName = `BaoCao_XuatNhapTon_${fromDate}_${toDate}`
      setFileName(defaultName)
    }
  }, [open, dateRange])

  // Generate device status distribution data
  const generateStatusDistributionData = () => {
    if (!equipmentDistribution) return []

    // Calculate total equipment
    const totalEquipment = equipmentDistribution.totalEquipment

    // Sum up all status counts from departments data
    const statusCounts = equipmentDistribution.byDepartment.reduce((acc, dept) => {
      acc.hoat_dong += dept.hoat_dong
      acc.cho_sua_chua += dept.cho_sua_chua
      acc.cho_bao_tri += dept.cho_bao_tri
      acc.cho_hieu_chuan += dept.cho_hieu_chuan
      acc.ngung_su_dung += dept.ngung_su_dung
      acc.chua_co_nhu_cau += dept.chua_co_nhu_cau
      return acc
    }, {
      hoat_dong: 0,
      cho_sua_chua: 0,
      cho_bao_tri: 0,
      cho_hieu_chuan: 0,
      ngung_su_dung: 0,
      chua_co_nhu_cau: 0
    })

    // Convert to array format for Excel
    return Object.entries(statusCounts).map(([key, count]) => ({
      "Trạng thái": STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      "Số lượng": count,
      "Tỷ lệ (%)": totalEquipment > 0 ? Math.round((count / totalEquipment) * 100) : 0
    })).filter(item => item["Số lượng"] > 0)
  }

  // Generate device distribution by department data
  const generateDepartmentDistributionData = () => {
    if (!equipmentDistribution) return []

    return equipmentDistribution.byDepartment.map(dept => ({
      "Khoa/Phòng": dept.name,
      "Tổng số TB": dept.total,
      "Hoạt động": dept.hoat_dong,
      "Chờ sửa chữa": dept.cho_sua_chua,
      "Chờ bảo trì": dept.cho_bao_tri,
      "Chờ hiệu chuẩn": dept.cho_hieu_chuan,
      "Ngưng sử dụng": dept.ngung_su_dung,
      "Chưa có nhu cầu": dept.chua_co_nhu_cau,
      "Tỷ lệ hoạt động (%)": dept.total > 0 ? Math.round((dept.hoat_dong / dept.total) * 100) : 0
    })).sort((a, b) => b["Tổng số TB"] - a["Tổng số TB"])
  }

  // Generate device distribution by location data
  const generateLocationDistributionData = () => {
    if (!equipmentDistribution) return []

    return equipmentDistribution.byLocation.map(location => ({
      "Vị trí": location.name,
      "Tổng số TB": location.total,
      "Hoạt động": location.hoat_dong,
      "Chờ sửa chữa": location.cho_sua_chua,
      "Chờ bảo trì": location.cho_bao_tri,
      "Chờ hiệu chuẩn": location.cho_hieu_chuan,
      "Ngưng sử dụng": location.ngung_su_dung,
      "Chưa có nhu cầu": location.chua_co_nhu_cau,
      "Tỷ lệ hoạt động (%)": location.total > 0 ? Math.round((location.hoat_dong / location.total) * 100) : 0
    })).sort((a, b) => b["Tổng số TB"] - a["Tổng số TB"])
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Prepare summary data
      const summaryData = [
        ["BÁO CÁO XUẤT-NHẬP-TỒN THIẾT BỊ"],
        [""],
        ["Thời gian:", `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`],
        ["Khoa/Phòng:", department === "all" ? "Tất cả" : department],
        ["Ngày xuất báo cáo:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })],
        [""],
        ["TỔNG QUAN"],
        ["Tổng thiết bị nhập:", summary.totalImported],
        ["Tổng thiết bị xuất:", summary.totalExported],
        ["Tồn kho hiện tại:", summary.currentStock],
        ["Biến động thuần:", summary.netChange >= 0 ? `+${summary.netChange}` : summary.netChange],
        [""],
        ["CHI TIẾT GIAO DỊCH"]
      ]

      // Prepare detailed data
      const detailedData = data.map(item => ({
        "Ngày": format(new Date(item.ngay_nhap), "dd/MM/yyyy"),
        "Mã thiết bị": item.ma_thiet_bi,
        "Tên thiết bị": item.ten_thiet_bi,
        "Model": item.model || "",
        "Serial": item.serial || "",
        "Khoa/Phòng": item.khoa_phong_quan_ly || "Chưa phân loại",
        "Loại giao dịch": item.type === "import" ? "Nhập" : "Xuất",
        "Nguồn/Hình thức": getSourceLabel(item.source),
        "Lý do/Đích đến": item.reason || item.destination || "",
        "Giá trị": item.value || ""
      }))

      // Create statistics sheet data
      const statsData = generateStatistics(data)

      // Generate new dataset sheets
      const statusDistributionData = generateStatusDistributionData()
      const departmentDistributionData = generateDepartmentDistributionData()
      const locationDistributionData = generateLocationDistributionData()

      // Create multi-sheet Excel file using dynamic import
      await createMultiSheetExcel([
        {
          name: "Tổng quan",
          data: summaryData,
          type: "array",
          columnWidths: [25, 30]
        },
        {
          name: "Chi tiết",
          data: detailedData,
          type: "json",
          columnWidths: [12, 15, 30, 15, 15, 20, 15, 20, 25, 15]
        },
        {
          name: "Thống kê",
          data: statsData,
          type: "json",
          columnWidths: [25, 15, 15, 15]
        },
        {
          name: "Phân bố trạng thái TB",
          data: statusDistributionData,
          type: "json",
          columnWidths: [25, 15, 15]
        },
        {
          name: "Phân bố theo Khoa-Phòng",
          data: departmentDistributionData,
          type: "json",
          columnWidths: [25, 12, 12, 12, 12, 12, 12, 15, 15]
        },
        {
          name: "Phân bố theo Vị trí",
          data: locationDistributionData,
          type: "json",
          columnWidths: [25, 12, 12, 12, 12, 12, 12, 15, 15]
        }
      ], fileName)

      toast({
        title: "Xuất báo cáo thành công",
        description: `Đã tạo file ${fileName}.xlsx`,
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Lỗi xuất báo cáo",
        description: error.message || "Không thể xuất báo cáo",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      manual: "Thêm thủ công",
      excel: "Import Excel",
      transfer_internal: "Luân chuyển nội bộ",
      transfer_external: "Luân chuyển bên ngoài",
      liquidation: "Thanh lý"
    }
    return labels[source] || source
  }

  const generateStatistics = (data: InventoryItem[]) => {
    const deptStats = new Map<string, { nhap: number; xuat: number }>()
    
    data.forEach(item => {
      const dept = item.khoa_phong_quan_ly || "Chưa phân loại"
      if (!deptStats.has(dept)) {
        deptStats.set(dept, { nhap: 0, xuat: 0 })
      }
      const stats = deptStats.get(dept)!
      if (item.type === "import") {
        stats.nhap += 1
      } else {
        stats.xuat += 1
      }
    })

    return Array.from(deptStats.entries()).map(([dept, stats]) => ({
      "Khoa/Phòng": dept,
      "Nhập": stats.nhap,
      "Xuất": stats.xuat,
      "Tổng": stats.nhap + stats.xuat
    })).sort((a, b) => b.Tổng - a.Tổng)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Xuất báo cáo Excel
          </DialogTitle>
          <DialogDescription>
            Xuất báo cáo xuất-nhập-tồn thiết bị ra file Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export info */}
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Khoảng thời gian:</span>
              <Badge variant="outline">
                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Khoa/Phòng:</span>
              <Badge variant="outline">{department === "all" ? "Tất cả" : department}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Số bản ghi:</span>
              <Badge>{data.length} giao dịch</Badge>
            </div>
          </div>

          <Separator />

          {/* Summary preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.totalImported}</div>
              <div className="text-sm text-muted-foreground">Thiết bị nhập</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.totalExported}</div>
              <div className="text-sm text-muted-foreground">Thiết bị xuất</div>
            </div>
          </div>

          <Separator />

          {/* File name input */}
          <div className="space-y-2">
            <Label htmlFor="filename">Tên file</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nhập tên file..."
            />
            <p className="text-xs text-muted-foreground">
              File sẽ được lưu với định dạng .xlsx
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !fileName.trim()}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 