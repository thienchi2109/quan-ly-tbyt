"use client"

import type { RepairRequestDialogsController } from "../_hooks/types"
import { RepairRequestApproveDialog } from "./dialogs/repair-request-approve-dialog"
import { RepairRequestCompletionDialog } from "./dialogs/repair-request-completion-dialog"
import { RepairRequestDeleteDialog } from "./dialogs/repair-request-delete-dialog"
import { RepairRequestDetailsDialog } from "./dialogs/repair-request-details-dialog"
import { RepairRequestEditDialog } from "./dialogs/repair-request-edit-dialog"

interface RepairRequestDialogsProps {
  controller: RepairRequestDialogsController
  canSetRepairUnit: boolean
}

export function RepairRequestDialogs({
  controller,
  canSetRepairUnit,
}: RepairRequestDialogsProps) {
  return (
    <>
      <RepairRequestEditDialog
        controller={controller}
        canSetRepairUnit={canSetRepairUnit}
      />
      <RepairRequestDeleteDialog controller={controller} />
      <RepairRequestApproveDialog controller={controller} />
      <RepairRequestCompletionDialog controller={controller} />
      <RepairRequestDetailsDialog controller={controller} />
    </>
  )
}
