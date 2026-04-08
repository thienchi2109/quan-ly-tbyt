"use client"

import type { ReactNode } from "react"
import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  summary: ReactNode
  pageSizeOptions?: number[]
  className?: string
  summaryClassName?: string
  pageSizeLabel?: ReactNode
  pageSizeLabelClassName?: string
  selectTriggerClassName?: string
  pageIndicatorClassName?: string
  buttonClassName?: string
  firstLastButtonClassName?: string
  labels?: {
    first?: string
    previous?: string
    next?: string
    last?: string
  }
}

export function DataTablePagination<TData>({
  table,
  summary,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  summaryClassName,
  pageSizeLabel = "Số dòng",
  pageSizeLabelClassName,
  selectTriggerClassName,
  pageIndicatorClassName,
  buttonClassName,
  firstLastButtonClassName,
  labels,
}: DataTablePaginationProps<TData>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full gap-4",
        className,
      )}
    >
      <div className={cn("flex-1 text-sm text-muted-foreground", summaryClassName)}>
        {summary}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className={cn("text-sm font-medium", pageSizeLabelClassName)}>
            {pageSizeLabel}
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className={cn("h-8 w-[70px]", selectTriggerClassName)}>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          className={cn(
            "flex w-[100px] items-center justify-center text-sm font-medium",
            pageIndicatorClassName,
          )}
        >
          Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className={cn("hidden h-8 w-8 p-0 lg:flex", firstLastButtonClassName)}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{labels?.first ?? "Về trang đầu"}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0", buttonClassName)}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{labels?.previous ?? "Trang trước"}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0", buttonClassName)}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{labels?.next ?? "Trang sau"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={cn("hidden h-8 w-8 p-0 lg:flex", firstLastButtonClassName)}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{labels?.last ?? "Đến trang cuối"}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
