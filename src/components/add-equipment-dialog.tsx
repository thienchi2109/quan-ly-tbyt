"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  EquipmentFormDialogShared,
  equipmentFormDefaultValues,
  equipmentFormSchema,
  type EquipmentFormValues,
} from "@/components/equipment-form-dialog-shared"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface AddEquipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddEquipmentDialog({ open, onOpenChange, onSuccess }: AddEquipmentDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const submitInFlightRef = React.useRef(false)
  const [departments, setDepartments] = React.useState<string[]>([])
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: equipmentFormDefaultValues,
  })

  const fetchDepartments = React.useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("khoa_phong_quan_ly")
        .not("khoa_phong_quan_ly", "is", null)

      if (error) throw error

      const uniqueDepartments = Array.from(
        new Set(
          (data ?? [])
            .map((item) => item.khoa_phong_quan_ly)
            .filter((value): value is string => Boolean(value)),
        ),
      )

      setDepartments(uniqueDepartments.sort())
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách khoa phòng."
      toast({
        variant: "destructive",
        title: "Lỗi tải danh sách khoa phòng",
        description: message,
      })
    }
  }, [toast])

  React.useEffect(() => {
    if (open) {
      void fetchDepartments()
      return
    }

    form.reset(equipmentFormDefaultValues)
  }, [fetchDepartments, form, open])

  const onSubmit = React.useCallback(async (values: EquipmentFormValues) => {
    if (submitInFlightRef.current) {
      return
    }

    submitInFlightRef.current = true
    setIsSubmitting(true)
    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Lỗi kết nối cơ sở dữ liệu.",
      })
      setIsSubmitting(false)
      submitInFlightRef.current = false
      return
    }

    try {
      const { error } = await supabase.from("thiet_bi").insert([values])

      if (error) {
        throw error
      }

      toast({
        title: "Thành công",
        description: "Đã thêm thiết bị mới vào danh mục.",
      })
      onSuccess()
      onOpenChange(false)
      form.reset(equipmentFormDefaultValues)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể thêm thiết bị."
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể thêm thiết bị. ${message}`,
      })
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }, [form, onOpenChange, onSuccess, toast])

  return (
    <EquipmentFormDialogShared
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      title="Thêm thiết bị mới"
      description="Điền các thông tin chi tiết cho thiết bị. Nhấn lưu để hoàn tất."
      submitLabel="Lưu thiết bị"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      departments={departments}
      showDepartmentSuggestions
    />
  )
}
