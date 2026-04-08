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

import type { RepairRequestDialogsController } from "../../_hooks/types"
import { RepairExecutionUnitFields } from "../repair-execution-unit-fields"

interface RepairRequestApproveDialogProps {
  controller: RepairRequestDialogsController
}

export function RepairRequestApproveDialog({
  controller,
}: RepairRequestApproveDialogProps) {
  const { requestToApprove } = controller

  if (!requestToApprove) {
    return null
  }

  return (
    <Dialog
      open={!!requestToApprove}
      onOpenChange={(open) => !open && controller.onRequestToApproveChange(null)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duyệt yêu cầu sửa chữa</DialogTitle>
          <DialogDescription>
            Duyệt yêu cầu sửa chữa cho thiết bị{" "}
            <strong>{requestToApprove.thiet_bi?.ten_thiet_bi}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {requestToApprove.nguoi_duyet && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-sm font-medium text-blue-800">
                Đã được duyệt bởi:
              </div>
              <div className="text-sm text-blue-600">
                {requestToApprove.nguoi_duyet}
              </div>
              {requestToApprove.ngay_duyet && (
                <div className="text-xs text-blue-500">
                  {format(
                    parseISO(requestToApprove.ngay_duyet),
                    "dd/MM/yyyy HH:mm",
                    { locale: vi },
                  )}
                </div>
              )}
            </div>
          )}

          <RepairExecutionUnitFields
            unit={controller.approvalRepairUnit}
            onUnitChange={controller.onApprovalRepairUnitChange}
            externalCompanyName={controller.approvalExternalCompanyName}
            onExternalCompanyNameChange={
              controller.onApprovalExternalCompanyNameChange
            }
            unitId="approval-repair-unit"
            externalCompanyId="approval-external-company"
            externalCompanyLabel="Tên đơn vị thực hiện sửa chữa"
            externalCompanyPlaceholder="Nhập tên đơn vị được thuê sửa chữa"
            disabled={controller.isApproving}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => controller.onRequestToApproveChange(null)}
            disabled={controller.isApproving}
          >
            Hủy
          </Button>
          <Button
            onClick={controller.onConfirmApproval}
            disabled={controller.isApproving}
          >
            {controller.isApproving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Xác nhận duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
