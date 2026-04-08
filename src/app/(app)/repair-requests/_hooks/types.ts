import type * as React from "react"

import type { User } from "@/types/database"

import type { EquipmentSelectItem, RepairRequestWithEquipment } from "../types"

export type RepairUnit = "noi_bo" | "thue_ngoai"
export type CompletionType = "Hoàn thành" | "Không HT"

export interface RepairRequestRowActions {
  onGenerateRequestSheet: (request: RepairRequestWithEquipment) => void
  onEdit: (request: RepairRequestWithEquipment) => void
  onDelete: (request: RepairRequestWithEquipment) => void
  onApprove: (request: RepairRequestWithEquipment) => void
  onCompletion: (
    request: RepairRequestWithEquipment,
    status: CompletionType,
  ) => void
}

export interface RepairRequestCreateFormController {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (event: React.FormEvent) => void
  searchQuery: string
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
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
  repairUnit: RepairUnit
  onRepairUnitChange: (value: RepairUnit) => void
  externalCompanyName: string
  onExternalCompanyNameChange: (value: string) => void
  isSubmitting: boolean
}

export interface RepairRequestDialogsController {
  editingRequest: RepairRequestWithEquipment | null
  onEditingRequestChange: (request: RepairRequestWithEquipment | null) => void
  editIssueDescription: string
  onEditIssueDescriptionChange: (value: string) => void
  editRepairItems: string
  onEditRepairItemsChange: (value: string) => void
  editDesiredDate?: Date
  onEditDesiredDateChange: (date: Date | undefined) => void
  editRepairUnit: RepairUnit
  onEditRepairUnitChange: (value: RepairUnit) => void
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
  approvalRepairUnit: RepairUnit
  onApprovalRepairUnitChange: (value: RepairUnit) => void
  approvalExternalCompanyName: string
  onApprovalExternalCompanyNameChange: (value: string) => void
  onApprove: (request: RepairRequestWithEquipment) => void
  onConfirmApproval: () => void
  requestToComplete: RepairRequestWithEquipment | null
  onRequestToCompleteChange: (request: RepairRequestWithEquipment | null) => void
  completionType: CompletionType | null
  isCompleting: boolean
  completionResult: string
  onCompletionResultChange: (value: string) => void
  nonCompletionReason: string
  onNonCompletionReasonChange: (value: string) => void
  onCompletion: (
    request: RepairRequestWithEquipment,
    status: CompletionType,
  ) => void
  onConfirmCompletion: () => void
  requestToView: RepairRequestWithEquipment | null
  onRequestToViewChange: (request: RepairRequestWithEquipment | null) => void
  onOpenEdit: (request: RepairRequestWithEquipment) => void
  onOpenDelete: (request: RepairRequestWithEquipment) => void
  onOpenView: (request: RepairRequestWithEquipment) => void
}

export interface RepairRequestRouteUserProps {
  user: User | null | undefined
  canSetRepairUnit: boolean
}
