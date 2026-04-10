"use client"

import React from "react"
import { format, differenceInMinutes } from "date-fns"
import { vi } from "date-fns/locale"
import { Printer, Download, Calendar, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Equipment } from "@/lib/data"
import {
  getVisibleUsageLogs,
  type UsageLogSortOrder,
  type UsageLogStatusFilter,
  USAGE_LOG_SORT_LABELS,
} from "@/lib/usage-log-display"
import { type UsageLog } from "@/types/database"

interface UsageLogPrintProps {
  equipment: Equipment
  sortOrder: UsageLogSortOrder
  usageLogs: UsageLog[]
}

// Status filter options configuration
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'hoan_thanh', label: 'Hoàn thành' },
  { value: 'dang_su_dung', label: 'Đang sử dụng' },
] as const

export function UsageLogPrint({ equipment, sortOrder, usageLogs }: UsageLogPrintProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<UsageLogStatusFilter>("all")

  // Filter logs based on date range and status
  const filteredLogs = React.useMemo(() => {
    return getVisibleUsageLogs(usageLogs, {
      sortOrder,
      dateFrom,
      dateTo,
      statusFilter,
    })
  }, [usageLogs, sortOrder, dateFrom, dateTo, statusFilter])

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const minutes = differenceInMinutes(end, start)
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours} giờ ${mins} phút`
    }
    return `${mins} phút`
  }

  const handlePrint = () => {
    const printContent = generatePrintContent()
    const printWindow = window.open('', '_blank')

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }

      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()
    }

    setIsDialogOpen(false)
  }

  const handleExport = () => {
    const csvContent = generateCSVContent()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `nhat-ky-su-dung-${equipment.ma_thiet_bi}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    setIsDialogOpen(false)
  }

  const generatePrintContent = () => {
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })
    const dateRange = dateFrom || dateTo 
      ? `(${dateFrom ? format(new Date(dateFrom), 'dd/MM/yyyy', { locale: vi }) : '...'} - ${dateTo ? format(new Date(dateTo), 'dd/MM/yyyy', { locale: vi }) : '...'})`
      : ''
    const activeUser = usageLogs?.find(log => log.trang_thai === 'dang_su_dung')?.nguoi_su_dung?.full_name || ''
    const sortLabel = USAGE_LOG_SORT_LABELS[sortOrder]
    const rowsPerPage = 10
    const paginatedLogs = filteredLogs.length > 0
      ? Array.from({ length: Math.ceil(filteredLogs.length / rowsPerPage) }, (_, index) =>
          filteredLogs.slice(index * rowsPerPage, (index + 1) * rowsPerPage)
        )
      : [[]]

    const totalPages = paginatedLogs.length

    const pagesMarkup = paginatedLogs.map((logsOnPage, pageIndex) => {
      const isLastPage = pageIndex === totalPages - 1

      return `
        <section class="print-page${pageIndex < totalPages - 1 ? ' page-break' : ''}">
          <div class="page-content">
            <div class="header">
              <img src="/cdc-logo-400x400.png" alt="Logo CDC" class="header-logo" onerror="this.style.display='none';">
              <div class="header-content">
                <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase;">TRUNG TÂM KIỂM SOÁT BỆNH TẬT THÀNH PHỐ CẦN THƠ</h2>
                <h1>NHẬT KÝ SỬ DỤNG THIẾT BỊ</h1>
                <h2>${equipment.ten_thiet_bi}</h2>
                <div>Mã thiết bị: ${equipment.ma_thiet_bi} ${dateRange}</div>
              </div>
              <div class="header-spacer"></div>
            </div>

            <div class="equipment-info">
              <div>
                <div class="info-item">
                  <span class="info-label">Tên thiết bị:</span>
                  <span>${equipment.ten_thiet_bi}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mã thiết bị:</span>
                  <span>${equipment.ma_thiet_bi}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Khoa/Phòng:</span>
                  <span>${equipment.khoa_phong_quan_ly || 'Chưa xác định'}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Hãng sản xuất:</span>
                  <span>${equipment.hang_san_xuat || 'Chưa có thông tin'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Model:</span>
                  <span>${equipment.model || 'Chưa có thông tin'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tình trạng hiện tại:</span>
                  <span>${equipment.tinh_trang_hien_tai || 'Chưa xác định'}</span>
                </div>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Người sử dụng</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Thời lượng</th>
                  <th>Tình trạng thiết bị</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                ${logsOnPage.length > 0 ? logsOnPage.map((log, index) => `
                  <tr>
                    <td style="text-align: center;">${pageIndex * rowsPerPage + index + 1}</td>
                    <td>${log.nguoi_su_dung?.full_name || 'Không xác định'}</td>
                    <td>${format(new Date(log.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm', { locale: vi })}</td>
                    <td>${log.thoi_gian_ket_thuc ? format(new Date(log.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}</td>
                    <td>${formatDuration(log.thoi_gian_bat_dau, log.thoi_gian_ket_thuc)}</td>
                    <td>${log.tinh_trang_thiet_bi || '-'}</td>
                    <td>${log.ghi_chu || '-'}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="7" style="text-align: center;">Không có dữ liệu nhật ký sử dụng trong khoảng lọc đã chọn</td>
                  </tr>
                `}
              </tbody>
            </table>

            ${isLastPage ? `
              <div class="footer">
                <div class="signature-section">
                  <div class="signature-title">Người lập báo cáo</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">${activeUser}</div>
                </div>
                <div class="signature-section">
                  <div class="signature-title">Phụ trách thiết bị</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">${equipment.nguoi_dang_truc_tiep_quan_ly || ''}</div>
                </div>
              </div>

              <div class="print-info">
                In ngày: ${currentDate} | Thứ tự: ${sortLabel} | Tổng số bản ghi: ${filteredLogs.length}
              </div>
            ` : ''}
          </div>

          <footer class="print-footer">
            <span>QLTB-BM.06</span>
            <span>BH.01 (05/2024)</span>
            <span>Trang: ${pageIndex + 1}/${totalPages}</span>
          </footer>
        </section>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nhật ký sử dụng thiết bị - ${equipment.ten_thiet_bi}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
          }

          .print-page {
            position: relative;
            min-height: 18.7cm;
            box-sizing: border-box;
            padding-bottom: 1.3cm;
          }

          .page-content {
            min-height: 100%;
          }

          .page-break {
            page-break-after: always;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }

          .header-content {
            flex-grow: 1;
            text-align: center;
          }

          .header-logo {
            width: 80px;
            height: 80px;
          }

          .header-spacer {
            width: 80px;
            height: 80px;
          }

          /* Print footer styles */
          .print-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            background: #fff;
          }
          
          .header h1 {
            font-size: 17px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
          }
          
          .header h2 {
            font-size: 18px;
            margin: 0 0 5px 0;
          }
          
          .equipment-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
          }
          
          .info-item {
            display: flex;
            margin-bottom: 5px;
          }
          
          .info-label {
            font-weight: bold;
            min-width: 120px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .data-table th,
          .data-table td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }
          
          .data-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .data-table td:nth-child(1) { width: 4%; } /* STT */
          .data-table td:nth-child(2) { width: 20%; } /* Người sử dụng */
          .data-table td:nth-child(3) { width: 15%; } /* Thời gian bắt đầu */
          .data-table td:nth-child(4) { width: 15%; } /* Thời gian kết thúc */
          .data-table td:nth-child(5) { width: 10%; } /* Thời lượng */
          .data-table td:nth-child(6) { width: 16%; } /* Tình trạng thiết bị */
          .data-table td:nth-child(7) { width: 12%; } /* Ghi chú */
          
          .footer {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          
          .signature-section {
            text-align: center;
          }
          
          .signature-title {
            font-weight: bold;
            margin-bottom: 0;
          }
          
          .signature-space {
            height: 60px;
          }
          
          .signature-name {
            font-weight: bold;
          }
          
          .print-info {
            font-size: 11px;
            color: #666;
            text-align: right;
            margin-top: 20px;
          }
          
          .status-completed { color: #059669; }
          .status-active { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        ${pagesMarkup}
      </body>
      </html>
    `
  }

  const generateCSVContent = () => {
    const headers = [
      'STT',
      'Người sử dụng',
      'Khoa/Phòng',
      'Thời gian bắt đầu',
      'Thời gian kết thúc',
      'Thời lượng (phút)',
      'Tình trạng thiết bị',
      'Ghi chú'
    ]

    const rows = filteredLogs.map((log, index) => [
      index + 1,
      log.nguoi_su_dung?.full_name || 'Không xác định',
      log.nguoi_su_dung?.khoa_phong || '',
      format(new Date(log.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm', { locale: vi }),
      log.thoi_gian_ket_thuc ? format(new Date(log.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm', { locale: vi }) : '',
      differenceInMinutes(
        log.thoi_gian_ket_thuc ? new Date(log.thoi_gian_ket_thuc) : new Date(),
        new Date(log.thoi_gian_bat_dau)
      ),
      log.tinh_trang_thiet_bi || '',
      log.ghi_chu || ''
    ])

    const csvContent = [
      `"Nhật ký sử dụng thiết bị: ${equipment.ten_thiet_bi}"`,
      `"Mã thiết bị: ${equipment.ma_thiet_bi}"`,
      `"Xuất ngày: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}"`,
      `"Thứ tự sắp xếp: ${USAGE_LOG_SORT_LABELS[sortOrder]}"`,
      '',
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return '\uFEFF' + csvContent // Add BOM for UTF-8
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          In báo cáo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>In báo cáo nhật ký sử dụng</DialogTitle>
          <DialogDescription>
            Thiết bị: {equipment.ten_thiet_bi} ({equipment.ma_thiet_bi})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Từ ngày</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Đến ngày</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Trạng thái</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as UsageLogStatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Số bản ghi sẽ in: <span className="font-medium">{filteredLogs.length}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Thứ tự: <span className="font-medium">{USAGE_LOG_SORT_LABELS[sortOrder]}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Xuất CSV
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            In báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
