"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { AddEquipmentDialog } from "@/components/add-equipment-dialog"
import { EditEquipmentDialog } from "@/components/edit-equipment-dialog"
import { EquipmentFilterBar } from "@/components/equipment-filter-bar"
import { EquipmentFilterStatus } from "@/components/department-filter-status"
import { ImportEquipmentDialog } from "@/components/import-equipment-dialog"
import { ResponsivePaginationInfo } from "@/components/responsive-pagination-info"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useSearchDebounce } from "@/hooks/use-debounce"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEquipmentRealtimeSync } from "@/hooks/use-realtime-sync"
import { useToast } from "@/hooks/use-toast"
import { exportArrayToExcel, exportToExcel } from "@/lib/excel-utils"
import { type Equipment } from "@/lib/data"
import { supabase, supabaseError } from "@/lib/supabase"

import { createEquipmentColumns } from "./_components/equipment-columns"
import { EquipmentDetailDialog } from "./_components/equipment-detail-dialog"
import { EquipmentTableContent } from "./_components/equipment-table-content"
import { type Attachment, columnLabels, type HistoryItem } from "./_lib/equipment-page-config"
import { generateEquipmentDeviceLabel, generateEquipmentProfileSheet } from "./_lib/equipment-print"

const CACHE_KEY = "equipment_data"

export default function EquipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  useEquipmentRealtimeSync()

  const [data, setData] = React.useState<Equipment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const hasAppliedInitialFilter = React.useRef(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useSearchDebounce(searchTerm)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null)
  const [currentTab, setCurrentTab] = React.useState<string>("details")
  const isMobile = useIsMobile()

  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = React.useState(false)
  const [newFileName, setNewFileName] = React.useState("")
  const [newFileUrl, setNewFileUrl] = React.useState("")
  const [isSubmittingAttachment, setIsSubmittingAttachment] = React.useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = React.useState<string | null>(null)

  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)

  const [preservePageState, setPreservePageState] = React.useState<{
    pageIndex: number
    pageSize: number
  } | null>(null)

  const isMediumScreen = useMediaQuery("(min-width: 768px) and (max-width: 1800px)")

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    ma_thiet_bi: true,
    ten_thiet_bi: true,
    model: true,
    serial: true,
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
    vi_tri_lap_dat: true,
    nguoi_dang_truc_tiep_quan_ly: true,
    khoa_phong_quan_ly: true,
    tinh_trang_hien_tai: true,
    ghi_chu: false,
    chu_ky_bt_dinh_ky: false,
    ngay_bt_tiep_theo: false,
    chu_ky_hc_dinh_ky: false,
    ngay_hc_tiep_theo: false,
    chu_ky_kd_dinh_ky: false,
    ngay_kd_tiep_theo: false,
    phan_loai_theo_nd98: true,
  })

  React.useEffect(() => {
    if (isMediumScreen) {
      setColumnVisibility((prev) => ({
        ...prev,
        model: false,
        serial: false,
        phan_loai_theo_nd98: false,
      }))
      return
    }

    setColumnVisibility((prev) => ({
      ...prev,
      model: true,
      serial: true,
      phan_loai_theo_nd98: true,
    }))
  }, [isMediumScreen])

  const handleDownloadTemplate = React.useCallback(async () => {
    try {
      const templateHeaders = Object.entries(columnLabels)
        .filter(([key]) => key !== "id")
        .map(([, label]) => label)

      const colWidths = templateHeaders.map((header) => Math.max(header.length, 25))

      await exportArrayToExcel(
        [templateHeaders],
        "Mau_Nhap_Thiet_Bi.xlsx",
        "Template Thiết Bị",
        colWidths,
      )
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải template. Vui lòng thử lại.",
      })
    }
  }, [toast])

  const handleShowDetails = React.useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setIsDetailModalOpen(true)
  }, [])

  const canEditEquipment = React.useCallback((equipment: Equipment) => {
    return Boolean(
      user && (
        user.role === "admin" ||
        user.role === "to_qltb" ||
        (user.role === "qltb_khoa" && user.khoa_phong === equipment.khoa_phong_quan_ly)
      ),
    )
  }, [user])

  const columns = React.useMemo(() => createEquipmentColumns({
    onShowDetails: handleShowDetails,
    onEdit: setEditingEquipment,
    onCreateRepairRequest: (equipment) => {
      router.push(`/repair-requests?equipmentId=${equipment.id}`)
    },
    canEditEquipment,
  }), [canEditEquipment, handleShowDetails, router])

  const fetchEquipment = React.useCallback(async () => {
    setIsLoading(true)

    const cacheKey = user?.khoa_phong && !["admin", "to_qltb"].includes(user.role)
      ? `${CACHE_KEY}_${user.khoa_phong}`
      : CACHE_KEY

    try {
      const cachedItemJSON = localStorage.getItem(cacheKey)
      if (cachedItemJSON) {
        const cachedItem = JSON.parse(cachedItemJSON)
        setData(cachedItem.data as Equipment[])
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error reading from localStorage, fetching from network.", error)
      localStorage.removeItem(cacheKey)
    }

    if (supabaseError) {
      toast({
        variant: "destructive",
        title: "Lỗi cấu hình Supabase",
        description: supabaseError,
        duration: 10000,
      })
      setData([])
      setIsLoading(false)
      return
    }

    if (!supabase) {
      setIsLoading(false)
      return
    }

    let query = supabase.from("thiet_bi").select("*")

    const shouldFilterByDepartment = user &&
      !["admin", "to_qltb"].includes(user.role) &&
      user.khoa_phong

    if (shouldFilterByDepartment) {
      query = query.eq("khoa_phong_quan_ly", user.khoa_phong)
    }

    const { data: nextData, error } = await query.order("id", { ascending: true })

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể tải dữ liệu thiết bị. ${error.message}`,
      })

      if (!localStorage.getItem(cacheKey)) {
        setData([])
      }
      setIsLoading(false)
      return
    }

    setData(nextData as Equipment[])

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data: nextData }))
    } catch (error) {
      console.error("Error writing to localStorage", error)
    }

    setIsLoading(false)
  }, [toast, user])

  const onDataMutationSuccess = React.useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY)
      if (user?.khoa_phong) {
        localStorage.removeItem(`${CACHE_KEY}_${user.khoa_phong}`)
      }
    } catch (error) {
      console.error("Failed to invalidate cache", error)
    }

    fetchEquipment()
  }, [fetchEquipment, user?.khoa_phong])

  React.useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  React.useEffect(() => {
    if (data.length > 0 && user?.full_name && !hasAppliedInitialFilter.current) {
      const isPrivileged = ["admin", "to_qltb"].includes(user.role);
      
      if (!isPrivileged) {
        const normalizeName = (name: string | null | undefined) => {
          if (!name) return "";
          return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };

        const normalizedUserName = normalizeName(user.full_name);
        
        // Find exact string values in the dataset that match the user
        const matchingDBValues = Array.from(new Set(
          data
            .map(eq => eq.nguoi_dang_truc_tiep_quan_ly?.trim())
            .filter((val): val is string => Boolean(val) && normalizeName(val) === normalizedUserName)
        ));

        if (matchingDBValues.length > 0) {
          setColumnFilters(prev => {
            if (prev.some(f => f.id === "nguoi_dang_truc_tiep_quan_ly")) {
              return prev;
            }
            return [
              ...prev,
              { id: "nguoi_dang_truc_tiep_quan_ly", value: matchingDBValues }
            ];
          });
        }
      }
      hasAppliedInitialFilter.current = true;
    }
  }, [data, user])

  React.useEffect(() => {
    const handleCacheInvalidation = () => {
      fetchEquipment()
    }

    window.addEventListener("equipment-cache-invalidated", handleCacheInvalidation)
    return () => {
      window.removeEventListener("equipment-cache-invalidated", handleCacheInvalidation)
    }
  }, [fetchEquipment])

  React.useEffect(() => {
    const actionParam = searchParams.get("action")
    const highlightParam = searchParams.get("highlight")
    const tabParam = searchParams.get("tab")

    if (actionParam === "add") {
      setIsAddDialogOpen(true)
      router.replace("/equipment", { scroll: false })
    }

    if (!highlightParam || data.length === 0) return

    const equipmentToHighlight = data.find((equipment) => equipment.id === Number(highlightParam))
    if (!equipmentToHighlight) return

    setSelectedEquipment(equipmentToHighlight)
    setIsDetailModalOpen(true)

    if (tabParam && ["details", "files", "history", "usage"].includes(tabParam)) {
      setCurrentTab(tabParam)
    } else {
      setCurrentTab("details")
    }

    router.replace("/equipment", { scroll: false })

    setTimeout(() => {
      const element = document.querySelector(`[data-equipment-id="${highlightParam}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 300)
  }, [searchParams, router, data])

  const fetchAttachments = React.useCallback(async (equipmentId: number) => {
    if (!supabase) return
    setIsLoadingAttachments(true)

    try {
      const { data: nextAttachments, error } = await supabase
        .from("file_dinh_kem")
        .select("*")
        .eq("thiet_bi_id", equipmentId)
        .order("ngay_tai_len", { ascending: false })

      if (error) throw error
      setAttachments(nextAttachments || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể tải file đính kèm."
      toast({
        variant: "destructive",
        title: "Lỗi tải file đính kèm",
        description: message,
      })
    } finally {
      setIsLoadingAttachments(false)
    }
  }, [toast])

  const fetchHistory = React.useCallback(async (equipmentId: number) => {
    if (!supabase) return
    setIsLoadingHistory(true)

    try {
      const { data: nextHistory, error } = await supabase
        .from("lich_su_thiet_bi")
        .select("*")
        .eq("thiet_bi_id", equipmentId)
        .order("ngay_thuc_hien", { ascending: false })

      if (error) throw error
      setHistory((nextHistory as HistoryItem[]) || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể tải lịch sử thiết bị."
      toast({
        variant: "destructive",
        title: "Lỗi tải lịch sử thiết bị",
        description: message,
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (!isDetailModalOpen || !selectedEquipment) return
    fetchAttachments(selectedEquipment.id)
    fetchHistory(selectedEquipment.id)
  }, [fetchAttachments, fetchHistory, isDetailModalOpen, selectedEquipment])

  const handleAddAttachment = React.useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newFileName || !newFileUrl || !selectedEquipment) return

    try {
      new URL(newFileUrl)
    } catch {
      toast({
        variant: "destructive",
        title: "URL không hợp lệ",
        description: "Vui lòng nhập một đường dẫn URL hợp lệ.",
      })
      return
    }

    setIsSubmittingAttachment(true)

    try {
      if (!supabase) throw new Error("Supabase client is not available")

      const { error } = await supabase.from("file_dinh_kem").insert({
        thiet_bi_id: selectedEquipment.id,
        ten_file: newFileName,
        duong_dan_luu_tru: newFileUrl,
      })

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Đã thêm liên kết mới.",
      })
      setNewFileName("")
      setNewFileUrl("")
      fetchAttachments(selectedEquipment.id)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể thêm liên kết."
      toast({
        variant: "destructive",
        title: "Lỗi thêm liên kết",
        description: message,
      })
    } finally {
      setIsSubmittingAttachment(false)
    }
  }, [fetchAttachments, newFileName, newFileUrl, selectedEquipment, toast])

  const handleDeleteAttachment = React.useCallback(async (attachmentId: string) => {
    if (!selectedEquipment || deletingAttachmentId) return

    if (!confirm("Bạn có chắc chắn muốn xóa file đính kèm này không?")) {
      return
    }

    setDeletingAttachmentId(attachmentId)

    try {
      if (!supabase) throw new Error("Supabase client is not available")

      const { error } = await supabase
        .from("file_dinh_kem")
        .delete()
        .eq("id", attachmentId)

      if (error) throw error

      toast({
        title: "Đã xóa",
        description: "Đã xóa liên kết thành công.",
      })
      fetchAttachments(selectedEquipment.id)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể xóa liên kết."
      toast({
        variant: "destructive",
        title: "Lỗi xóa liên kết",
        description: message,
      })
    } finally {
      setDeletingAttachmentId(null)
    }
  }, [deletingAttachmentId, fetchAttachments, selectedEquipment, toast])

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

  React.useEffect(() => {
    if (!preservePageState || isLoading || data.length === 0) return

    setTimeout(() => {
      table.setPageIndex(preservePageState.pageIndex)
      table.setPageSize(preservePageState.pageSize)
      setPreservePageState(null)
    }, 150)
  }, [data.length, isLoading, preservePageState, table])

  const onDataMutationSuccessWithStatePreservation = React.useCallback(() => {
    const currentState = table.getState()
    setPreservePageState({
      pageIndex: currentState.pagination.pageIndex,
      pageSize: currentState.pagination.pageSize,
    })
    onDataMutationSuccess()
  }, [onDataMutationSuccess, table])

  const handleExportData = React.useCallback(async () => {
    const rowsToExport = table.getFilteredRowModel().rows
    if (rowsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: "Không có dữ liệu phù hợp để xuất.",
      })
      return
    }

    try {
      const dataToExport = rowsToExport.map((row) => row.original)
      const dbKeysInOrder = (Object.keys(columnLabels) as Array<keyof Equipment>).filter((key) => key !== "id")
      const headers = dbKeysInOrder.map((key) => columnLabels[key])

      const formattedData = dataToExport.map((item) => {
        const rowData: Record<string, unknown> = {}
        dbKeysInOrder.forEach((key) => {
          rowData[columnLabels[key]] = item[key] ?? ""
        })
        return rowData
      })

      const colWidths = headers.map((header) => Math.max(header.length, 20))
      const fileName = `Danh_sach_thiet_bi_${new Date().toISOString().slice(0, 10)}.xlsx`

      await exportToExcel(formattedData, fileName, "Danh sách thiết bị", colWidths)

      toast({
        title: "Xuất dữ liệu thành công",
        description: `Đã tạo file ${fileName}`,
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xuất dữ liệu. Vui lòng thử lại.",
      })
    }
  }, [table, toast])

  const departments = React.useMemo(
    () => Array.from(new Set(data.map((item) => item.khoa_phong_quan_ly?.trim()).filter(Boolean))),
    [data],
  )
  const locations = React.useMemo(
    () => Array.from(new Set(data.map((item) => item.vi_tri_lap_dat?.trim()).filter(Boolean))),
    [data],
  )
  const users = React.useMemo(
    () => Array.from(new Set(data.map((item) => item.nguoi_dang_truc_tiep_quan_ly?.trim()).filter(Boolean))),
    [data],
  )
  const classifications = React.useMemo(
    () => Array.from(new Set(data.map((item) => item.phan_loai_theo_nd98?.trim()).filter(Boolean))),
    [data],
  )
  const statuses = React.useMemo(
    () => Array.from(new Set(data.map((item) => item.tinh_trang_hien_tai?.trim()).filter(Boolean))),
    [data],
  )

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
            setEditingEquipment(null)
          }
        }}
        onSuccess={() => {
          setEditingEquipment(null)
          onDataMutationSuccessWithStatePreservation()
        }}
        equipment={editingEquipment}
      />
      <EquipmentDetailDialog
        equipment={selectedEquipment}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        attachments={attachments}
        history={history}
        isLoadingAttachments={isLoadingAttachments}
        isLoadingHistory={isLoadingHistory}
        newFileName={newFileName}
        newFileUrl={newFileUrl}
        isSubmittingAttachment={isSubmittingAttachment}
        deletingAttachmentId={deletingAttachmentId}
        onNewFileNameChange={setNewFileName}
        onNewFileUrlChange={setNewFileUrl}
        onAddAttachment={handleAddAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onGenerateDeviceLabel={generateEquipmentDeviceLabel}
        onGenerateProfileSheet={generateEquipmentProfileSheet}
      />
      <Card>
        <CardHeader>
          <CardTitle className="heading-responsive-h2">Danh mục thiết bị, máy móc chuyên môn</CardTitle>
          <CardDescription className="body-responsive-sm">
            Quản lý danh sách các thiết bị y tế, máy móc chuyên môn của CDC.
          </CardDescription>
          <EquipmentFilterStatus
            itemCount={table.getFilteredRowModel().rows.length}
            className="mt-3"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
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

          <EquipmentFilterBar
            table={table}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isMobile={isMobile}
            onDownloadTemplate={handleDownloadTemplate}
            onAddDialogOpen={() => setIsAddDialogOpen(true)}
            onImportDialogOpen={() => setIsImportDialogOpen(true)}
            filterData={{
              departments: departments as string[],
              locations: locations as string[],
              users: users as string[],
              classifications: classifications as string[],
              statuses: statuses as string[],
            }}
          />

          <div className="mt-4">
            <EquipmentTableContent
              table={table}
              isLoading={isLoading}
              isMobile={isMobile}
              columnsLength={columns.length}
              onShowDetails={handleShowDetails}
              onEdit={setEditingEquipment}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <ResponsivePaginationInfo
              currentCount={table.getFilteredRowModel().rows.length}
              totalCount={data.length}
              currentPage={table.getState().pagination.pageIndex + 1}
              totalPages={table.getPageCount()}
            />
          </div>

          <div className="flex flex-col gap-3 items-center order-1 sm:order-2 sm:items-end">
            <button
              onClick={handleExportData}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              disabled={table.getFilteredRowModel().rows.length === 0}
            >
              Tải về file Excel
            </button>

            <div className="flex flex-col gap-3 items-center sm:flex-row sm:gap-6">
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
