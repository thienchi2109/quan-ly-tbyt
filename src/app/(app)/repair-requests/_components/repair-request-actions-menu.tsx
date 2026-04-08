"use client"

import { Edit, MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { RepairRequestWithEquipment } from "../types"

interface RepairRequestActionsMenuProps {
  request: RepairRequestWithEquipment
  visible: boolean
  canManage: boolean
  onGenerateRequestSheet: (request: RepairRequestWithEquipment) => void
  onEdit: (request: RepairRequestWithEquipment) => void
  onDelete: (request: RepairRequestWithEquipment) => void
  onApprove: (request: RepairRequestWithEquipment) => void
  onCompletion: (
    request: RepairRequestWithEquipment,
    newStatus: "Hoàn thành" | "Không HT",
  ) => void
}

export function RepairRequestActionsMenu({
  request,
  visible,
  canManage,
  onGenerateRequestSheet,
  onEdit,
  onDelete,
  onApprove,
  onCompletion,
}: RepairRequestActionsMenuProps) {
  if (!visible) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8"
        >
          <span className="sr-only">Mở menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onGenerateRequestSheet(request)}>
          Xem phiếu yêu cầu
        </DropdownMenuItem>

        {request.trang_thai === "Chờ xử lý" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onEdit(request)}>
              <Edit className="mr-2 h-4 w-4" />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(request)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xoá
            </DropdownMenuItem>
          </>
        )}

        {canManage && (
          <>
            <DropdownMenuSeparator />
            {request.trang_thai === "Chờ xử lý" && (
              <DropdownMenuItem onClick={() => onApprove(request)}>
                Duyệt
              </DropdownMenuItem>
            )}
            {request.trang_thai === "Đã duyệt" && (
              <>
                <DropdownMenuItem
                  onClick={() => onCompletion(request, "Hoàn thành")}
                >
                  Hoàn thành
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCompletion(request, "Không HT")}
                >
                  Không hoàn thành
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
