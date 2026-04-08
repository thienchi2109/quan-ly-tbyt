"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table"
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSearchDebounce } from "@/hooks/use-debounce"
import type { User } from "@/types/database"

import { RepairDeadlineProgress } from "../_components/repair-deadline-progress"
import { RepairRequestActionsMenu } from "../_components/repair-request-actions-menu"
import { canManageRepairRequests } from "../_lib/repair-request-permissions"
import { getRepairRequestStatusVariant } from "../constants"
import type { RepairRequestWithEquipment } from "../types"
import type { RepairRequestRowActions } from "./types"

interface UseRepairRequestTableParams {
  requests: RepairRequestWithEquipment[]
  user: User | null | undefined
  actions: RepairRequestRowActions
}

export function useRepairRequestTable({
  requests,
  user,
  actions,
}: UseRepairRequestTableParams) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ngay_yeu_cau", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useSearchDebounce(searchTerm)
  const canManage = canManageRepairRequests(user)

  const columns = React.useMemo<ColumnDef<RepairRequestWithEquipment>[]>(
    () => [
      {
        accessorFn: (row) => `${row.thiet_bi?.ten_thiet_bi} ${row.mo_ta_su_co}`,
        id: "thiet_bi_va_mo_ta",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Thiết bị
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const request = row.original
          return (
            <div>
              <div className="font-medium">
                {request.thiet_bi?.ten_thiet_bi || "N/A"}
              </div>
              <div className="max-w-xs truncate text-sm text-muted-foreground">
                {request.mo_ta_su_co}
              </div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.thiet_bi?.ten_thiet_bi || ""
          const nameB = rowB.original.thiet_bi?.ten_thiet_bi || ""
          return nameA.localeCompare(nameB)
        },
      },
      {
        accessorKey: "nguoi_yeu_cau",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Người yêu cầu
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const requester = row.getValue("nguoi_yeu_cau") as string | null
          return (
            <div className="text-sm">
              {requester || (
                <span className="italic text-muted-foreground">N/A</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "ngay_yeu_cau",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Ngày yêu cầu
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {format(parseISO(row.getValue("ngay_yeu_cau")), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })}
          </div>
        ),
      },
      {
        accessorKey: "ngay_mong_muon_hoan_thanh",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Ngày mong muốn HT
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const desiredDate = row.getValue(
            "ngay_mong_muon_hoan_thanh",
          ) as string | null
          if (!desiredDate) {
            return (
              <div className="text-sm">
                <span className="italic text-muted-foreground">Không có</span>
              </div>
            )
          }

          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {format(parseISO(desiredDate), "dd/MM/yyyy", { locale: vi })}
              </div>
              <RepairDeadlineProgress
                desiredDate={desiredDate}
                requestStatus={row.original.trang_thai}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "trang_thai",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Trạng thái
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const request = row.original
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant={getRepairRequestStatusVariant(request.trang_thai)}
                className="self-start"
              >
                {request.trang_thai}
              </Badge>
              {request.trang_thai === "Đã duyệt" && request.ngay_duyet && (
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(request.ngay_duyet), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })}
                  {request.nguoi_duyet && (
                    <div className="font-medium text-blue-600">
                      Duyệt bởi: {request.nguoi_duyet}
                    </div>
                  )}
                </div>
              )}
              {(request.trang_thai === "Hoàn thành" ||
                request.trang_thai === "Không HT") &&
                request.ngay_hoan_thanh && (
                  <div className="text-xs text-muted-foreground">
                    {format(
                      parseISO(request.ngay_hoan_thanh),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )}
                    {request.nguoi_xac_nhan && (
                      <div className="font-medium text-green-600">
                        Xác nhận bởi: {request.nguoi_xac_nhan}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <RepairRequestActionsMenu
              request={row.original}
              visible={!!user}
              canManage={canManage}
              onGenerateRequestSheet={actions.onGenerateRequestSheet}
              onEdit={actions.onEdit}
              onDelete={actions.onDelete}
              onApprove={actions.onApprove}
              onCompletion={actions.onCompletion}
            />
          </div>
        ),
      },
    ],
    [actions, canManage, user],
  )

  const table = useReactTable({
    data: requests,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedSearch,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (value: string) => setSearchTerm(value),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return {
    table,
    searchTerm,
    setSearchTerm,
    isFiltered:
      table.getState().columnFilters.length > 0 || debouncedSearch.length > 0,
    columnsCount: columns.length,
  }
}
