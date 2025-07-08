"use client"

import * as React from "react"
import type { Column, ColumnDef } from "@tanstack/react-table"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  File,
  PlusCircle,
  FilterX,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  QrCode,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Loader2,
  Wrench,
  Settings,
  ArrowRightLeft,
  CheckCircle,
  Calendar,
} from "lucide-react"
import Link from 'next/link'
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Equipment } from "@/lib/data"
import { supabase, supabaseError } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddEquipmentDialog } from "@/components/add-equipment-dialog"
import { ImportEquipmentDialog } from "@/components/import-equipment-dialog"
import { useAuth } from "@/contexts/auth-context"
import { EditEquipmentDialog } from "@/components/edit-equipment-dialog"
import { MobileFiltersDropdown } from "@/components/mobile-filters-dropdown"
import { ResponsivePaginationInfo } from "@/components/responsive-pagination-info"
import { useIsMobile } from "@/hooks/use-mobile"
import { exportArrayToExcel, exportToExcel } from "@/lib/excel-utils"
import { UsageHistoryTab } from "@/components/usage-history-tab"
import { ActiveUsageIndicator } from "@/components/active-usage-indicator"
import { MobileUsageActions } from "@/components/mobile-usage-actions"
import { useSearchDebounce } from "@/hooks/use-debounce"

type Attachment = {
  id: string;
  ten_file: string;
  duong_dan_luu_tru: string;
  thiet_bi_id: number;
};

type HistoryItem = {
    id: number;
    ngay_thuc_hien: string;
    loai_su_kien: string;
    mo_ta: string;
    chi_tiet: {
      // Repair request fields
      mo_ta_su_co?: string;
      hang_muc_sua_chua?: string;
      nguoi_yeu_cau?: string;
      // Maintenance fields
      cong_viec_id?: number;
      thang?: number;
      ten_ke_hoach?: string;
      khoa_phong?: string;
      nam?: number;
      // Transfer fields
      ma_yeu_cau?: string;
      loai_hinh?: string;
      khoa_phong_hien_tai?: string;
      khoa_phong_nhan?: string;
      don_vi_nhan?: string;
    } | null;
  };

const getStatusVariant = (status: Equipment["tinh_trang_hien_tai"]) => {
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

const getClassificationVariant = (classification: Equipment["phan_loai_theo_nd98"]) => {
  if (!classification) return "outline"
  const trimmed = classification.trim().toUpperCase();
  if (trimmed === 'A' || trimmed === 'LOẠI A') return "default"
  if (trimmed === 'B' || trimmed === 'LOẠI B' || trimmed === 'C' || trimmed === 'LOẠI C') return "secondary"
  if (trimmed === 'D' || trimmed === 'LOẠI D') return "destructive"
  return "outline"
}

const columnLabels: Record<keyof Equipment, string> = {
  id: 'ID',
  ma_thiet_bi: 'Mã thiết bị',
  ten_thiet_bi: 'Tên thiết bị',
  model: 'Model',
  serial: 'Serial',
  cau_hinh_thiet_bi: 'Cấu hình',
  phu_kien_kem_theo: 'Phụ kiện kèm theo',
  hang_san_xuat: 'Hãng sản xuất',
  noi_san_xuat: 'Nơi sản xuất',
  nam_san_xuat: 'Năm sản xuất',
  ngay_nhap: 'Ngày nhập',
  ngay_dua_vao_su_dung: 'Ngày đưa vào sử dụng',
  nguon_kinh_phi: 'Nguồn kinh phí',
  gia_goc: 'Giá gốc',
  nam_tinh_hao_mon: 'Năm tính hao mòn',
  ty_le_hao_mon: 'Tỷ lệ hao mòn theo TT23',
  han_bao_hanh: 'Hạn bảo hành',
  vi_tri_lap_dat: 'Vị trí lắp đặt',
  nguoi_dang_truc_tiep_quan_ly: 'Người sử dụng',
  khoa_phong_quan_ly: 'Khoa/phòng quản lý',
  tinh_trang_hien_tai: 'Tình trạng',
  ghi_chu: 'Ghi chú',
  chu_ky_bt_dinh_ky: 'Chu kỳ BT định kỳ (ngày)',
  ngay_bt_tiep_theo: 'Ngày BT tiếp theo',
  chu_ky_hc_dinh_ky: 'Chu kỳ HC định kỳ (ngày)',
  ngay_hc_tiep_theo: 'Ngày HC tiếp theo',
  chu_ky_kd_dinh_ky: 'Chu kỳ KĐ định kỳ (ngày)',
  ngay_kd_tiep_theo: 'Ngày KĐ tiếp theo',
  phan_loai_theo_nd98: 'Phân loại theo NĐ98',
}

const filterableColumns: (keyof Equipment)[] = [
    'khoa_phong_quan_ly',
    'vi_tri_lap_dat',
    'nguoi_dang_truc_tiep_quan_ly',
    'phan_loai_theo_nd98',
    'tinh_trang_hien_tai'
];

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
  }[]
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed touch-target-sm md:h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} đã chọn
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        <span className="truncate max-w-[100px]">{option.label}</span>
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto" align="start">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value)
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectedValues.add(option.value)
                } else {
                  selectedValues.delete(option.value)
                }
                const filterValues = Array.from(selectedValues)
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined
                )
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{option.label}</span>
            </DropdownMenuCheckboxItem>
          )
        })}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => column?.setFilterValue(undefined)}
              className="justify-center text-center"
            >
              Xóa bộ lọc
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


export default function EquipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth();
  const { toast } = useToast()
  const [data, setData] = React.useState<Equipment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useSearchDebounce(searchTerm)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null)
  const [currentTab, setCurrentTab] = React.useState<string>("details")
  const isMobile = useIsMobile();

  // State for attachments
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = React.useState(false);
  const [newFileName, setNewFileName] = React.useState("");
  const [newFileUrl, setNewFileUrl] = React.useState("");
  const [isSubmittingAttachment, setIsSubmittingAttachment] = React.useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = React.useState<string | null>(null);

  // State for history
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // State to preserve pagination during data reload
  const [preservePageState, setPreservePageState] = React.useState<{
    pageIndex: number;
    pageSize: number;
  } | null>(null);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    ma_thiet_bi: true,           // Mã thiết bị ✅
    ten_thiet_bi: true,          // Tên thiết bị ✅
    model: true,                 // Model ✅
    serial: true,                // Serial ✅
    cau_hinh_thiet_bi: false,
    phu_kien_kem_theo: false,
    hang_san_xuat: false,
    noi_san_xuat: false,
    nam_san_xuat: false,
    ngay_nhap: false,
    ngay_dua_vao_su_dung: false,
    nguon_kinh_phi: false,
    gia_goc: false,
    nam_tinh_hao_mon: false,
    ty_le_hao_mon: false,
    han_bao_hanh: false,
    vi_tri_lap_dat: true,        // Vị trí lắp đặt ✅
    nguoi_dang_truc_tiep_quan_ly: true,  // Người sử dụng ✅
    khoa_phong_quan_ly: true,    // Khoa/phòng ✅
    tinh_trang_hien_tai: true,   // Tình trạng ✅
    ghi_chu: false,
    chu_ky_bt_dinh_ky: false,
    ngay_bt_tiep_theo: false,
    chu_ky_hc_dinh_ky: false,
    ngay_hc_tiep_theo: false,
    chu_ky_kd_dinh_ky: false,
    ngay_kd_tiep_theo: false,
    phan_loai_theo_nd98: true,   // Phân loại theo NĐ98 ✅
  });

  const handleDownloadTemplate = async () => {
    try {
      const templateHeaders = Object.entries(columnLabels)
        .filter(([key]) => key !== 'id')
        .map(([, label]) => label);

      const colWidths = templateHeaders.map(header => Math.max(header.length, 25));

      await exportArrayToExcel(
        [templateHeaders],
        "Mau_Nhap_Thiet_Bi.xlsx",
        "Template Thiết Bị",
        colWidths
      );
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải template. Vui lòng thử lại.",
      });
    }
  };

  const handleGenerateProfileSheet = (equipment: Equipment) => {
    if (!equipment) return;

    const formatValue = (value: any) => value ?? "";
    const formatCurrency = (value: any) => {
        if (value === null || value === undefined || value === "") return "";
        return Number(value).toLocaleString('vi-VN') + ' VNĐ';
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Phiếu Lý Lịch Thiết Bị - ${formatValue(equipment.ma_thiet_bi)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; background-color: #e5e7eb; line-height: 1.5; }
              .a4-page { width: 21cm; min-height: 29.7cm; padding: 1cm 2cm; margin: 1cm auto; background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); position: relative; display: flex; flex-direction: column; }
              .content-body { flex-grow: 1; }
              .form-input-line { font-family: inherit; font-size: inherit; border: none; border-bottom: 1px dotted #000; background-color: transparent; padding: 1px; outline: none; width: 100%; }
              h1, h2, .font-bold { font-weight: 700; }
              .title-main { font-size: 20px; }
              .title-sub { font-size: 16px; }
              .form-section { border: 1px solid #000; padding: 8px; }
              .long-text { white-space: pre-wrap; word-break: break-word; min-height: 22px; }
              .signature-box { border: 1px solid #000; border-top: none; }
              .signature-area { text-align: center; padding: 12px; }
              .signature-space { height: 80px; }
              .signature-name-input { border: none; background-color: transparent; text-align: center; font-weight: 700; width: 100%; margin-top: 8px; }
              .signature-name-input:focus { outline: none; }
              @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #fff !important; }
                  .a4-page { display: block !important; width: auto; height: auto; min-height: 0; margin: 0 !important; padding: 1cm 2cm !important; box-shadow: none !important; border: none !important; }
                  body > *:not(.a4-page) { display: none; }
                  .print-footer { position: fixed; bottom: 1cm; left: 2cm; right: 2cm; width: calc(100% - 4cm); }
                  .content-body { padding-bottom: 3cm; }
                  .form-section, .signature-box, header { page-break-inside: avoid; }
              }
          </style>
      </head>
      <body>
          <div class="a4-page">
              <div class="content-body">
                  <header class="text-center">
                      <div class="flex justify-between items-center">
                          <img src="https://i.postimg.cc/W1ym4T74/cdc-logo-150.png" alt="Logo CDC" class="w-20 h-20" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/e2e8f0?text=Logo';">
                          <div class="flex-grow">
                              <h2 class="title-sub uppercase font-bold">TRUNG TÂM KIỂM SOÁT BỆNH TẬT THÀNH PHỐ CẦN THƠ</h2>
                              <div class="flex items-baseline justify-center mt-2">
                                  <label class="font-bold whitespace-nowrap">KHOA/PHÒNG:</label>
                                  <div class="w-1/2 ml-2"><input type="text" class="form-input-line" value="${formatValue(equipment.khoa_phong_quan_ly)}"></div>
                              </div>
                          </div>
                      </div>
                  </header>
                  <main class="mt-4">
                      <div class="form-section">
                          <h1 class="title-main uppercase font-bold text-center">PHIẾU LÝ LỊCH THIẾT BỊ</h1>
                      </div>
                      <div class="form-section border-t-0">
                          <div class="flex items-baseline">
                              <label class="whitespace-nowrap w-28">1. Tên thiết bị:</label>
                              <input type="text" class="form-input-line ml-2" value="${formatValue(equipment.ten_thiet_bi)}">
                          </div>
                           <div class="grid grid-cols-2 gap-x-8 mt-2">
                              <div class="flex items-baseline">
                                 <label class="whitespace-nowrap w-28">Mã số TB:</label>
                                 <input type="text" class="form-input-line ml-2" value="${formatValue(equipment.ma_thiet_bi)}">
                              </div>
                               <div class="flex items-baseline">
                                 <label class="whitespace-nowrap">Mã số TB ban đầu:</label>
                                 <input type="text" class="form-input-line ml-2" value="">
                              </div>
                          </div>
                      </div>
                      <div class="form-section border-t-0">
                          <div class="grid grid-cols-2 gap-x-8">
                              <div class="flex items-baseline"><label class="w-28">2. Model:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.model)}"></div>
                              <div class="flex items-baseline"><label class="w-36">7. Ngày nhập:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.ngay_nhap)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-28">3. Serial N⁰:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.serial)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-36">8. Ngày đưa vào sử dụng:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.ngay_dua_vao_su_dung)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-28">4. Hãng SX:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.hang_san_xuat)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-36">9. Vị trí lắp đặt:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.vi_tri_lap_dat)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-28">5. Nơi SX:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.noi_san_xuat)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-36">10. Giá gốc:</label><input type="text" class="form-input-line ml-2" value="${formatCurrency(equipment.gia_goc)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-28">6. Năm SX:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.nam_san_xuat)}"></div>
                              <div class="flex items-baseline mt-2"><label class="w-36">11. Nguồn kinh phí:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.nguon_kinh_phi)}"></div>
                          </div>
                      </div>
                      <div class="form-section border-t-0">
                          <div class="flex items-center">
                              <label class="whitespace-nowrap">12. Bảo hành:</label>
                              <div class="ml-10 flex items-center gap-x-10">
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2" ${!equipment.han_bao_hanh ? 'checked' : ''}>Không</label>
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2" ${equipment.han_bao_hanh ? 'checked' : ''}>Có ( Ngày BH cuối cùng: <span class="inline-block w-48 ml-2"><input type="text" class="form-input-line" value="${formatValue(equipment.han_bao_hanh)}"></span>)</label>
                              </div>
                          </div>
                      </div>
                       <div class="form-section border-t-0">
                          <div class="flex items-center">
                              <label class="whitespace-nowrap">13. Hiệu chuẩn thiết bị:</label>
                              <div class="ml-10 flex items-center gap-x-10">
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2">Không cần</label>
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2">Cần hiệu chuẩn</label>
                              </div>
                          </div>
                      </div>
                      <div class="form-section border-t-0">
                          <div class="flex items-baseline"><label class="whitespace-nowrap">14. Cấu hình thiết bị:</label>
                              <div class="form-input-line long-text ml-2">${formatValue(equipment.cau_hinh_thiet_bi)}</div>
                          </div>
                      </div>
                       <div class="form-section border-t-0">
                           <div class="flex items-baseline"><label class="whitespace-nowrap">15. Phụ kiện kèm theo:</label>
                              <div class="form-input-line long-text ml-2">${formatValue(equipment.phu_kien_kem_theo)}</div>
                          </div>
                      </div>
                      <div class="form-section border-t-0">
                           <div class="flex items-center">
                              <label class="whitespace-nowrap">16. Tình trạng khi nhận:</label>
                              <div class="ml-10 flex items-center gap-x-10">
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2">Mới 100%</label>
                                   <label class="flex items-center"><input type="checkbox" class="h-4 w-4 mr-2">Thiết bị cũ ( phần trăm còn lại: <span class="inline-block w-24 ml-2"><input type="text" class="form-input-line"></span>%)</label>
                              </div>
                          </div>
                      </div>
                       <div class="form-section border-t-0">
                          <div class="flex items-baseline"><label class="whitespace-nowrap">17. Tình trạng thiết bị hiện tại:</label><input type="text" class="form-input-line ml-2" value="${formatValue(equipment.tinh_trang_hien_tai)}"></div>
                      </div>
                      <div class="signature-box">
                          <div class="flex justify-end pt-2 pr-2">
                              <p class="italic">Cần Thơ, ngày <span class="inline-block w-8"><input type="text" class="form-input-line text-center"></span> tháng <span class="inline-block w-8"><input type="text" class="form-input-line text-center"></span> năm <span class="inline-block w-16"><input type="text" class="form-input-line text-center"></span></p>
                          </div>
                          <div class="flex">
                              <div class="w-1/2 signature-area border-r border-gray-400">
                                   <p class="font-bold">Lãnh đạo khoa/ phòng</p>
                                   <p class="italic">(Ký, ghi rõ họ và tên)</p>
                                   <div class="signature-space"></div>
                                   <input type="text" class="signature-name-input" placeholder="(Họ và tên)">
                              </div>
                               <div class="w-1/2 signature-area">
                                   <p class="font-bold">Người trực tiếp quản lý</p>
                                   <p class="italic">(Ký, ghi rõ họ và tên)</p>
                                   <div class="signature-space"></div>
                                   <input type="text" class="signature-name-input" value="${formatValue(equipment.nguoi_dang_truc_tiep_quan_ly)}">
                              </div>
                          </div>
                      </div>
                  </main>
              </div>
              <footer class="print-footer flex justify-between items-center text-xs">
                  <span>QLTB-BM.03</span>
                  <span>BH.01 (05/2024)</span>
                  <span>Trang: 1/1</span>
              </footer>
          </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open("", "_blank");
    if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }
  }

  const handleGenerateDeviceLabel = (equipment: Equipment) => {
    if (!equipment) return;

    const formatValue = (value: any) => value ?? "";
    
    const qrText = formatValue(equipment.ma_thiet_bi);
    const qrSize = 112;
    const qrUrl = qrText 
        ? `https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&caption=${encodeURIComponent(qrText)}&captionFontFamily=mono&captionFontSize=12&size=${qrSize}&ecLevel=H&margin=2` 
        : `https://placehold.co/${qrSize}x${qrSize}/ffffff/cccccc?text=QR+Code`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nhãn Thiết Bị - ${formatValue(equipment.ma_thiet_bi)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Roboto Slab', serif; }
              .form-input-line { border-bottom: 1px dotted #333; width: 100%; min-height: 24px; padding: 1px 0.25rem; }
              .long-text-label { white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
              @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #fff !important; margin: 0; }
                  .label-container { box-shadow: none !important; border: 3px double #000 !important; margin: 0; page-break-inside: avoid; }
                  body > *:not(.label-container) { display: none; }
              }
          </style>
      </head>
      <body class="bg-gray-200 flex items-center justify-center min-h-screen p-4">
          <div class="w-full max-w-md bg-white p-4 shadow-lg label-container" style="border: 3px double #000;">
              <header class="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
                  <div class="flex-shrink-0">
                      <img src="https://i.postimg.cc/W1ym4T74/cdc-logo-150.png" alt="Logo CDC" class="w-16 h-auto" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/e2e8f0?text=Logo';">
                  </div>
                  <div class="text-center flex-grow">
                      <h1 class="text-2xl font-bold tracking-wider">NHÃN THIẾT BỊ</h1>
                      <div class="flex items-baseline mt-2">
                          <label class="text-base font-semibold whitespace-nowrap">Khoa:</label>
                          <div class="form-input-line ml-2 text-center uppercase">${formatValue(equipment.khoa_phong_quan_ly)}</div>
                      </div>
                  </div>
              </header>
              <main class="mt-4 space-y-3">
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Tên thiết bị:</label>
                      <div class="form-input-line long-text-label flex-grow">${formatValue(equipment.ten_thiet_bi)}</div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Mã số TB:</label>
                      <div class="form-input-line">${formatValue(equipment.ma_thiet_bi)}</div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Model:</label>
                      <div class="form-input-line">${formatValue(equipment.model)}</div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Serial N⁰:</label>
                      <div class="form-input-line">${formatValue(equipment.serial)}</div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Ngày hiệu chuẩn:</label>
                      <div class="form-input-line">${formatValue(equipment.ngay_hc_tiep_theo)}</div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Ngày hết hạn:</label>
                      <div class="form-input-line"></div>
                  </div>
                  <div class="flex items-baseline">
                      <label class="text-base font-semibold w-40 shrink-0">Tình trạng hiện tại:</label>
                      <div class="form-input-line font-medium">${formatValue(equipment.tinh_trang_hien_tai)}</div>
                  </div>
              </main>
              <div class="mt-4 flex items-center justify-between gap-4 border-t-2 border-gray-300 pt-3">
                  <div class="flex flex-col items-center">
                       <label class="text-sm font-semibold">Mã QR của TB</label>
                       <img id="qr-image" 
                           src="${qrUrl}"
                           alt="Mã QR của ${qrText}" 
                           class="w-28 h-28 border rounded-md p-1 bg-white mt-1"
                           onerror="this.onerror=null;this.src='https://placehold.co/112x112/ffffff/cccccc?text=QR+Code';"
                       >
                  </div>
                  <footer class="text-right self-end">
                      <p class="font-bold text-sm">QLTB-BM.04</p>
                  </footer>
              </div>
          </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open("", "_blank");
    if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }
  }

  const handleShowDetails = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailModalOpen(true);
  };

  const renderActions = (equipment: Equipment) => {
    const canEdit = user && (
      user.role === 'admin' ||
      user.role === 'to_qltb' ||
      (user.role === 'qltb_khoa' && user.khoa_phong === equipment.khoa_phong_quan_ly)
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
           <DropdownMenuItem onSelect={() => handleShowDetails(equipment)}>
            Xem chi tiết
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onSelect={() => setEditingEquipment(equipment)}>
              Sửa thông tin
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => router.push(`/repair-requests?equipmentId=${equipment.id}`)}>
            Tạo yêu cầu sửa chữa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  const columns: ColumnDef<Equipment>[] = [
    ...(Object.keys(columnLabels) as Array<keyof Equipment>).map((key) => {
      const columnDef: ColumnDef<Equipment> = {
        accessorKey: key,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {columnLabels[key]}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const value = row.getValue(key)
  
          if (key === 'tinh_trang_hien_tai') {
            const statusValue = value as Equipment["tinh_trang_hien_tai"];
            if (!statusValue) {
              return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
            }
            return (
              <Badge variant={getStatusVariant(statusValue)}>
                {statusValue}
              </Badge>
            )
          }
          
          if (key === 'phan_loai_theo_nd98') {
            const classification = value as Equipment["phan_loai_theo_nd98"];
            if (!classification) {
              return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>;
            }
            return (
              <Badge variant={getClassificationVariant(classification)}>
                {classification.trim()}
              </Badge>
            );
          }
  
          if (key === 'gia_goc') {
            if (value === null || value === undefined) {
               return <div className="text-right italic text-muted-foreground">Chưa có dữ liệu</div>
            }
            return <div className="text-right">{Number(value).toLocaleString()}đ</div>
          }
          
          if (value === null || value === undefined || value === "") {
              return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
          }
  
          return <div className="truncate max-w-xs">{String(value)}</div>
        },
      }
  
      if (filterableColumns.includes(key)) {
          columnDef.filterFn = (row, id, value) => {
              const rowValue = row.getValue(id) as string;
              if (!rowValue) return false;
              return value.includes(rowValue.trim());
          }
      }
  
      return columnDef;
    }),
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => renderActions(row.original),
    },
  ]

  const CACHE_KEY = 'equipment_data';

  const fetchEquipment = React.useCallback(async () => {
      setIsLoading(true);

      try {
        const cachedItemJSON = localStorage.getItem(CACHE_KEY);
        if (cachedItemJSON) {
          const cachedItem = JSON.parse(cachedItemJSON);
          setData(cachedItem.data as Equipment[]);
          setIsLoading(false);
          // Do not return here to allow background refresh if needed later.
        }
      } catch (e) {
        console.error("Error reading from localStorage, fetching from network.", e);
        localStorage.removeItem(CACHE_KEY);
      }
      
      if (supabaseError) {
          toast({
              variant: "destructive",
              title: "Lỗi cấu hình Supabase",
              description: supabaseError,
              duration: 10000,
          })
          setData([]);
          setIsLoading(false);
          return;
      }
      if (!supabase) {
          setIsLoading(false);
          return;
      }

      const { data, error } = await supabase.from('thiet_bi').select('*').order('id', { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải dữ liệu thiết bị. " + error.message,
        })
        if (!localStorage.getItem(CACHE_KEY)) {
            setData([]);
        }
      } else {
        setData(data as Equipment[]);
        try {
            const itemToCache = {
                data: data,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(itemToCache));
        } catch (e) {
            console.error("Error writing to localStorage", e);
        }
      }
      setIsLoading(false);
    }, [toast]);

  const onDataMutationSuccess = React.useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error("Failed to invalidate cache", error);
    }
    fetchEquipment();
  }, [fetchEquipment]);

  React.useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Handle URL parameters for quick actions
  React.useEffect(() => {
    const actionParam = searchParams.get('action')
    const highlightParam = searchParams.get('highlight')
    const tabParam = searchParams.get('tab')
    
    if (actionParam === 'add') {
      setIsAddDialogOpen(true)
      // Clear URL params after opening dialog
      router.replace('/equipment', { scroll: false })
    }
    
    // Handle QR Scanner highlights
    if (highlightParam && data.length > 0) {
      const equipmentToHighlight = data.find(eq => eq.id === Number(highlightParam))
      if (equipmentToHighlight) {
        setSelectedEquipment(equipmentToHighlight)
        setIsDetailModalOpen(true)
        
        // Set tab from URL parameter
        if (tabParam && ['details', 'files', 'history', 'usage'].includes(tabParam)) {
          setCurrentTab(tabParam)
        } else {
          setCurrentTab('details')
        }
        
        // Clear URL params after opening modal
        router.replace('/equipment', { scroll: false })
        
        // Auto scroll to equipment in table (with delay for modal to open)
        setTimeout(() => {
          const element = document.querySelector(`[data-equipment-id="${highlightParam}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      }
    }
  }, [searchParams, router, data])

  const fetchAttachments = React.useCallback(async (equipmentId: number) => {
    if (!supabase) return;
    setIsLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from('file_dinh_kem')
        .select('*')
        .eq('thiet_bi_id', equipmentId)
        .order('ngay_tai_len', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi tải file đính kèm",
        description: error.message,
      });
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [toast]);

  const fetchHistory = React.useCallback(async (equipmentId: number) => {
    if (!supabase) return;
    setIsLoadingHistory(true);
    try {
        const { data, error } = await supabase
            .from('lich_su_thiet_bi')
            .select('*')
            .eq('thiet_bi_id', equipmentId)
            .order('ngay_thuc_hien', { ascending: false });

        if (error) throw error;
        setHistory(data as HistoryItem[] || []);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Lỗi tải lịch sử thiết bị",
            description: error.message,
        });
    } finally {
        setIsLoadingHistory(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (isDetailModalOpen && selectedEquipment) {
      fetchAttachments(selectedEquipment.id);
      fetchHistory(selectedEquipment.id);
    }
  }, [isDetailModalOpen, selectedEquipment, fetchAttachments, fetchHistory]);


  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !newFileUrl || !selectedEquipment) return;

    // Basic URL validation
    try {
        new URL(newFileUrl);
    } catch (_) {
        toast({
            variant: "destructive",
            title: "URL không hợp lệ",
            description: "Vui lòng nhập một đường dẫn URL hợp lệ.",
        });
        return;
    }


    setIsSubmittingAttachment(true);
    try {
      if (!supabase) throw new Error("Supabase client is not available");
      const { error } = await supabase.from('file_dinh_kem').insert({
        thiet_bi_id: selectedEquipment.id,
        ten_file: newFileName,
        duong_dan_luu_tru: newFileUrl,
      });
      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã thêm liên kết mới.",
      });
      setNewFileName("");
      setNewFileUrl("");
      fetchAttachments(selectedEquipment.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi thêm liên kết",
        description: error.message,
      });
    } finally {
      setIsSubmittingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedEquipment || deletingAttachmentId) return;

    if (!confirm('Bạn có chắc chắn muốn xóa file đính kèm này không?')) {
        return;
    }
    
    setDeletingAttachmentId(attachmentId);
    try {
        if (!supabase) throw new Error("Supabase client is not available");
        const { error } = await supabase.from('file_dinh_kem').delete().eq('id', attachmentId);
        if (error) throw error;

        toast({
            title: "Đã xóa",
            description: "Đã xóa liên kết thành công.",
        });
        fetchAttachments(selectedEquipment.id);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Lỗi xóa liên kết",
            description: error.message,
        });
    } finally {
        setDeletingAttachmentId(null);
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (value: string) => setSearchTerm(value),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: debouncedSearch,
    },
  })
  
  // Restore table state after data reload
  React.useEffect(() => {
    if (preservePageState && !isLoading && data.length > 0) {
      console.log('🔄 Restoring table state:', preservePageState);
      
      // Add small delay to ensure table is fully rendered
      setTimeout(() => {
        table.setPageIndex(preservePageState.pageIndex);
        table.setPageSize(preservePageState.pageSize);
        console.log('✅ Table state restored to page:', preservePageState.pageIndex + 1);
        setPreservePageState(null); // Clear after restore
      }, 150);
    }
  }, [preservePageState, isLoading, data.length, table]);
  
  // Enhanced onDataMutationSuccess that preserves table state
  const onDataMutationSuccessWithStatePreservation = React.useCallback(() => {
    // Save current table state before reload
    const currentState = table.getState();
    const stateToSave = {
      pageIndex: currentState.pagination.pageIndex,
      pageSize: currentState.pagination.pageSize,
    };
    
    console.log('💾 Saving table state before reload:', stateToSave);
    setPreservePageState(stateToSave);
    
    // Call original function
    onDataMutationSuccess();
  }, [table, onDataMutationSuccess]);
  
  const handleExportData = async () => {
    const rowsToExport = table.getFilteredRowModel().rows;
    if (rowsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: "Không có dữ liệu phù hợp để xuất.",
      });
      return;
    }

    try {
      const dataToExport = rowsToExport.map(row => row.original);

      const dbKeysInOrder = (Object.keys(columnLabels) as Array<keyof Equipment>).filter(key => key !== 'id');
      const headers = dbKeysInOrder.map(key => columnLabels[key]);

      const formattedData = dataToExport.map(item => {
          const rowData: Record<string, any> = {};
          dbKeysInOrder.forEach(key => {
              const header = columnLabels[key];
              let value = item[key];
              rowData[header] = value ?? "";
          });
          return rowData;
      });

      const colWidths = headers.map(header => Math.max(header.length, 20));
      const fileName = `Danh_sach_thiet_bi_${new Date().toISOString().slice(0,10)}.xlsx`;

      await exportToExcel(formattedData, fileName, "Danh sách thiết bị", colWidths);

      toast({
        title: "Xuất dữ liệu thành công",
        description: `Đã tạo file ${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xuất dữ liệu. Vui lòng thử lại.",
      });
    }
  };

  const departments = React.useMemo(() => Array.from(new Set(data.map((item) => item.khoa_phong_quan_ly?.trim()).filter(Boolean))), [data])
  const locations = React.useMemo(() => Array.from(new Set(data.map((item) => item.vi_tri_lap_dat?.trim()).filter(Boolean))), [data])
  const users = React.useMemo(() => Array.from(new Set(data.map((item) => item.nguoi_dang_truc_tiep_quan_ly?.trim()).filter(Boolean))), [data])
  const classifications = React.useMemo(() => Array.from(new Set(data.map((item) => item.phan_loai_theo_nd98?.trim()).filter(Boolean))), [data])
  const statuses = React.useMemo(() => Array.from(new Set(data.map((item) => item.tinh_trang_hien_tai?.trim()).filter(Boolean))), [data])
  
  const isFiltered = table.getState().columnFilters.length > 0;

  const renderContent = () => {
    if (isLoading) {
      return isMobile ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : <Skeleton className="h-5 w-full" />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={columns.length}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (table.getRowModel().rows.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Không có kết quả.
        </div>
      );
    }

    return isMobile ? (
      <div className="space-y-4">
        {table.getRowModel().rows.map((row) => {
          const equipment = row.original;
          return (
            <Card key={equipment.id} data-equipment-id={equipment.id} className="mobile-card-spacing">
              <CardHeader className="flex flex-row items-start justify-between pb-4 mobile-interactive">
                <div className="max-w-[calc(100%-40px)]">
                  <CardTitle className="heading-responsive-h4 font-bold leading-tight truncate">{equipment.ten_thiet_bi}</CardTitle>
                  <CardDescription className="body-responsive-sm">{equipment.ma_thiet_bi}</CardDescription>
                  <div className="mt-2">
                    <ActiveUsageIndicator equipmentId={equipment.id} />
                  </div>
                </div>
                {renderActions(equipment)}
              </CardHeader>
              <CardContent className="body-responsive-sm space-y-3 mobile-interactive">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Trạng thái</span>
                  {equipment.tinh_trang_hien_tai ? (
                    <Badge variant={getStatusVariant(equipment.tinh_trang_hien_tai)}>{equipment.tinh_trang_hien_tai}</Badge>
                  ) : (
                    <span className="italic text-muted-foreground text-xs">Chưa có</span>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Khoa/Phòng</span>
                  <span className="font-medium text-right truncate">
                    {equipment.khoa_phong_quan_ly || <span className="italic text-muted-foreground text-xs">Chưa có</span>}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Người sử dụng</span>
                  <span className="font-medium text-right truncate">
                    {equipment.nguoi_dang_truc_tiep_quan_ly || <span className="italic text-muted-foreground text-xs">Chưa có</span>}
                  </span>
                </div>
                <Separator />
                <div className="pt-2">
                  <MobileUsageActions equipment={equipment} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    ) : (
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted hover:bg-muted">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                data-state={row.getIsSelected() && "selected"}
                data-equipment-id={row.original.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const getHistoryIcon = (eventType: string) => {
    switch (eventType) {
        case 'Sửa chữa':
            return <Wrench className="h-4 w-4 text-muted-foreground" />;
        case 'Bảo trì':
        case 'Bảo trì định kỳ':
        case 'Bảo trì dự phòng':
            return <Settings className="h-4 w-4 text-muted-foreground" />;
        case 'Luân chuyển':
        case 'Luân chuyển nội bộ':
        case 'Luân chuyển bên ngoài':
            return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />;
        case 'Hiệu chuẩn':
        case 'Kiểm định':
            return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
        case 'Thanh lý':
            return <Trash2 className="h-4 w-4 text-muted-foreground" />;
        default:
            return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
       <AddEquipmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={onDataMutationSuccessWithStatePreservation}
      />
      <ImportEquipmentDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={onDataMutationSuccessWithStatePreservation}
      />
      <EditEquipmentDialog
        open={!!editingEquipment}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEquipment(null);
          }
        }}
        onSuccess={() => {
          setEditingEquipment(null);
          onDataMutationSuccessWithStatePreservation();
        }}
        equipment={editingEquipment}
      />
      {selectedEquipment && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chi tiết thiết bị: {selectedEquipment.ten_thiet_bi}</DialogTitle>
                    <DialogDescription>
                        Mã thiết bị: {selectedEquipment.ma_thiet_bi}
                    </DialogDescription>
                </DialogHeader>
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-grow flex flex-col overflow-hidden">
                    <TabsList className="shrink-0">
                        <TabsTrigger value="details">Thông tin chi tiết</TabsTrigger>
                        <TabsTrigger value="files">File đính kèm</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử</TabsTrigger>
                        <TabsTrigger value="usage">Nhật ký sử dụng</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-grow overflow-hidden">
                       <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                                {(Object.keys(columnLabels) as Array<keyof Equipment>).map(key => {
                                    if (key === 'id') return null;

                                    const renderValue = () => {
                                        const value = selectedEquipment[key];
                                        if (key === 'tinh_trang_hien_tai') {
                                            const statusValue = value as Equipment["tinh_trang_hien_tai"];
                                            return statusValue ? <Badge variant={getStatusVariant(statusValue)}>{statusValue}</Badge> : <div className="italic text-muted-foreground">Chưa có dữ liệu</div>;
                                        }
                                        if (key === 'phan_loai_theo_nd98') {
                                            const classification = value as Equipment["phan_loai_theo_nd98"];
                                            return classification ? <Badge variant={getClassificationVariant(classification)}>{classification.trim()}</Badge> : <div className="italic text-muted-foreground">Chưa có dữ liệu</div>;
                                        }
                                        if (key === 'gia_goc') {
                                            return value ? `${Number(value).toLocaleString()} đ` : <div className="italic text-muted-foreground">Chưa có dữ liệu</div>;
                                        }
                                        if (value === null || value === undefined || value === "") {
                                            return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>;
                                        }
                                        return String(value);
                                    };

                                    return (
                                        <div key={key} className="border-b pb-2">
                                            <p className="text-xs font-medium text-muted-foreground">{columnLabels[key]}</p>
                                            <div className="font-semibold break-words">{renderValue()}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="files" className="flex-grow overflow-hidden">
                        <div className="h-full flex flex-col gap-4 py-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thêm file đính kèm mới</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddAttachment} className="space-y-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="file-name">Tên file</Label>
                                            <Input id="file-name" placeholder="VD: Giấy chứng nhận hiệu chuẩn" value={newFileName} onChange={e => setNewFileName(e.target.value)} required disabled={isSubmittingAttachment}/>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="file-url">Đường dẫn (URL)</Label>
                                            <Input id="file-url" type="url" placeholder="https://..." value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)} required disabled={isSubmittingAttachment}/>
                                        </div>
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Làm thế nào để lấy URL?</AlertTitle>
                                            <AlertDescription>
                                                Tải file của bạn lên{" "}
                                                <a href="https://drive.google.com/open?id=1-lgEygGCIfxCbIIdgaCmh3GFJgAMr63e&usp=drive_fs" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                                                    thư mục Drive chung
                                                </a>
                                                , sau đó lấy link chia sẻ công khai và dán vào đây.
                                            </AlertDescription>
                                        </Alert>
                                        <Button type="submit" disabled={isSubmittingAttachment || !newFileName || !newFileUrl}>
                                            {isSubmittingAttachment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Lưu liên kết
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                             <div className="flex-grow overflow-hidden">
                                <p className="font-medium mb-2">Danh sách file đã đính kèm</p>
                                <ScrollArea className="h-full pr-4">
                                    {isLoadingAttachments ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ) : attachments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có file nào được đính kèm.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {attachments.map(file => (
                                                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                                     <Link href={file.duong_dan_luu_tru} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                                                        <LinkIcon className="h-4 w-4 shrink-0"/>
                                                        <span className="truncate">{file.ten_file}</span>
                                                    </Link>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                                                        onClick={() => handleDeleteAttachment(file.id)}
                                                        disabled={!!deletingAttachmentId}
                                                    >
                                                        {deletingAttachmentId === file.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="history" className="flex-grow overflow-hidden">
                       <ScrollArea className="h-full pr-4 py-4">
                            {isLoadingHistory ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <p className="font-semibold">Chưa có lịch sử</p>
                                    <p className="text-sm">Mọi hoạt động sửa chữa, bảo trì sẽ được ghi lại tại đây.</p>
                                </div>
                            ) : (
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                                    {history.map((item) => (
                                        <div key={item.id} className="relative mb-8 last:mb-0">
                                            <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background -translate-x-1/2 ml-3"></div>
                                            <div className="pl-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                                                        {getHistoryIcon(item.loai_su_kien)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{item.loai_su_kien}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(parseISO(item.ngay_thuc_hien), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 ml-10 p-3 rounded-md bg-muted/50 border">
                                                    <p className="text-sm font-medium">{item.mo_ta}</p>

                                                    {/* Repair request details */}
                                                    {item.chi_tiet?.mo_ta_su_co && <p className="text-sm text-muted-foreground mt-1">Sự cố: {item.chi_tiet.mo_ta_su_co}</p>}
                                                    {item.chi_tiet?.hang_muc_sua_chua && <p className="text-sm text-muted-foreground">Hạng mục: {item.chi_tiet.hang_muc_sua_chua}</p>}
                                                    {item.chi_tiet?.nguoi_yeu_cau && <p className="text-sm text-muted-foreground">Người yêu cầu: {item.chi_tiet.nguoi_yeu_cau}</p>}

                                                    {/* Maintenance details */}
                                                    {item.chi_tiet?.ten_ke_hoach && <p className="text-sm text-muted-foreground mt-1">Kế hoạch: {item.chi_tiet.ten_ke_hoach}</p>}
                                                    {item.chi_tiet?.thang && <p className="text-sm text-muted-foreground">Tháng: {item.chi_tiet.thang}/{item.chi_tiet.nam}</p>}

                                                    {/* Transfer details */}
                                                    {item.chi_tiet?.ma_yeu_cau && <p className="text-sm text-muted-foreground mt-1">Mã yêu cầu: {item.chi_tiet.ma_yeu_cau}</p>}
                                                    {item.chi_tiet?.loai_hinh && <p className="text-sm text-muted-foreground">Loại hình: {item.chi_tiet.loai_hinh === 'noi_bo' ? 'Nội bộ' : item.chi_tiet.loai_hinh === 'ben_ngoai' ? 'Bên ngoài' : 'Thanh lý'}</p>}
                                                    {item.chi_tiet?.khoa_phong_hien_tai && item.chi_tiet?.khoa_phong_nhan && (
                                                        <p className="text-sm text-muted-foreground">Từ: {item.chi_tiet.khoa_phong_hien_tai} → {item.chi_tiet.khoa_phong_nhan}</p>
                                                    )}
                                                    {item.chi_tiet?.don_vi_nhan && <p className="text-sm text-muted-foreground">Đơn vị nhận: {item.chi_tiet.don_vi_nhan}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="usage" className="flex-grow overflow-hidden">
                        <div className="h-full py-4">
                            <UsageHistoryTab equipment={selectedEquipment} />
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="shrink-0 pt-4 border-t">
                     <Button variant="secondary" onClick={() => handleGenerateDeviceLabel(selectedEquipment)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Tạo nhãn thiết bị
                    </Button>
                    <Button onClick={() => handleGenerateProfileSheet(selectedEquipment)}>
                        <Printer className="mr-2 h-4 w-4" />
                        In lý lịch
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="heading-responsive-h2">Danh mục thiết bị</CardTitle>
          <CardDescription className="body-responsive-sm">
            Quản lý danh sách các trang thiết bị y tế.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile-optimized filters layout */}
          <div className="space-y-3">
            {/* Search bar - full width on mobile */}
            <div className="w-full">
              <Input
                placeholder="Tìm kiếm chung..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-8 w-full"
              />
            </div>
            
            {/* Responsive filters layout */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Always show main filters */}
              <DataTableFacetedFilter
                column={table.getColumn("tinh_trang_hien_tai")}
                title="Tình trạng"
                options={statuses.map(s => ({label: s!, value: s!}))}
              />
              <DataTableFacetedFilter
                column={table.getColumn("khoa_phong_quan_ly")}
                title="Khoa/Phòng"
                options={departments.map(d => ({label: d, value: d}))}
              />
              
              {/* Desktop: Show all filters inline */}
              {!isMobile && (
                <>
                  <DataTableFacetedFilter
                    column={table.getColumn("nguoi_dang_truc_tiep_quan_ly")}
                    title="Người sử dụng"
                    options={users.map(d => ({label: d, value: d}))}
                  />
                  <DataTableFacetedFilter
                    column={table.getColumn("phan_loai_theo_nd98")}
                    title="Phân loại"
                    options={classifications.map(c => ({label: c, value: c}))}
                  />
                </>
              )}
              
              {/* Mobile: Show additional filters in dropdown */}
              {isMobile && (
                <MobileFiltersDropdown
                  activeFiltersCount={
                    ((table.getColumn("nguoi_dang_truc_tiep_quan_ly")?.getFilterValue() as string[])?.length || 0) +
                    ((table.getColumn("phan_loai_theo_nd98")?.getFilterValue() as string[])?.length || 0)
                  }
                  onClearFilters={() => {
                    table.getColumn("nguoi_dang_truc_tiep_quan_ly")?.setFilterValue([])
                    table.getColumn("phan_loai_theo_nd98")?.setFilterValue([])
                  }}
                >
                  <DataTableFacetedFilter
                    column={table.getColumn("nguoi_dang_truc_tiep_quan_ly")}
                    title="Người sử dụng"
                    options={users.map(d => ({label: d, value: d}))}
                  />
                  <DataTableFacetedFilter
                    column={table.getColumn("phan_loai_theo_nd98")}
                    title="Phân loại"
                    options={classifications.map(c => ({label: c, value: c}))}
                  />
                </MobileFiltersDropdown>
              )}
              
              {/* Clear all filters button */}
              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={() => table.resetColumnFilters()}
                  className="h-8 px-2 lg:px-3"
                >
                  <span className="hidden sm:inline">Xóa tất cả</span>
                  <FilterX className="h-4 w-4 sm:ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Action buttons - responsive layout */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 gap-1 touch-target-sm md:h-8">
                      Cột
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[50vh] overflow-y-auto">
                    <DropdownMenuLabel>Hiện/Ẩn cột</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                            onSelect={(e) => e.preventDefault()}
                          >
                            {columnLabels[column.id as keyof Equipment] || column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button size="sm" variant="outline" className="h-8 gap-1 touch-target-sm md:h-8" onClick={handleDownloadTemplate}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Mẫu
                </span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 gap-1 touch-target-sm md:h-8">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Thêm thiết bị
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsAddDialogOpen(true)}>
                    Thêm thủ công
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsImportDialogOpen(true)}>
                    Nhập từ Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        
          <div className="mt-4">
            {renderContent()}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Records count - responsive position */}
          <div className="order-2 sm:order-1">
            <ResponsivePaginationInfo
              currentCount={table.getFilteredRowModel().rows.length}
              totalCount={data.length}
              currentPage={table.getState().pagination.pageIndex + 1}
              totalPages={table.getPageCount()}
            />
          </div>
          
          {/* Export and pagination controls */}
          <div className="flex flex-col gap-3 items-center order-1 sm:order-2 sm:items-end">
            <button
              onClick={handleExportData}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              disabled={table.getFilteredRowModel().rows.length === 0}
            >
              Tải về file Excel
            </button>
            
            {/* Mobile-optimized pagination */}
            <div className="flex flex-col gap-3 items-center sm:flex-row sm:gap-6">
              {/* Page size selector */}
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Số dòng</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Page info and navigation */}
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <div className="text-sm font-medium hidden sm:block">
                  Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 sm:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 sm:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
