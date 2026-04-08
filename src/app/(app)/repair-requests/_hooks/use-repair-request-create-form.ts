"use client"

import * as React from "react"
import { format } from "date-fns"
import { useSearchParams } from "next/navigation"

import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types/database"

import { getRepairRequestDepartment } from "../_lib/repair-request-permissions"
import type { EquipmentSelectItem } from "../types"
import type {
  RepairRequestCreateFormController,
  RepairUnit,
} from "./types"

type ToastFn = ReturnType<typeof useToast>["toast"]

interface UseRepairRequestCreateFormParams {
  user: User | null | undefined
  canSetRepairUnit: boolean
  allEquipment: EquipmentSelectItem[]
  toast: ToastFn
  onSuccess: () => void
}

export function useRepairRequestCreateForm({
  user,
  canSetRepairUnit,
  allEquipment,
  toast,
  onSuccess,
}: UseRepairRequestCreateFormParams): RepairRequestCreateFormController {
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedEquipment, setSelectedEquipment] =
    React.useState<EquipmentSelectItem | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [issueDescription, setIssueDescription] = React.useState("")
  const [repairItems, setRepairItems] = React.useState("")
  const [desiredDate, setDesiredDate] = React.useState<Date>()
  const [repairUnit, setRepairUnit] = React.useState<RepairUnit>("noi_bo")
  const [externalCompanyName, setExternalCompanyName] = React.useState("")

  const handleSelectEquipment = React.useCallback(
    (equipment: EquipmentSelectItem) => {
      setSelectedEquipment(equipment)
      setSearchQuery(`${equipment.ten_thiet_bi} (${equipment.ma_thiet_bi})`)
    },
    [],
  )

  React.useEffect(() => {
    const equipmentId = searchParams.get("equipmentId")
    if (!equipmentId || allEquipment.length === 0) {
      return
    }

    if (selectedEquipment?.id === Number(equipmentId)) {
      return
    }

    const equipmentToSelect = allEquipment.find(
      (equipment) => equipment.id === Number(equipmentId),
    )
    if (equipmentToSelect) {
      handleSelectEquipment(equipmentToSelect)
      setOpen(true)
    }
  }, [allEquipment, handleSelectEquipment, searchParams, selectedEquipment])

  const filteredEquipment = React.useMemo(() => {
    if (!searchQuery) {
      return []
    }

    if (
      selectedEquipment &&
      searchQuery ===
        `${selectedEquipment.ten_thiet_bi} (${selectedEquipment.ma_thiet_bi})`
    ) {
      return []
    }

    const normalizedQuery = searchQuery.toLowerCase()
    return allEquipment.filter(
      (equipment) =>
        equipment.ten_thiet_bi.toLowerCase().includes(normalizedQuery) ||
        equipment.ma_thiet_bi.toLowerCase().includes(normalizedQuery),
    )
  }, [allEquipment, searchQuery, selectedEquipment])

  const shouldShowNoResults = React.useMemo(() => {
    if (!searchQuery) {
      return false
    }

    if (
      selectedEquipment &&
      searchQuery ===
        `${selectedEquipment.ten_thiet_bi} (${selectedEquipment.ma_thiet_bi})`
    ) {
      return false
    }

    return filteredEquipment.length === 0
  }, [filteredEquipment.length, searchQuery, selectedEquipment])

  const resetForm = React.useCallback(() => {
    setSelectedEquipment(null)
    setSearchQuery("")
    setIssueDescription("")
    setRepairItems("")
    setDesiredDate(undefined)
    setRepairUnit("noi_bo")
    setExternalCompanyName("")
  }, [])

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value)
      if (selectedEquipment) {
        setSelectedEquipment(null)
      }
    },
    [selectedEquipment],
  )

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()

      if (!supabase) {
        return
      }

      if (!selectedEquipment || !issueDescription || !repairItems) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng điền đầy đủ các trường bắt buộc.",
        })
        return
      }

      if (repairUnit === "thue_ngoai" && !externalCompanyName.trim()) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng nhập tên đơn vị được thuê sửa chữa.",
        })
        return
      }

      if (!user) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description:
            "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
        })
        return
      }

      setIsSubmitting(true)

      try {
        const department = getRepairRequestDepartment(user)
        if (department) {
          const { data, error } = await supabase
            .from("thiet_bi")
            .select("khoa_phong_quan_ly")
            .eq("id", selectedEquipment.id)
            .single()

          if (error || !data) {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: "Không thể xác minh thông tin thiết bị.",
            })
            return
          }

          if (data.khoa_phong_quan_ly !== department) {
            toast({
              variant: "destructive",
              title: "Không có quyền",
              description:
                "Bạn chỉ có thể tạo yêu cầu sửa chữa cho thiết bị thuộc khoa/phòng của mình.",
            })
            return
          }
        }

        const { error } = await supabase.from("yeu_cau_sua_chua").insert({
          thiet_bi_id: selectedEquipment.id,
          mo_ta_su_co: issueDescription,
          hang_muc_sua_chua: repairItems,
          ngay_mong_muon_hoan_thanh: desiredDate
            ? format(desiredDate, "yyyy-MM-dd")
            : null,
          nguoi_yeu_cau: user.full_name || user.username,
          trang_thai: "Chờ xử lý",
          don_vi_thuc_hien: canSetRepairUnit ? repairUnit : null,
          ten_don_vi_thue:
            canSetRepairUnit && repairUnit === "thue_ngoai"
              ? externalCompanyName.trim()
              : null,
        })

        if (error) {
          toast({
            variant: "destructive",
            title: "Gửi yêu cầu thất bại",
            description: error.message,
          })
          return
        }

        toast({
          title: "Thành công",
          description: "Yêu cầu sửa chữa của bạn đã được gửi đi.",
        })
        resetForm()
        onSuccess()
        setOpen(false)
      } catch (error) {
        console.error("Repair request creation failed:", error)
        toast({
          variant: "destructive",
          title: "Lỗi hệ thống",
          description:
            "Không thể tạo yêu cầu sửa chữa. Vui lòng thử lại.",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      canSetRepairUnit,
      desiredDate,
      externalCompanyName,
      issueDescription,
      onSuccess,
      repairItems,
      repairUnit,
      resetForm,
      selectedEquipment,
      toast,
      user,
    ],
  )

  return {
    open,
    onOpenChange: setOpen,
    onSubmit: handleSubmit,
    searchQuery,
    onSearchChange: handleSearchChange,
    filteredEquipment,
    shouldShowNoResults,
    selectedEquipment,
    onSelectEquipment: handleSelectEquipment,
    issueDescription,
    onIssueDescriptionChange: setIssueDescription,
    repairItems,
    onRepairItemsChange: setRepairItems,
    desiredDate,
    onDesiredDateChange: setDesiredDate,
    repairUnit,
    onRepairUnitChange: setRepairUnit,
    externalCompanyName,
    onExternalCompanyNameChange: setExternalCompanyName,
    isSubmitting,
  }
}
