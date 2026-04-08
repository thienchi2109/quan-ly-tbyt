"use client"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { getRepairRequestStatusVariant } from "../constants"
import type { RepairRequestWithEquipment } from "../types"
import { RepairDesiredDateField } from "./repair-desired-date-field"
import { RepairExecutionUnitFields } from "./repair-execution-unit-fields"

interface RepairRequestDialogsProps {
  editingRequest: RepairRequestWithEquipment | null
  onEditingRequestChange: (request: RepairRequestWithEquipment | null) => void
  editIssueDescription: string
  onEditIssueDescriptionChange: (value: string) => void
  editRepairItems: string
  onEditRepairItemsChange: (value: string) => void
  editDesiredDate?: Date
  onEditDesiredDateChange: (date: Date | undefined) => void
  canSetRepairUnit: boolean
  editRepairUnit: "noi_bo" | "thue_ngoai"
  onEditRepairUnitChange: (value: "noi_bo" | "thue_ngoai") => void
  editExternalCompanyName: string
  onEditExternalCompanyNameChange: (value: string) => void
  isEditSubmitting: boolean
  onUpdateRequest: () => void
  requestToDelete: RepairRequestWithEquipment | null
  onRequestToDeleteChange: (request: RepairRequestWithEquipment | null) => void
  isDeleting: boolean
  onDeleteRequest: () => void
  requestToApprove: RepairRequestWithEquipment | null
  onRequestToApproveChange: (request: RepairRequestWithEquipment | null) => void
  isApproving: boolean
  approvalRepairUnit: "noi_bo" | "thue_ngoai"
  onApprovalRepairUnitChange: (value: "noi_bo" | "thue_ngoai") => void
  approvalExternalCompanyName: string
  onApprovalExternalCompanyNameChange: (value: string) => void
  onConfirmApproval: () => void
  requestToComplete: RepairRequestWithEquipment | null
  onRequestToCompleteChange: (request: RepairRequestWithEquipment | null) => void
  completionType: "Hoàn thành" | "Không HT" | null
  isCompleting: boolean
  completionResult: string
  onCompletionResultChange: (value: string) => void
  nonCompletionReason: string
  onNonCompletionReasonChange: (value: string) => void
  onConfirmCompletion: () => void
  requestToView: RepairRequestWithEquipment | null
  onRequestToViewChange: (request: RepairRequestWithEquipment | null) => void
}

export function RepairRequestDialogs({
  editingRequest,
  onEditingRequestChange,
  editIssueDescription,
  onEditIssueDescriptionChange,
  editRepairItems,
  onEditRepairItemsChange,
  editDesiredDate,
  onEditDesiredDateChange,
  canSetRepairUnit,
  editRepairUnit,
  onEditRepairUnitChange,
  editExternalCompanyName,
  onEditExternalCompanyNameChange,
  isEditSubmitting,
  onUpdateRequest,
  requestToDelete,
  onRequestToDeleteChange,
  isDeleting,
  onDeleteRequest,
  requestToApprove,
  onRequestToApproveChange,
  isApproving,
  approvalRepairUnit,
  onApprovalRepairUnitChange,
  approvalExternalCompanyName,
  onApprovalExternalCompanyNameChange,
  onConfirmApproval,
  requestToComplete,
  onRequestToCompleteChange,
  completionType,
  isCompleting,
  completionResult,
  onCompletionResultChange,
  nonCompletionReason,
  onNonCompletionReasonChange,
  onConfirmCompletion,
  requestToView,
  onRequestToViewChange,
}: RepairRequestDialogsProps) {
  return (
    <>
      {editingRequest && (
        <Dialog
          open={!!editingRequest}
          onOpenChange={(open) => !open && onEditingRequestChange(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa yêu cầu sửa chữa</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cho yêu cầu của thiết bị:{" "}
                {editingRequest.thiet_bi?.ten_thiet_bi}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 mobile-card-spacing">
              <div className="space-y-2">
                <Label htmlFor="edit-issue">Mô tả sự cố</Label>
                <Textarea
                  id="edit-issue"
                  placeholder="Mô tả chi tiết vấn đề gặp phải..."
                  rows={4}
                  value={editIssueDescription}
                  onChange={(e) => onEditIssueDescriptionChange(e.target.value)}
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
                  value={editRepairItems}
                  onChange={(e) => onEditRepairItemsChange(e.target.value)}
                  required
                />
              </div>
              <RepairDesiredDateField
                value={editDesiredDate}
                onSelect={onEditDesiredDateChange}
                buttonClassName="touch-target"
                disabledDate={(date) => {
                  const requestDate = editingRequest?.ngay_yeu_cau
                    ? new Date(editingRequest.ngay_yeu_cau)
                    : new Date()
                  return date < new Date(requestDate.setHours(0, 0, 0, 0))
                }}
              />

              {canSetRepairUnit && (
                <RepairExecutionUnitFields
                  unit={editRepairUnit}
                  onUnitChange={onEditRepairUnitChange}
                  externalCompanyName={editExternalCompanyName}
                  onExternalCompanyNameChange={
                    onEditExternalCompanyNameChange
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
                onClick={() => onEditingRequestChange(null)}
                disabled={isEditSubmitting}
                className="touch-target"
              >
                Hủy
              </Button>
              <Button
                onClick={onUpdateRequest}
                disabled={isEditSubmitting}
                className="touch-target"
              >
                {isEditSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {requestToDelete && (
        <AlertDialog
          open={!!requestToDelete}
          onOpenChange={(open) => !open && onRequestToDeleteChange(null)}
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
              <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteRequest}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {requestToApprove && (
        <Dialog
          open={!!requestToApprove}
          onOpenChange={(open) => !open && onRequestToApproveChange(null)}
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
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                unit={approvalRepairUnit}
                onUnitChange={onApprovalRepairUnitChange}
                externalCompanyName={approvalExternalCompanyName}
                onExternalCompanyNameChange={
                  onApprovalExternalCompanyNameChange
                }
                unitId="approval-repair-unit"
                externalCompanyId="approval-external-company"
                externalCompanyLabel="Tên đơn vị thực hiện sửa chữa"
                externalCompanyPlaceholder="Nhập tên đơn vị được thuê sửa chữa"
                disabled={isApproving}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onRequestToApproveChange(null)}
                disabled={isApproving}
              >
                Hủy
              </Button>
              <Button onClick={onConfirmApproval} disabled={isApproving}>
                {isApproving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xác nhận duyệt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {requestToComplete && (
        <Dialog
          open={!!requestToComplete}
          onOpenChange={(open) => !open && onRequestToCompleteChange(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {completionType === "Hoàn thành"
                  ? "Ghi nhận hoàn thành sửa chữa"
                  : "Ghi nhận không hoàn thành"}
              </DialogTitle>
              <DialogDescription>
                {completionType === "Hoàn thành"
                  ? `Ghi nhận kết quả sửa chữa cho thiết bị ${requestToComplete.thiet_bi?.ten_thiet_bi}`
                  : `Ghi nhận lý do không hoàn thành sửa chữa cho thiết bị ${requestToComplete.thiet_bi?.ten_thiet_bi}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {requestToComplete.nguoi_xac_nhan && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
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
              {completionType === "Hoàn thành" ? (
                <div>
                  <Label htmlFor="completion-result">Kết quả sửa chữa</Label>
                  <Textarea
                    id="completion-result"
                    value={completionResult}
                    onChange={(e) => onCompletionResultChange(e.target.value)}
                    placeholder="Nhập kết quả và tình trạng thiết bị sau khi sửa chữa..."
                    rows={4}
                    disabled={isCompleting}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="non-completion-reason">
                    Lý do không hoàn thành
                  </Label>
                  <Textarea
                    id="non-completion-reason"
                    value={nonCompletionReason}
                    onChange={(e) =>
                      onNonCompletionReasonChange(e.target.value)
                    }
                    placeholder="Nhập lý do không thể hoàn thành sửa chữa..."
                    rows={4}
                    disabled={isCompleting}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onRequestToCompleteChange(null)}
                disabled={isCompleting}
              >
                Hủy
              </Button>
              <Button onClick={onConfirmCompletion} disabled={isCompleting}>
                {isCompleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {completionType === "Hoàn thành"
                  ? "Xác nhận hoàn thành"
                  : "Xác nhận không hoàn thành"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {requestToView && (
        <Dialog
          open={!!requestToView}
          onOpenChange={(open) => !open && onRequestToViewChange(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-lg font-semibold">
                Chi tiết yêu cầu sửa chữa
              </DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về yêu cầu sửa chữa thiết bị
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground border-b pb-2">
                    Thông tin thiết bị
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Tên thiết bị
                      </Label>
                      <div className="text-sm font-medium">
                        {requestToView.thiet_bi?.ten_thiet_bi || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Mã thiết bị
                      </Label>
                      <div className="text-sm">
                        {requestToView.thiet_bi?.ma_thiet_bi || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Model
                      </Label>
                      <div className="text-sm">
                        {requestToView.thiet_bi?.model || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Serial
                      </Label>
                      <div className="text-sm">
                        {requestToView.thiet_bi?.serial || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Khoa/Phòng quản lý
                      </Label>
                      <div className="text-sm">
                        {requestToView.thiet_bi?.khoa_phong_quan_ly || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground border-b pb-2">
                    Thông tin yêu cầu
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Trạng thái
                      </Label>
                      <Badge
                        variant={getRepairRequestStatusVariant(
                          requestToView.trang_thai,
                        )}
                        className="w-fit"
                      >
                        {requestToView.trang_thai}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Ngày yêu cầu
                      </Label>
                      <div className="text-sm">
                        {format(
                          parseISO(requestToView.ngay_yeu_cau),
                          "dd/MM/yyyy HH:mm",
                          { locale: vi },
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Người yêu cầu
                      </Label>
                      <div className="text-sm">
                        {requestToView.nguoi_yeu_cau || "N/A"}
                      </div>
                    </div>
                    {requestToView.ngay_mong_muon_hoan_thanh && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Ngày mong muốn hoàn thành
                        </Label>
                        <div className="text-sm">
                          {format(
                            parseISO(
                              requestToView.ngay_mong_muon_hoan_thanh,
                            ),
                            "dd/MM/yyyy",
                            { locale: vi },
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Mô tả sự cố
                    </Label>
                    <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                      {requestToView.mo_ta_su_co}
                    </div>
                  </div>

                  {requestToView.hang_muc_sua_chua && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Hạng mục sửa chữa
                      </Label>
                      <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {requestToView.hang_muc_sua_chua}
                      </div>
                    </div>
                  )}
                </div>

                {(requestToView.don_vi_thuc_hien ||
                  requestToView.ten_don_vi_thue) && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground border-b pb-2">
                      Thông tin thực hiện
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requestToView.don_vi_thuc_hien && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Đơn vị thực hiện
                          </Label>
                          <Badge variant="outline" className="w-fit">
                            {requestToView.don_vi_thuc_hien === "noi_bo"
                              ? "Nội bộ"
                              : "Thuê ngoài"}
                          </Badge>
                        </div>
                      )}
                      {requestToView.ten_don_vi_thue && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Tên đơn vị thuê
                          </Label>
                          <div className="text-sm">
                            {requestToView.ten_don_vi_thue}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(requestToView.ngay_duyet || requestToView.nguoi_duyet) && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground border-b pb-2">
                      Thông tin phê duyệt
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requestToView.nguoi_duyet && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Người duyệt
                          </Label>
                          <div className="text-sm">
                            {requestToView.nguoi_duyet}
                          </div>
                        </div>
                      )}
                      {requestToView.ngay_duyet && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Ngày duyệt
                          </Label>
                          <div className="text-sm">
                            {format(
                              parseISO(requestToView.ngay_duyet),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi },
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(requestToView.ngay_hoan_thanh ||
                  requestToView.ket_qua_sua_chua ||
                  requestToView.ly_do_khong_hoan_thanh ||
                  requestToView.nguoi_xac_nhan) && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground border-b pb-2">
                      Thông tin hoàn thành
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requestToView.nguoi_xac_nhan && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Người xác nhận
                          </Label>
                          <div className="text-sm">
                            {requestToView.nguoi_xac_nhan}
                          </div>
                        </div>
                      )}
                      {requestToView.ngay_hoan_thanh && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Ngày hoàn thành
                          </Label>
                          <div className="text-sm">
                            {format(
                              parseISO(requestToView.ngay_hoan_thanh),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi },
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {requestToView.ket_qua_sua_chua && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Kết quả sửa chữa
                        </Label>
                        <div className="text-sm bg-green-50 border border-green-200 p-3 rounded-md whitespace-pre-wrap">
                          {requestToView.ket_qua_sua_chua}
                        </div>
                      </div>
                    )}

                    {requestToView.ly_do_khong_hoan_thanh && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Lý do không hoàn thành
                        </Label>
                        <div className="text-sm bg-red-50 border border-red-200 p-3 rounded-md whitespace-pre-wrap">
                          {requestToView.ly_do_khong_hoan_thanh}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => onRequestToViewChange(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
