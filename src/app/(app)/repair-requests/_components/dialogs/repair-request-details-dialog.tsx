"use client"

import type { ReactNode } from "react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import type { RepairRequestDialogsController } from "../../_hooks/types"
import { getRepairRequestStatusVariant } from "../../constants"
import { RepairRequestSheetFrame } from "../repair-request-sheet-frame"

interface RepairRequestDetailsDialogProps {
  controller: RepairRequestDialogsController
}

function InfoField({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function RepairRequestDetailsDialog({
  controller,
}: RepairRequestDetailsDialogProps) {
  const { requestToView } = controller

  if (!requestToView) {
    return null
  }

  return (
    <RepairRequestSheetFrame
      open={!!requestToView}
      onOpenChange={(open) => !open && controller.onRequestToViewChange(null)}
      title={<span className="text-lg font-semibold">Chi tiết yêu cầu sửa chữa</span>}
      description="Thông tin chi tiết về yêu cầu sửa chữa thiết bị"
      contentClassName="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl"
      footer={
        <Button
          variant="outline"
          onClick={() => controller.onRequestToViewChange(null)}
        >
          Đóng
        </Button>
      }
    >
        <div className="space-y-6 py-4 pr-1">
          <div className="space-y-3">
            <h3 className="border-b pb-2 text-base font-semibold text-foreground">
              Thông tin thiết bị
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoField
                label="Tên thiết bị"
                value={requestToView.thiet_bi?.ten_thiet_bi || "N/A"}
              />
              <InfoField
                label="Mã thiết bị"
                value={requestToView.thiet_bi?.ma_thiet_bi || "N/A"}
              />
              <InfoField
                label="Model"
                value={requestToView.thiet_bi?.model || "N/A"}
              />
              <InfoField
                label="Serial"
                value={requestToView.thiet_bi?.serial || "N/A"}
              />
              <div className="md:col-span-2">
                <InfoField
                  label="Khoa/Phòng quản lý"
                  value={requestToView.thiet_bi?.khoa_phong_quan_ly || "N/A"}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="border-b pb-2 text-base font-semibold text-foreground">
              Thông tin yêu cầu
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoField
                label="Trạng thái"
                value={
                  <Badge
                    variant={getRepairRequestStatusVariant(requestToView.trang_thai)}
                    className="w-fit"
                  >
                    {requestToView.trang_thai}
                  </Badge>
                }
              />
              <InfoField
                label="Ngày yêu cầu"
                value={format(parseISO(requestToView.ngay_yeu_cau), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              />
              <InfoField
                label="Người yêu cầu"
                value={requestToView.nguoi_yeu_cau || "N/A"}
              />
              {requestToView.ngay_mong_muon_hoan_thanh && (
                <InfoField
                  label="Ngày mong muốn hoàn thành"
                  value={format(
                    parseISO(requestToView.ngay_mong_muon_hoan_thanh),
                    "dd/MM/yyyy",
                    { locale: vi },
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Mô tả sự cố
              </Label>
              <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                {requestToView.mo_ta_su_co}
              </div>
            </div>

            {requestToView.hang_muc_sua_chua && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Hạng mục sửa chữa
                </Label>
                <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                  {requestToView.hang_muc_sua_chua}
                </div>
              </div>
            )}
          </div>

          {(requestToView.don_vi_thuc_hien || requestToView.ten_don_vi_thue) && (
            <div className="space-y-3">
              <h3 className="border-b pb-2 text-base font-semibold text-foreground">
                Thông tin thực hiện
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {requestToView.don_vi_thuc_hien && (
                  <InfoField
                    label="Đơn vị thực hiện"
                    value={
                      <Badge variant="outline" className="w-fit">
                        {requestToView.don_vi_thuc_hien === "noi_bo"
                          ? "Nội bộ"
                          : "Thuê ngoài"}
                      </Badge>
                    }
                  />
                )}
                {requestToView.ten_don_vi_thue && (
                  <InfoField
                    label="Tên đơn vị thuê"
                    value={requestToView.ten_don_vi_thue}
                  />
                )}
              </div>
            </div>
          )}

          {(requestToView.ngay_duyet || requestToView.nguoi_duyet) && (
            <div className="space-y-3">
              <h3 className="border-b pb-2 text-base font-semibold text-foreground">
                Thông tin phê duyệt
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {requestToView.nguoi_duyet && (
                  <InfoField
                    label="Người duyệt"
                    value={requestToView.nguoi_duyet}
                  />
                )}
                {requestToView.ngay_duyet && (
                  <InfoField
                    label="Ngày duyệt"
                    value={format(parseISO(requestToView.ngay_duyet), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  />
                )}
              </div>
            </div>
          )}

          {(requestToView.ngay_hoan_thanh ||
            requestToView.ket_qua_sua_chua ||
            requestToView.ly_do_khong_hoan_thanh ||
            requestToView.nguoi_xac_nhan) && (
            <div className="space-y-3">
              <h3 className="border-b pb-2 text-base font-semibold text-foreground">
                Thông tin hoàn thành
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {requestToView.nguoi_xac_nhan && (
                  <InfoField
                    label="Người xác nhận"
                    value={requestToView.nguoi_xac_nhan}
                  />
                )}
                {requestToView.ngay_hoan_thanh && (
                  <InfoField
                    label="Ngày hoàn thành"
                    value={format(
                      parseISO(requestToView.ngay_hoan_thanh),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )}
                  />
                )}
              </div>

              {requestToView.ket_qua_sua_chua && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Kết quả sửa chữa
                  </Label>
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm whitespace-pre-wrap">
                    {requestToView.ket_qua_sua_chua}
                  </div>
                </div>
              )}

              {requestToView.ly_do_khong_hoan_thanh && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Lý do không hoàn thành
                  </Label>
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-wrap">
                    {requestToView.ly_do_khong_hoan_thanh}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

    </RepairRequestSheetFrame>
  )
}
