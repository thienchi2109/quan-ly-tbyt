"use client"

import { Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { RepairRequestDialogsController } from "../../_hooks/types"

interface RepairRequestDeleteDialogProps {
  controller: RepairRequestDialogsController
}

export function RepairRequestDeleteDialog({
  controller,
}: RepairRequestDeleteDialogProps) {
  const { requestToDelete } = controller

  if (!requestToDelete) {
    return null
  }

  return (
    <AlertDialog
      open={!!requestToDelete}
      onOpenChange={(open) => !open && controller.onRequestToDeleteChange(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Yêu cầu sửa chữa cho thiết bị
            <strong> {requestToDelete.thiet_bi?.ten_thiet_bi} </strong>
            sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={controller.isDeleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={controller.onDeleteRequest}
            disabled={controller.isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {controller.isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
