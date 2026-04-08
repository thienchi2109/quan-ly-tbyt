"use client"

import { Check, Loader2, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type {
  RepairRequestCreateFormController,
  RepairRequestRouteUserProps,
} from "../_hooks/types"
import { RepairDesiredDateField } from "./repair-desired-date-field"
import { RepairExecutionUnitFields } from "./repair-execution-unit-fields"
import { RepairRequestSheetFrame } from "./repair-request-sheet-frame"

interface RepairRequestCreateSheetProps {
  controller: RepairRequestCreateFormController
  user: RepairRequestRouteUserProps["user"]
  canSetRepairUnit: boolean
}

export function RepairRequestCreateSheet({
  controller,
  user,
  canSetRepairUnit,
}: RepairRequestCreateSheetProps) {
  return (
    <RepairRequestSheetFrame
      open={controller.open}
      onOpenChange={controller.onOpenChange}
      title={
        <div className="flex items-center gap-2 text-2xl font-bold">
          <div className="rounded-lg bg-primary/10 p-2">
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          Tạo yêu cầu sửa chữa
        </div>
      }
      description="Điền thông tin bên dưới để gửi yêu cầu mới cho thiết bị gặp sự cố."
      trigger={
        <Button className="shrink-0 gap-2 shadow-md transition-all duration-300 hover:shadow-lg">
          <PlusCircle className="h-5 w-5" />
          <span className="font-semibold">Tạo Yêu Cầu Mới</span>
        </Button>
      }
      footer={
        <>
          <Button
            variant="outline"
            type="button"
            onClick={() => controller.onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="submit" form="repair-request-create-form" disabled={controller.isSubmitting}>
            {controller.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {controller.isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </>
      }
    >
        <form
          id="repair-request-create-form"
          onSubmit={controller.onSubmit}
          className="space-y-5 pb-2"
        >
          <div className="space-y-2">
            <Label htmlFor="search-equipment">Thiết bị</Label>
            <div className="relative">
              <Input
                id="search-equipment"
                placeholder={
                  user &&
                  !["admin", "to_qltb"].includes(user.role) &&
                  user.khoa_phong
                    ? `Tìm thiết bị thuộc ${user.khoa_phong}...`
                    : "Nhập tên hoặc mã để tìm kiếm..."
                }
                value={controller.searchQuery}
                onChange={controller.onSearchChange}
                autoComplete="off"
                required
              />

              {controller.filteredEquipment.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
                  <div className="p-1">
                    {controller.filteredEquipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="mobile-interactive touch-target-sm cursor-pointer rounded-sm text-sm hover:bg-accent"
                        onClick={() => controller.onSelectEquipment(equipment)}
                      >
                        <div className="font-medium">{equipment.ten_thiet_bi}</div>
                        <div className="text-xs text-muted-foreground">
                          {equipment.ma_thiet_bi}
                          {equipment.khoa_phong_quan_ly && (
                            <span className="ml-2 text-blue-600">
                              • {equipment.khoa_phong_quan_ly}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {controller.shouldShowNoResults && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
                  <div className="text-center text-sm text-muted-foreground">
                    {user &&
                    !["admin", "to_qltb"].includes(user.role) &&
                    user.khoa_phong
                      ? `Không tìm thấy thiết bị thuộc ${user.khoa_phong} phù hợp với từ khóa "${controller.searchQuery}"`
                      : `Không tìm thấy thiết bị phù hợp với từ khóa "${controller.searchQuery}"`}
                  </div>
                </div>
              )}
            </div>

            {controller.selectedEquipment && (
              <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>
                  Đã chọn: {controller.selectedEquipment.ten_thiet_bi} (
                  {controller.selectedEquipment.ma_thiet_bi})
                </span>
              </p>
            )}

            {user &&
              !["admin", "to_qltb"].includes(user.role) &&
              user.khoa_phong && (
                <div className="text-xs text-muted-foreground">
                  💡 Bạn chỉ có thể tạo yêu cầu sửa chữa cho thiết bị thuộc
                  khoa/phòng:{" "}
                  <span className="font-medium text-blue-600">
                    {user.khoa_phong}
                  </span>
                </div>
              )}

            {user &&
              (!user.khoa_phong || user.khoa_phong === "") &&
              !["admin", "to_qltb"].includes(user.role) && (
                <div className="rounded border bg-amber-50 p-2 text-xs text-amber-600">
                  ⚠️ Tài khoản của bạn chưa được phân công khoa/phòng. Vui lòng
                  liên hệ quản trị viên để được cấp quyền tạo yêu cầu sửa chữa.
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue">Mô tả sự cố</Label>
            <Textarea
              id="issue"
              placeholder="Mô tả chi tiết vấn đề gặp phải..."
              rows={4}
              value={controller.issueDescription}
              onChange={(event) =>
                controller.onIssueDescriptionChange(event.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repair-items">Các hạng mục yêu cầu sửa chữa</Label>
            <Textarea
              id="repair-items"
              placeholder="VD: Thay màn hình, sửa nguồn..."
              rows={3}
              value={controller.repairItems}
              onChange={(event) =>
                controller.onRepairItemsChange(event.target.value)
              }
              required
            />
          </div>

          <RepairDesiredDateField
            value={controller.desiredDate}
            onSelect={controller.onDesiredDateChange}
            buttonClassName="touch-target"
            disabledDate={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
          />

          {canSetRepairUnit && (
            <RepairExecutionUnitFields
              unit={controller.repairUnit}
              onUnitChange={controller.onRepairUnitChange}
              externalCompanyName={controller.externalCompanyName}
              onExternalCompanyNameChange={
                controller.onExternalCompanyNameChange
              }
              unitId="repair-unit"
              externalCompanyId="external-company"
              selectTriggerClassName="touch-target"
              inputClassName="touch-target"
            />
          )}

        </form>
    </RepairRequestSheetFrame>
  )
}
