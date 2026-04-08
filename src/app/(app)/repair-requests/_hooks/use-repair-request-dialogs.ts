"use client"

import * as React from "react"
import { parseISO } from "date-fns"

import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types/database"

import {
  approveRepairRequest,
  completeRepairRequest,
  deleteRepairRequest,
  updateRepairRequest,
} from "./repair-request-dialog-mutations"
import type { RepairRequestWithEquipment } from "../types"
import type {
  CompletionType,
  RepairRequestDialogsController,
  RepairUnit,
} from "./types"

type ToastFn = ReturnType<typeof useToast>["toast"]

interface UseRepairRequestDialogsParams {
  user: User | null | undefined
  canSetRepairUnit: boolean
  toast: ToastFn
  onSuccess: () => void
}

export function useRepairRequestDialogs({
  user,
  canSetRepairUnit,
  toast,
  onSuccess,
}: UseRepairRequestDialogsParams): RepairRequestDialogsController {
  const [editingRequest, setEditingRequest] =
    React.useState<RepairRequestWithEquipment | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)
  const [requestToDelete, setRequestToDelete] =
    React.useState<RepairRequestWithEquipment | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [requestToView, setRequestToView] =
    React.useState<RepairRequestWithEquipment | null>(null)
  const [editIssueDescription, setEditIssueDescription] = React.useState("")
  const [editRepairItems, setEditRepairItems] = React.useState("")
  const [editDesiredDate, setEditDesiredDate] = React.useState<Date>()
  const [editRepairUnit, setEditRepairUnit] =
    React.useState<RepairUnit>("noi_bo")
  const [editExternalCompanyName, setEditExternalCompanyName] =
    React.useState("")
  const [requestToApprove, setRequestToApprove] =
    React.useState<RepairRequestWithEquipment | null>(null)
  const [isApproving, setIsApproving] = React.useState(false)
  const [approvalRepairUnit, setApprovalRepairUnit] =
    React.useState<RepairUnit>("noi_bo")
  const [approvalExternalCompanyName, setApprovalExternalCompanyName] =
    React.useState("")
  const [requestToComplete, setRequestToComplete] =
    React.useState<RepairRequestWithEquipment | null>(null)
  const [completionType, setCompletionType] =
    React.useState<CompletionType | null>(null)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [completionResult, setCompletionResult] = React.useState("")
  const [nonCompletionReason, setNonCompletionReason] = React.useState("")

  React.useEffect(() => {
    if (!editingRequest) {
      return
    }

    setEditIssueDescription(editingRequest.mo_ta_su_co)
    setEditRepairItems(editingRequest.hang_muc_sua_chua || "")
    setEditDesiredDate(
      editingRequest.ngay_mong_muon_hoan_thanh
        ? parseISO(editingRequest.ngay_mong_muon_hoan_thanh)
        : undefined,
    )
    setEditRepairUnit(editingRequest.don_vi_thuc_hien || "noi_bo")
    setEditExternalCompanyName(editingRequest.ten_don_vi_thue || "")
  }, [editingRequest])

  const handleApprove = React.useCallback(
    (request: RepairRequestWithEquipment) => {
      setRequestToApprove(request)
      setApprovalRepairUnit("noi_bo")
      setApprovalExternalCompanyName("")
    },
    [],
  )

  const handleCompletion = React.useCallback(
    (request: RepairRequestWithEquipment, status: CompletionType) => {
      setRequestToComplete(request)
      setCompletionType(status)
      setCompletionResult("")
      setNonCompletionReason("")
    },
    [],
  )

  const handleUpdateRequest = React.useCallback(async () => {
    if (!editingRequest) {
      return
    }

    setIsEditSubmitting(true)
    const success = await updateRepairRequest({
      editingRequest,
      editIssueDescription,
      editRepairItems,
      editDesiredDate,
      canSetRepairUnit,
      editRepairUnit,
      editExternalCompanyName,
      toast,
      onSuccess,
    })
    if (success) {
      setEditingRequest(null)
    }
    setIsEditSubmitting(false)
  }, [
    canSetRepairUnit,
    editDesiredDate,
    editExternalCompanyName,
    editIssueDescription,
    editRepairItems,
    editRepairUnit,
    editingRequest,
    onSuccess,
    toast,
  ])

  const handleDeleteRequest = React.useCallback(async () => {
    if (!requestToDelete) {
      return
    }

    setIsDeleting(true)
    const success = await deleteRepairRequest({
      requestToDelete,
      toast,
      onSuccess,
    })
    if (success) {
      setRequestToDelete(null)
    }
    setIsDeleting(false)
  }, [onSuccess, requestToDelete, toast])

  const handleConfirmApproval = React.useCallback(async () => {
    if (!requestToApprove) {
      return
    }

    setIsApproving(true)
    const success = await approveRepairRequest({
      requestToApprove,
      approvalRepairUnit,
      approvalExternalCompanyName,
      user,
      toast,
      onSuccess,
    })
    if (success) {
      setRequestToApprove(null)
      setApprovalRepairUnit("noi_bo")
      setApprovalExternalCompanyName("")
    }
    setIsApproving(false)
  }, [
    approvalExternalCompanyName,
    approvalRepairUnit,
    onSuccess,
    requestToApprove,
    toast,
    user,
  ])

  const handleConfirmCompletion = React.useCallback(async () => {
    if (!requestToComplete || !completionType) {
      return
    }

    setIsCompleting(true)
    const success = await completeRepairRequest({
      requestToComplete,
      completionType,
      completionResult,
      nonCompletionReason,
      user,
      toast,
      onSuccess,
    })
    if (success) {
      setRequestToComplete(null)
      setCompletionType(null)
      setCompletionResult("")
      setNonCompletionReason("")
    }
    setIsCompleting(false)
  }, [
    completionResult,
    completionType,
    nonCompletionReason,
    onSuccess,
    requestToComplete,
    toast,
    user,
  ])

  return {
    editingRequest,
    onEditingRequestChange: setEditingRequest,
    editIssueDescription,
    onEditIssueDescriptionChange: setEditIssueDescription,
    editRepairItems,
    onEditRepairItemsChange: setEditRepairItems,
    editDesiredDate,
    onEditDesiredDateChange: setEditDesiredDate,
    editRepairUnit,
    onEditRepairUnitChange: setEditRepairUnit,
    editExternalCompanyName,
    onEditExternalCompanyNameChange: setEditExternalCompanyName,
    isEditSubmitting,
    onUpdateRequest: handleUpdateRequest,
    requestToDelete,
    onRequestToDeleteChange: setRequestToDelete,
    isDeleting,
    onDeleteRequest: handleDeleteRequest,
    requestToApprove,
    onRequestToApproveChange: setRequestToApprove,
    isApproving,
    approvalRepairUnit,
    onApprovalRepairUnitChange: setApprovalRepairUnit,
    approvalExternalCompanyName,
    onApprovalExternalCompanyNameChange: setApprovalExternalCompanyName,
    onApprove: handleApprove,
    onConfirmApproval: handleConfirmApproval,
    requestToComplete,
    onRequestToCompleteChange: setRequestToComplete,
    completionType,
    isCompleting,
    completionResult,
    onCompletionResultChange: setCompletionResult,
    nonCompletionReason,
    onNonCompletionReasonChange: setNonCompletionReason,
    onCompletion: handleCompletion,
    onConfirmCompletion: handleConfirmCompletion,
    requestToView,
    onRequestToViewChange: setRequestToView,
    onOpenEdit: setEditingRequest,
    onOpenDelete: setRequestToDelete,
    onOpenView: setRequestToView,
  }
}
