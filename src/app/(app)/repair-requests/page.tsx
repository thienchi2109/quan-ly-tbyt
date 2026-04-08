"use client"

import * as React from "react"

import { RepairRequestAlert } from "@/components/repair-request-alert"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"

import { RepairRequestCreateSheet } from "./_components/repair-request-create-sheet"
import { RepairRequestDialogs } from "./_components/repair-request-dialogs"
import { RepairRequestListSection } from "./_components/repair-request-list-section"
import { useRepairRequestCreateForm } from "./_hooks/use-repair-request-create-form"
import { useRepairRequestData } from "./_hooks/use-repair-request-data"
import { useRepairRequestDialogs } from "./_hooks/use-repair-request-dialogs"
import { useRepairRequestTable } from "./_hooks/use-repair-request-table"
import { canManageRepairRequests } from "./_lib/repair-request-permissions"
import { openRepairRequestSheet } from "./_lib/repair-request-print"

export default function RepairRequestsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const canSetRepairUnit = canManageRepairRequests(user)

  const data = useRepairRequestData({ user, toast })
  const dialogs = useRepairRequestDialogs({
    user,
    canSetRepairUnit,
    toast,
    onSuccess: data.invalidateCacheAndRefetch,
  })
  const createForm = useRepairRequestCreateForm({
    user,
    canSetRepairUnit,
    allEquipment: data.allEquipment,
    toast,
    onSuccess: data.invalidateCacheAndRefetch,
  })

  const handleGenerateRequestSheet = React.useCallback(
    (request: (typeof data.requests)[number]) => {
      if (!openRepairRequestSheet(request)) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể mở phiếu yêu cầu sửa chữa.",
        })
      }
    },
    [toast],
  )

  const actions = {
    onGenerateRequestSheet: handleGenerateRequestSheet,
    onEdit: dialogs.onOpenEdit,
    onDelete: dialogs.onOpenDelete,
    onApprove: dialogs.onApprove,
    onCompletion: dialogs.onCompletion,
  }

  const tableState = useRepairRequestTable({
    requests: data.requests,
    user,
    actions,
  })

  return (
    <>
      <RepairRequestDialogs
        controller={dialogs}
        canSetRepairUnit={canSetRepairUnit}
      />
      <RepairRequestAlert requests={data.requests} />

      <div className="animate-in slide-in-from-bottom-4 fade-in space-y-6 pb-10 duration-500">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Yêu cầu sửa chữa
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Quản lý danh sách và tiến độ các yêu cầu sửa chữa thiết bị.
            </p>
          </div>

          <RepairRequestCreateSheet
            controller={createForm}
            user={user}
            canSetRepairUnit={canSetRepairUnit}
          />
        </div>

        <RepairRequestListSection
          table={tableState.table}
          requests={data.requests}
          isLoading={data.isLoading}
          isMobile={isMobile}
          user={user}
          actions={actions}
          searchTerm={tableState.searchTerm}
          onSearchTermChange={tableState.setSearchTerm}
          isFiltered={tableState.isFiltered}
          columnsCount={tableState.columnsCount}
          onOpenRequest={dialogs.onOpenView}
        />
      </div>
    </>
  )
}
