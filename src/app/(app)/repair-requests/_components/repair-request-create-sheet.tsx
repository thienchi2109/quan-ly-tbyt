"use client"

import { Check, Loader2, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import type { EquipmentSelectItem } from "../types"
import { RepairDesiredDateField } from "./repair-desired-date-field"
import { RepairExecutionUnitFields } from "./repair-execution-unit-fields"

interface UserLike {
  role: string
  khoa_phong?: string | null
}

interface RepairRequestCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  user: UserLike | null | undefined
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  filteredEquipment: EquipmentSelectItem[]
  shouldShowNoResults: boolean
  selectedEquipment: EquipmentSelectItem | null
  onSelectEquipment: (equipment: EquipmentSelectItem) => void
  issueDescription: string
  onIssueDescriptionChange: (value: string) => void
  repairItems: string
  onRepairItemsChange: (value: string) => void
  desiredDate?: Date
  onDesiredDateChange: (date: Date | undefined) => void
  canSetRepairUnit: boolean
  repairUnit: "noi_bo" | "thue_ngoai"
  onRepairUnitChange: (value: "noi_bo" | "thue_ngoai") => void
  externalCompanyName: string
  onExternalCompanyNameChange: (value: string) => void
  isSubmitting: boolean
}

export function RepairRequestCreateSheet({
  open,
  onOpenChange,
  onSubmit,
  user,
  searchQuery,
  onSearchChange,
  filteredEquipment,
  shouldShowNoResults,
  selectedEquipment,
  onSelectEquipment,
  issueDescription,
  onIssueDescriptionChange,
  repairItems,
  onRepairItemsChange,
  desiredDate,
  onDesiredDateChange,
  canSetRepairUnit,
  repairUnit,
  onRepairUnitChange,
  externalCompanyName,
  onExternalCompanyNameChange,
  isSubmitting,
}: RepairRequestCreateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="shadow-md hover:shadow-lg transition-all duration-300 gap-2 shrink-0">
          <PlusCircle className="h-5 w-5" />
          <span className="font-semibold">Tạo Yêu Cầu Mới</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            Tạo yêu cầu sửa chữa
          </SheetTitle>
          <SheetDescription>
            Điền thông tin bên dưới để gửi yêu cầu mới cho thiết bị gặp sự cố.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-5 pb-8">
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
                value={searchQuery}
                onChange={onSearchChange}
                autoComplete="off"
                required
              />
              {filteredEquipment.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-1">
                    {filteredEquipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="text-sm mobile-interactive hover:bg-accent rounded-sm cursor-pointer touch-target-sm"
                        onClick={() => onSelectEquipment(equipment)}
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
              {shouldShowNoResults && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg p-3">
                  <div className="text-sm text-muted-foreground text-center">
                    {user &&
                    !["admin", "to_qltb"].includes(user.role) &&
                    user.khoa_phong
                      ? `Không tìm thấy thiết bị thuộc ${user.khoa_phong} phù hợp với từ khóa "${searchQuery}"`
                      : `Không tìm thấy thiết bị phù hợp với từ khóa "${searchQuery}"`}
                  </div>
                </div>
              )}
            </div>
            {selectedEquipment && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>
                  Đã chọn: {selectedEquipment.ten_thiet_bi} (
                  {selectedEquipment.ma_thiet_bi})
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
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
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
              value={issueDescription}
              onChange={(e) => onIssueDescriptionChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repair-items">Các hạng mục yêu cầu sửa chữa</Label>
            <Textarea
              id="repair-items"
              placeholder="VD: Thay màn hình, sửa nguồn..."
              rows={3}
              value={repairItems}
              onChange={(e) => onRepairItemsChange(e.target.value)}
              required
            />
          </div>
          <RepairDesiredDateField
            value={desiredDate}
            onSelect={onDesiredDateChange}
            buttonClassName="touch-target"
            disabledDate={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
          />

          {canSetRepairUnit && (
            <RepairExecutionUnitFields
              unit={repairUnit}
              onUnitChange={onRepairUnitChange}
              externalCompanyName={externalCompanyName}
              onExternalCompanyNameChange={onExternalCompanyNameChange}
              unitId="repair-unit"
              externalCompanyId="external-company"
              selectTriggerClassName="touch-target"
              inputClassName="touch-target"
            />
          )}

          <SheetFooter className="mt-8 gap-3 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
