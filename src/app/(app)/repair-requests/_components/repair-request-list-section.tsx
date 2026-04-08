"use client"

import type { Table as ReactTable } from "@tanstack/react-table"
import { FilterX, History, Loader2 } from "lucide-react"

import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { DataTablePagination } from "@/components/data-table-pagination"
import { MobileFiltersDropdown } from "@/components/mobile-filters-dropdown"
import { RepairRequestFilterStatus } from "@/components/department-filter-status"
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
import { Input } from "@/components/ui/input"
import type { User } from "@/types/database"

import type { RepairRequestRowActions } from "../_hooks/types"
import { requestStatuses } from "../constants"
import type { RepairRequestWithEquipment } from "../types"
import { RepairRequestDesktopTable } from "./repair-request-desktop-table"
import { RepairRequestMobileList } from "./repair-request-mobile-list"

interface RepairRequestListSectionProps {
  table: ReactTable<RepairRequestWithEquipment>
  requests: RepairRequestWithEquipment[]
  isLoading: boolean
  isMobile: boolean
  user: User | null | undefined
  actions: RepairRequestRowActions
  searchTerm: string
  onSearchTermChange: (value: string) => void
  isFiltered: boolean
  columnsCount: number
  onOpenRequest: (request: RepairRequestWithEquipment) => void
}

export function RepairRequestListSection({
  table,
  requests,
  isLoading,
  isMobile,
  user,
  actions,
  searchTerm,
  onSearchTermChange,
  isFiltered,
  columnsCount,
  onOpenRequest,
}: RepairRequestListSectionProps) {
  return (
    <div className="w-full">
      <Card className="overflow-hidden border-border/40 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-b from-muted/50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-primary/70" />
            Danh sách trạng thái
            <Badge variant="secondary" className="ml-2 py-0.5">
              {requests.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Bạn có thể lọc, tìm kiếm và phân loại các yêu cầu tại đây.
          </CardDescription>
          <RepairRequestFilterStatus itemCount={requests.length} className="mt-3" />
        </CardHeader>

        <CardContent className="gap-3 p-3 md:gap-4 md:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-4">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="Tìm thiết bị, mô tả..."
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className="h-8 w-[120px] touch-target-sm md:h-8 md:w-[200px] lg:w-[250px]"
              />

              {!isMobile && (
                <DataTableFacetedFilter
                  column={table.getColumn("trang_thai")}
                  title="Trạng thái"
                  options={requestStatuses.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  triggerClassName="touch-target-sm md:h-8"
                />
              )}

              {isMobile && (
                <MobileFiltersDropdown
                  activeFiltersCount={
                    ((table.getColumn("trang_thai")?.getFilterValue() as string[])?.length ||
                      0)
                  }
                  onClearFilters={() =>
                    table.getColumn("trang_thai")?.setFilterValue([])
                  }
                >
                  <DataTableFacetedFilter
                    column={table.getColumn("trang_thai")}
                    title="Trạng thái"
                    options={requestStatuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    triggerClassName="touch-target-sm md:h-8"
                  />
                </MobileFiltersDropdown>
              )}

              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    table.resetColumnFilters()
                    onSearchTermChange("")
                  }}
                  className="h-8 px-2 touch-target-sm md:h-8 lg:px-3"
                >
                  <span className="hidden sm:inline">Xóa</span>
                  <FilterX className="h-4 w-4 sm:ml-2" />
                </Button>
              )}
            </div>
          </div>

          {isMobile ? (
            isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Đang tải...</span>
              </div>
            ) : table.getRowModel().rows.length ? (
              <RepairRequestMobileList
                requests={table.getRowModel().rows.map((row) => row.original)}
                user={user}
                actions={actions}
                onOpenRequest={onOpenRequest}
              />
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không có kết quả.
              </div>
            )
          ) : (
            <RepairRequestDesktopTable
              table={table}
              columnsCount={columnsCount}
              isLoading={isLoading}
              onOpenRequest={onOpenRequest}
            />
          )}
        </CardContent>

        <CardFooter>
          <DataTablePagination
            table={table}
            summary={
              <>
                {table.getFilteredRowModel().rows.length} trên {requests.length} yêu
                cầu.
              </>
            }
            selectTriggerClassName="touch-target-sm md:h-8"
            buttonClassName="touch-target-sm md:h-8 md:w-8"
            firstLastButtonClassName="touch-target-sm md:h-8 md:w-8"
            labels={{
              first: "Go to first page",
              previous: "Go to previous page",
              next: "Go to next page",
              last: "Go to last page",
            }}
          />
        </CardFooter>
      </Card>
    </div>
  )
}
