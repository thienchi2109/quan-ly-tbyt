"use client"

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
import { RepairDesiredDateField } from "../repair-desired-date-field"
import { RepairExecutionUnitFields } from "../repair-execution-unit-fields"

interface RepairRequestEditDialogProps {
  controller: RepairRequestDialogsController
  canSetRepairUnit: boolean
}

export function RepairRequestEditDialog({
  controller,
  canSetRepairUnit,
}: RepairRequestEditDialogProps) {
  const { editingRequest } = controller

  if (!editingRequest) {
    return null
  }

  return (
    <Dialog
      open={!!editingRequest}
      onOpenChange={(open) => !open && controller.onEditingRequestChange(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa yêu cầu sửa chữa</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho yêu cầu của thiết bị:{" "}
            {editingRequest.thiet_bi?.ten_thiet_bi}
          </DialogDescription>
        </DialogHeader>
        <div className="mobile-card-spacing space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-issue">Mô tả sự cố</Label>
            <Textarea
              id="edit-issue"
              placeholder="Mô tả chi tiết vấn đề gặp phải..."
              rows={4}
              value={controller.editIssueDescription}
              onChange={(event) =>
                controller.onEditIssueDescriptionChange(event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-repair-items">
              Các hạng mục yêu cầu sửa chữa
            </Label>
            <Textarea
              id="edit-repair-items"
              placeholder="VD: Thay màn hình, sửa nguồn..."
              rows={3}
              value={controller.editRepairItems}
              onChange={(event) =>
                controller.onEditRepairItemsChange(event.target.value)
              }
              required
            />
          </div>
          <RepairDesiredDateField
            value={controller.editDesiredDate}
            onSelect={controller.onEditDesiredDateChange}
            buttonClassName="touch-target"
            disabledDate={(date) => {
              const requestDate = editingRequest.ngay_yeu_cau
                ? new Date(editingRequest.ngay_yeu_cau)
                : new Date()
              return date < new Date(requestDate.setHours(0, 0, 0, 0))
            }}
          />

          {canSetRepairUnit && (
            <RepairExecutionUnitFields
              unit={controller.editRepairUnit}
              onUnitChange={controller.onEditRepairUnitChange}
              externalCompanyName={controller.editExternalCompanyName}
              onExternalCompanyNameChange={
                controller.onEditExternalCompanyNameChange
              }
              unitId="edit-repair-unit"
              externalCompanyId="edit-external-company"
              selectTriggerClassName="touch-target"
              inputClassName="touch-target"
            />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => controller.onEditingRequestChange(null)}
            disabled={controller.isEditSubmitting}
            className="touch-target"
          >
            Hủy
          </Button>
          <Button
            onClick={controller.onUpdateRequest}
            disabled={controller.isEditSubmitting}
            className="touch-target"
          >
            {controller.isEditSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
