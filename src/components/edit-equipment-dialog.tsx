"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  EquipmentFormDialogShared,
  equipmentFormSchema,
  type EquipmentFormValues,
  toEquipmentFormValues,
} from "@/components/equipment-form-dialog-shared"
import { useToast } from "@/hooks/use-toast"
import { type Equipment } from "@/lib/data"
import { supabase } from "@/lib/supabase"

interface EditEquipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  equipment: Equipment | null
}

export function EditEquipmentDialog({ open, onOpenChange, onSuccess, equipment }: EditEquipmentDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {},
  })

  React.useEffect(() => {
    if (!equipment) return
    form.reset(toEquipmentFormValues(equipment))
  }, [equipment, form])

  const onSubmit = React.useCallback(async (values: EquipmentFormValues) => {
    if (!equipment) return

    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kết nối cơ sở dữ liệu.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("thiet_bi")
        .update(values)
        .eq("id", equipment.id)

      if (error) {
        throw error
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin thiết bị.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật thiết bị."
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể cập nhật thiết bị. ${message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [equipment, onOpenChange, onSuccess, toast])

  return (
    <EquipmentFormDialogShared
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      title="Sửa thông tin thiết bị"
      description="Chỉnh sửa các thông tin bên dưới. Nhấn lưu để hoàn tất."
      submitLabel="Lưu thay đổi"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      showNd98Classification
    />
  )
}
