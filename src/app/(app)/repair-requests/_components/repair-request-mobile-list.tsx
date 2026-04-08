"use client"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { User } from "@/types/database"

import type { RepairRequestRowActions } from "../_hooks/types"
import { canManageRepairRequests } from "../_lib/repair-request-permissions"
import { getRepairRequestStatusVariant } from "../constants"
import type { RepairRequestWithEquipment } from "../types"
import { RepairDeadlineProgress } from "./repair-deadline-progress"
import { RepairRequestActionsMenu } from "./repair-request-actions-menu"

interface RepairRequestMobileListProps {
  requests: RepairRequestWithEquipment[]
  user: User | null | undefined
  actions: RepairRequestRowActions
  onOpenRequest: (request: RepairRequestWithEquipment) => void
}

export function RepairRequestMobileList({
  requests,
  user,
  actions,
  onOpenRequest,
}: RepairRequestMobileListProps) {
  const canManage = canManageRepairRequests(user)

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card
          key={request.id}
          className="mobile-repair-card cursor-pointer hover:bg-muted/50"
          onClick={() => onOpenRequest(request)}
        >
          <CardHeader className="mobile-repair-card-header flex flex-row items-start justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <CardTitle className="mobile-repair-card-title truncate line-clamp-1">
                {request.thiet_bi?.ten_thiet_bi || "N/A"}
              </CardTitle>
              <CardDescription className="mobile-repair-card-description truncate">
                {request.thiet_bi?.ma_thiet_bi || "N/A"}
              </CardDescription>
            </div>
            <div
              className="flex-shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <RepairRequestActionsMenu
                request={request}
                visible={!!user}
                canManage={canManage}
                onGenerateRequestSheet={actions.onGenerateRequestSheet}
                onEdit={actions.onEdit}
                onDelete={actions.onDelete}
                onApprove={actions.onApprove}
                onCompletion={actions.onCompletion}
              />
            </div>
          </CardHeader>
          <CardContent className="mobile-repair-card-content">
            {request.nguoi_yeu_cau && (
              <div className="mobile-repair-card-field">
                <span className="mobile-repair-card-label">Người yêu cầu</span>
                <span className="mobile-repair-card-value">
                  {request.nguoi_yeu_cau}
                </span>
              </div>
            )}

            <div className="mobile-repair-card-field">
              <span className="mobile-repair-card-label">Ngày yêu cầu</span>
              <span className="mobile-repair-card-value">
                {format(parseISO(request.ngay_yeu_cau), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>

            {request.ngay_mong_muon_hoan_thanh && (
              <div className="space-y-2">
                <div className="mobile-repair-card-field">
                  <span className="mobile-repair-card-label">
                    Ngày mong muốn HT
                  </span>
                  <span className="mobile-repair-card-value">
                    {format(
                      parseISO(request.ngay_mong_muon_hoan_thanh),
                      "dd/MM/yyyy",
                      { locale: vi },
                    )}
                  </span>
                </div>
                <RepairDeadlineProgress
                  desiredDate={request.ngay_mong_muon_hoan_thanh}
                  requestStatus={request.trang_thai}
                />
              </div>
            )}

            <div className="mobile-repair-card-field">
              <span className="mobile-repair-card-label">Trạng thái</span>
              <Badge
                variant={getRepairRequestStatusVariant(request.trang_thai)}
                className="text-xs"
              >
                {request.trang_thai}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="mobile-repair-card-label">Mô tả sự cố:</span>
              <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">
                {request.mo_ta_su_co}
              </p>
            </div>

            {request.hang_muc_sua_chua && (
              <div className="space-y-1">
                <span className="mobile-repair-card-label">
                  Hạng mục sửa chữa:
                </span>
                <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">
                  {request.hang_muc_sua_chua}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
