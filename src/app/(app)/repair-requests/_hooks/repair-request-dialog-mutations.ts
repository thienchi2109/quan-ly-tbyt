import { format } from "date-fns"

import type { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types/database"

import type { RepairRequestWithEquipment } from "../types"
import type { CompletionType, RepairUnit } from "./types"

type ToastFn = ReturnType<typeof useToast>["toast"]

interface UpdateRepairRequestParams {
  editingRequest: RepairRequestWithEquipment
  editIssueDescription: string
  editRepairItems: string
  editDesiredDate?: Date
  canSetRepairUnit: boolean
  editRepairUnit: RepairUnit
  editExternalCompanyName: string
  toast: ToastFn
  onSuccess: () => void
}

export async function updateRepairRequest({
  editingRequest,
  editIssueDescription,
  editRepairItems,
  editDesiredDate,
  canSetRepairUnit,
  editRepairUnit,
  editExternalCompanyName,
  toast,
  onSuccess,
}: UpdateRepairRequestParams) {
  if (!supabase) {
    return false
  }

  if (!editIssueDescription || !editRepairItems) {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: "Mô tả sự cố và hạng mục không được để trống.",
    })
    return false
  }

  if (editRepairUnit === "thue_ngoai" && !editExternalCompanyName.trim()) {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: "Vui lòng nhập tên đơn vị được thuê sửa chữa.",
    })
    return false
  }

  const { error } = await supabase
    .from("yeu_cau_sua_chua")
    .update({
      mo_ta_su_co: editIssueDescription,
      hang_muc_sua_chua: editRepairItems,
      ngay_mong_muon_hoan_thanh: editDesiredDate
        ? format(editDesiredDate, "yyyy-MM-dd")
        : null,
      don_vi_thuc_hien: canSetRepairUnit
        ? editRepairUnit
        : editingRequest.don_vi_thuc_hien,
      ten_don_vi_thue:
        canSetRepairUnit && editRepairUnit === "thue_ngoai"
          ? editExternalCompanyName.trim()
          : canSetRepairUnit
            ? null
            : editingRequest.ten_don_vi_thue,
    })
    .eq("id", editingRequest.id)

  if (error) {
    toast({
      variant: "destructive",
      title: "Lỗi cập nhật",
      description: error.message,
    })
    return false
  }

  toast({ title: "Thành công", description: "Đã cập nhật yêu cầu." })
  onSuccess()
  return true
}

export async function deleteRepairRequest({
  requestToDelete,
  toast,
  onSuccess,
}: {
  requestToDelete: RepairRequestWithEquipment
  toast: ToastFn
  onSuccess: () => void
}) {
  if (!supabase) {
    return false
  }

  const { error } = await supabase
    .from("yeu_cau_sua_chua")
    .delete()
    .eq("id", requestToDelete.id)

  if (error) {
    toast({
      variant: "destructive",
      title: "Lỗi xóa yêu cầu",
      description: error.message,
    })
    return false
  }

  toast({ title: "Đã xóa", description: "Yêu cầu đã được xóa thành công." })
  onSuccess()
  return true
}

interface ApproveRepairRequestParams {
  requestToApprove: RepairRequestWithEquipment
  approvalRepairUnit: RepairUnit
  approvalExternalCompanyName: string
  user: User | null | undefined
  toast: ToastFn
  onSuccess: () => void
}

export async function approveRepairRequest({
  requestToApprove,
  approvalRepairUnit,
  approvalExternalCompanyName,
  user,
  toast,
  onSuccess,
}: ApproveRepairRequestParams) {
  if (!supabase) {
    return false
  }

  if (
    approvalRepairUnit === "thue_ngoai" &&
    !approvalExternalCompanyName.trim()
  ) {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: "Vui lòng nhập tên đơn vị được thuê sửa chữa.",
    })
    return false
  }

  const { error: requestError } = await supabase
    .from("yeu_cau_sua_chua")
    .update({
      trang_thai: "Đã duyệt",
      ngay_duyet: new Date().toISOString(),
      nguoi_duyet: user?.full_name || user?.username || "",
      don_vi_thuc_hien: approvalRepairUnit,
      ten_don_vi_thue:
        approvalRepairUnit === "thue_ngoai"
          ? approvalExternalCompanyName.trim()
          : null,
    })
    .eq("id", requestToApprove.id)

  if (requestError) {
    toast({
      variant: "destructive",
      title: "Lỗi duyệt yêu cầu",
      description: "Không thể duyệt yêu cầu. " + requestError.message,
    })
    return false
  }

  const { error: equipmentError } = await supabase
    .from("thiet_bi")
    .update({ tinh_trang_hien_tai: "Chờ sửa chữa" })
    .eq("id", requestToApprove.thiet_bi_id)

  if (equipmentError) {
    toast({
      variant: "destructive",
      title: "Lỗi cập nhật thiết bị",
      description: `Đã duyệt yêu cầu, nhưng không thể cập nhật trạng thái thiết bị. ${equipmentError.message}`,
    })
  } else {
    toast({ title: "Thành công", description: "Đã duyệt yêu cầu sửa chữa." })
  }

  onSuccess()
  return true
}

interface CompleteRepairRequestParams {
  requestToComplete: RepairRequestWithEquipment
  completionType: CompletionType
  completionResult: string
  nonCompletionReason: string
  user: User | null | undefined
  toast: ToastFn
  onSuccess: () => void
}

export async function completeRepairRequest({
  requestToComplete,
  completionType,
  completionResult,
  nonCompletionReason,
  user,
  toast,
  onSuccess,
}: CompleteRepairRequestParams) {
  if (!supabase) {
    return false
  }

  if (completionType === "Hoàn thành" && !completionResult.trim()) {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: "Vui lòng nhập kết quả sửa chữa.",
    })
    return false
  }

  if (completionType === "Không HT" && !nonCompletionReason.trim()) {
    toast({
      variant: "destructive",
      title: "Thiếu thông tin",
      description: "Vui lòng nhập lý do không hoàn thành.",
    })
    return false
  }

  const newEquipmentStatus =
    completionType === "Hoàn thành" ? "Hoạt động" : "Chờ sửa chữa"

  const { error: requestError } = await supabase
    .from("yeu_cau_sua_chua")
    .update({
      trang_thai: completionType,
      ngay_hoan_thanh: new Date().toISOString(),
      nguoi_xac_nhan: user?.full_name || user?.username || "",
      ket_qua_sua_chua:
        completionType === "Hoàn thành" ? completionResult.trim() : null,
      ly_do_khong_hoan_thanh:
        completionType === "Không HT" ? nonCompletionReason.trim() : null,
    })
    .eq("id", requestToComplete.id)

  if (requestError) {
    toast({
      variant: "destructive",
      title: "Lỗi cập nhật yêu cầu",
      description: requestError.message,
    })
    return false
  }

  const { error: equipmentError } = await supabase
    .from("thiet_bi")
    .update({ tinh_trang_hien_tai: newEquipmentStatus })
    .eq("id", requestToComplete.thiet_bi_id)

  if (equipmentError) {
    toast({
      variant: "destructive",
      title: "Lỗi cập nhật thiết bị",
      description: `Đã cập nhật yêu cầu, nhưng lỗi khi cập nhật trạng thái thiết bị. ${equipmentError.message}`,
    })
  } else {
    toast({
      title: "Thành công",
      description: `Đã cập nhật trạng thái yêu cầu thành "${completionType}".`,
    })
  }

  const { error: historyError } = await supabase.from("lich_su_thiet_bi").insert({
    thiet_bi_id: requestToComplete.thiet_bi_id,
    loai_su_kien: "Sửa chữa",
    mo_ta: `Yêu cầu sửa chữa được cập nhật thành "${completionType}"`,
    chi_tiet: {
      mo_ta_su_co: requestToComplete.mo_ta_su_co,
      hang_muc_sua_chua: requestToComplete.hang_muc_sua_chua,
      nguoi_yeu_cau: requestToComplete.nguoi_yeu_cau,
      ket_qua:
        completionType === "Hoàn thành"
          ? completionResult.trim()
          : nonCompletionReason.trim(),
    },
    yeu_cau_id: requestToComplete.id,
  })

  if (historyError) {
    toast({
      variant: "destructive",
      title: "Lỗi ghi nhận lịch sử",
      description: `Đã cập nhật yêu cầu nhưng không thể ghi lại lịch sử. ${historyError.message}`,
    })
  }

  onSuccess()
  return true
}
