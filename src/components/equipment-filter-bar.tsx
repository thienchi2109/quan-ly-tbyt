"use client"

import * as React from "react"
import type { Column, Table } from "@tanstack/react-table"
import {
  Search,
  X,
  Check,
  ChevronDown,
  File,
  PlusCircle,
  Filter,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { type Equipment } from "@/lib/data"
import { MobileFiltersDropdown } from "@/components/mobile-filters-dropdown"

// ---------------------------------------------------------------------------
// Multi-select Filter (Popover + Checkbox - NO cmdk)
// ---------------------------------------------------------------------------
interface FacetedFilterSelectProps<TData, TValue> {
  column?: Column<TData, TValue>
  title: string
  options: { label: string; value: string }[]
}

function FacetedFilterSelect<TData, TValue>({
  column,
  title,
  options,
}: FacetedFilterSelectProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const toggleOption = (value: string) => {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    const arr = Array.from(next)
    column?.setFilterValue(arr.length ? arr : undefined)
  }

  const clearAll = () => {
    column?.setFilterValue(undefined)
  }

  // Build trigger label
  const triggerLabel = React.useMemo(() => {
    if (selectedValues.size === 0) return `Chọn ${title.toLowerCase()}`
    if (selectedValues.size === 1) {
      const val = Array.from(selectedValues)[0]
      const opt = options.find((o) => o.value === val)
      return opt?.label ?? val
    }
    return `${selectedValues.size} đã chọn`
  }, [selectedValues, title, options])

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground ml-0.5 block">
        {title}
      </label>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch("") }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-9 text-left font-normal",
              "bg-muted/40 border-border/50 hover:bg-muted/60",
              selectedValues.size > 0 && "border-primary/30 bg-primary/5"
            )}
          >
            <span className="truncate flex-1 text-sm">{triggerLabel}</span>
            <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-[280px] p-0"
          align="start"
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={`Tìm ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-[280px] p-1">
              {filteredOptions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy.
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.has(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/50"
                      )}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="whitespace-normal break-words leading-snug text-left">
                        {option.label}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

          {/* Clear button */}
          {selectedValues.size > 0 && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={clearAll}
                className="w-full rounded-sm px-2 py-1.5 text-sm text-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column Labels (for column visibility dropdown)
// ---------------------------------------------------------------------------
const columnLabels: Record<keyof Equipment, string> = {
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

// ---------------------------------------------------------------------------
// Main Component  
// ---------------------------------------------------------------------------
interface EquipmentFilterBarProps {
  table: Table<Equipment>
  searchTerm: string
  onSearchChange: (value: string) => void
  isMobile: boolean
  onDownloadTemplate: () => void
  onAddDialogOpen: () => void
  onImportDialogOpen: () => void
  filterData: {
    departments: string[]
    locations: string[]
    users: string[]
    classifications: string[]
    statuses: string[]
  }
}

export function EquipmentFilterBar({
  table,
  searchTerm,
  onSearchChange,
  isMobile,
  onDownloadTemplate,
  onAddDialogOpen,
  onImportDialogOpen,
  filterData,
}: EquipmentFilterBarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Collect active filter chips
  const activeFilters = React.useMemo(() => {
    const chips: { column: string; label: string; value: string; filterKey: string }[] = []

    const filterMap: Record<string, string> = {
      tinh_trang_hien_tai: "Tình trạng",
      khoa_phong_quan_ly: "Khoa/Phòng",
      nguoi_dang_truc_tiep_quan_ly: "Người SD",
      phan_loai_theo_nd98: "Phân loại",
    }

    for (const [columnId, label] of Object.entries(filterMap)) {
      const filterValue = table.getColumn(columnId)?.getFilterValue() as string[] | undefined
      if (filterValue?.length) {
        filterValue.forEach((val) => {
          chips.push({
            column: columnId,
            label,
            value: val,
            filterKey: `${columnId}-${val}`,
          })
        })
      }
    }
    return chips
  }, [table.getState().columnFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeFilter = (columnId: string, value: string) => {
    const col = table.getColumn(columnId)
    const current = (col?.getFilterValue() as string[] | undefined) ?? []
    const next = current.filter((v) => v !== value)
    col?.setFilterValue(next.length ? next : undefined)
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, mã thiết bị, serial..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 bg-muted/30 border-border/50 focus-visible:bg-background"
        />
      </div>

      {/* Filter Dropdowns - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <FacetedFilterSelect
          column={table.getColumn("tinh_trang_hien_tai")}
          title="Tình trạng"
          options={filterData.statuses.map((s) => ({ label: s, value: s }))}
        />
        <FacetedFilterSelect
          column={table.getColumn("khoa_phong_quan_ly")}
          title="Khoa/Phòng"
          options={filterData.departments.map((d) => ({ label: d, value: d }))}
        />
        {!isMobile && (
          <>
            <FacetedFilterSelect
              column={table.getColumn("nguoi_dang_truc_tiep_quan_ly")}
              title="Người sử dụng"
              options={filterData.users.map((u) => ({ label: u, value: u }))}
            />
            <FacetedFilterSelect
              column={table.getColumn("phan_loai_theo_nd98")}
              title="Phân loại"
              options={filterData.classifications.map((c) => ({ label: c, value: c }))}
            />
          </>
        )}
      </div>

      {/* Mobile: extra filters dropdown */}
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
          <FacetedFilterSelect
            column={table.getColumn("nguoi_dang_truc_tiep_quan_ly")}
            title="Người sử dụng"
            options={filterData.users.map((u) => ({ label: u, value: u }))}
          />
          <FacetedFilterSelect
            column={table.getColumn("phan_loai_theo_nd98")}
            title="Phân loại"
            options={filterData.classifications.map((c) => ({ label: c, value: c }))}
          />
        </MobileFiltersDropdown>
      )}

      {/* Active Filter Chips + Utility Buttons */}
      {(isFiltered || !isMobile) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((chip) => (
              <Badge
                key={chip.filterKey}
                variant="secondary"
                className="gap-1 pr-1 font-normal text-xs max-w-[280px]"
              >
                <span className="font-medium">{chip.label}:</span>
                <span className="truncate">{chip.value}</span>
                <button
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  onClick={() => removeFilter(chip.column, chip.value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Xóa</span>
                </button>
              </Badge>
            ))}
            {isFiltered && (
              <button
                onClick={() => table.resetColumnFilters()}
                className="text-xs font-semibold text-primary hover:underline underline-offset-2 ml-1"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Filter className="h-3.5 w-3.5" />
                    Hiện/ẩn cột
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[50vh] overflow-y-auto">
                  <DropdownMenuLabel>Hiện/Ẩn cột</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {columnLabels[column.id as keyof Equipment] || column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={onDownloadTemplate}
            >
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Excel mẫu</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
