"use client"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { RepairRequestDialogsController } from "../../_hooks/types"

interface RepairRequestCompletionDialogProps {
  controller: RepairRequestDialogsController
}

export function RepairRequestCompletionDialog({
  controller,
}: RepairRequestCompletionDialogProps) {
  const { requestToComplete } = controller

  if (!requestToComplete || !controller.completionType) {
    return null
  }

  return (
    <Dialog
      open={!!requestToComplete}
      onOpenChange={(open) => !open && controller.onRequestToCompleteChange(null)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {controller.completionType === "Hoàn thành"
              ? "Ghi nhận hoàn thành sửa chữa"
              : "Ghi nhận không hoàn thành"}
          </DialogTitle>
          <DialogDescription>
            {controller.completionType === "Hoàn thành"
              ? `Ghi nhận kết quả sửa chữa cho thiết bị ${requestToComplete.thiet_bi?.ten_thiet_bi}`
              : `Ghi nhận lý do không hoàn thành sửa chữa cho thiết bị ${requestToComplete.thiet_bi?.ten_thiet_bi}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {requestToComplete.nguoi_xac_nhan && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="text-sm font-medium text-green-800">
                Đã được xác nhận bởi:
              </div>
              <div className="text-sm text-green-600">
                {requestToComplete.nguoi_xac_nhan}
              </div>
              {requestToComplete.ngay_hoan_thanh && (
                <div className="text-xs text-green-500">
                  {format(
                    parseISO(requestToComplete.ngay_hoan_thanh),
                    "dd/MM/yyyy HH:mm",
                    { locale: vi },
                  )}
                </div>
              )}
            </div>
          )}

          {controller.completionType === "Hoàn thành" ? (
            <div>
              <Label htmlFor="completion-result">Kết quả sửa chữa</Label>
              <Textarea
                id="completion-result"
                value={controller.completionResult}
                onChange={(event) =>
                  controller.onCompletionResultChange(event.target.value)
                }
                placeholder="Nhập kết quả và tình trạng thiết bị sau khi sửa chữa..."
                rows={4}
                disabled={controller.isCompleting}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="non-completion-reason">
                Lý do không hoàn thành
              </Label>
              <Textarea
                id="non-completion-reason"
                value={controller.nonCompletionReason}
                onChange={(event) =>
                  controller.onNonCompletionReasonChange(event.target.value)
                }
                placeholder="Nhập lý do không thể hoàn thành sửa chữa..."
                rows={4}
                disabled={controller.isCompleting}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => controller.onRequestToCompleteChange(null)}
            disabled={controller.isCompleting}
          >
            Hủy
          </Button>
          <Button
            onClick={controller.onConfirmCompletion}
            disabled={controller.isCompleting}
          >
            {controller.isCompleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {controller.completionType === "Hoàn thành"
              ? "Xác nhận hoàn thành"
              : "Xác nhận không hoàn thành"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
