"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Equipment } from "@/lib/data"

import {
  columnLabels,
  filterableColumns,
  getClassificationVariant,
  getStatusVariant,
} from "../_lib/equipment-page-config"

type CreateEquipmentColumnsOptions = {
  onEdit: (equipment: Equipment) => void
  onCreateRepairRequest: (equipment: Equipment) => void
  canEditEquipment: (equipment: Equipment) => boolean
}

function scheduleDropdownAction(action: () => void) {
  window.setTimeout(action, 0)
}

export const createEquipmentColumns = ({
  onEdit,
  onCreateRepairRequest,
  canEditEquipment,
}: CreateEquipmentColumnsOptions): ColumnDef<Equipment>[] => [
  ...(Object.keys(columnLabels) as Array<keyof Equipment>).map((key) => {
    const columnDef: ColumnDef<Equipment> = {
      accessorKey: key,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {columnLabels[key]}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue(key)

        if (key === "tinh_trang_hien_tai") {
          const statusValue = value as Equipment["tinh_trang_hien_tai"]
          if (!statusValue) {
            return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
          }

          return <Badge variant={getStatusVariant(statusValue)}>{statusValue}</Badge>
        }

        if (key === "phan_loai_theo_nd98") {
          const classification = value as Equipment["phan_loai_theo_nd98"]
          if (!classification) {
            return <div className="italic text-muted-foreground">Chưa có dữ liệu</div>
          }

          return <Badge variant={getClassificationVariant(classification)}>{classification.trim()}</Badge>
        }

        if (key === "gia_goc") {
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
        const rowValue = row.getValue(id) as string
        if (!rowValue) return false
        return value.includes(rowValue.trim())
      }
    }

    return columnDef
  }),
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const equipment = row.original

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            {canEditEquipment(equipment) && (
              <DropdownMenuItem onSelect={() => scheduleDropdownAction(() => onEdit(equipment))}>
                Sửa thông tin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => scheduleDropdownAction(() => onCreateRepairRequest(equipment))}>
              Tạo yêu cầu sửa chữa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
