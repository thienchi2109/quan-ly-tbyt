"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RepairExecutionUnitFieldsProps {
  unit: "noi_bo" | "thue_ngoai"
  onUnitChange: (value: "noi_bo" | "thue_ngoai") => void
  externalCompanyName: string
  onExternalCompanyNameChange: (value: string) => void
  unitId: string
  externalCompanyId: string
  unitLabel?: string
  externalCompanyLabel?: string
  externalCompanyPlaceholder?: string
  disabled?: boolean
  selectTriggerClassName?: string
  inputClassName?: string
}

export function RepairExecutionUnitFields({
  unit,
  onUnitChange,
  externalCompanyName,
  onExternalCompanyNameChange,
  unitId,
  externalCompanyId,
  unitLabel = "Đơn vị thực hiện",
  externalCompanyLabel = "Tên đơn vị được thuê",
  externalCompanyPlaceholder = "Nhập tên đơn vị được thuê sửa chữa...",
  disabled = false,
  selectTriggerClassName,
  inputClassName,
}: RepairExecutionUnitFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={unitId}>{unitLabel}</Label>
        <Select value={unit} onValueChange={onUnitChange} disabled={disabled}>
          <SelectTrigger id={unitId} className={selectTriggerClassName}>
            <SelectValue placeholder="Chọn đơn vị thực hiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="noi_bo">Nội bộ</SelectItem>
            <SelectItem value="thue_ngoai">Thuê ngoài</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {unit === "thue_ngoai" && (
        <div className="space-y-2">
          <Label htmlFor={externalCompanyId}>{externalCompanyLabel}</Label>
          <Input
            id={externalCompanyId}
            placeholder={externalCompanyPlaceholder}
            value={externalCompanyName}
            onChange={(e) => onExternalCompanyNameChange(e.target.value)}
            required
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      )}
    </>
  )
}
