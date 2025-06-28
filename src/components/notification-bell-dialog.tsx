"use client"

import * as React from "react"
import { Bell, AlertTriangle, ArrowLeftRight, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // (Optional) Can be used for a subtitle or general message
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { useRepairAlerts, type RepairAlertItem } from "@/hooks/use-repair-alerts"
import { useTransferAlerts, type TransferAlertItem } from "@/hooks/use-transfer-alerts"
import type { RepairRequestWithEquipment } from "@/app/(app)/repair-requests/page" // Adjust path if needed
import type { TransferRequest } from "@/types/database" // Adjust path if needed

import { NotificationItemCard } from "./notification-item-card" // Assuming it's in the same folder or components/
import { format, parseISO, startOfDay, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"

interface NotificationBellDialogProps {
  allRepairRequests: RepairRequestWithEquipment[] | null | undefined;
  allTransferRequests: TransferRequest[] | null | undefined;
}

// Helper function to get status text and class for due dates (can be moved to a utils file)
const getDueDateInfo = (daysDifference: number, isOverdue: boolean, isUpcoming: boolean, dueDateString?: string | null): { text: string; className: string } => {
  if (isOverdue) return { text: `Quá hạn ${Math.abs(daysDifference)} ngày`, className: "text-red-600 font-semibold" };
  if (isUpcoming) {
    if (daysDifference === 0) return { text: "Đến hạn hôm nay", className: "text-orange-600 font-semibold" };
    return { text: `Còn ${daysDifference} ngày`, className: "text-yellow-600 font-semibold" };
  }
  if (dueDateString) { // Fallback if not overdue/upcoming but has a due date (should not happen with current filter)
      try {
          return { text: format(parseISO(dueDateString), 'dd/MM/yyyy', { locale: vi }), className: "" };
      } catch {
        return { text: "Ngày không hợp lệ", className: "text-gray-500"};
      }
  }
  return { text: "Không có MMHT", className: "text-gray-500" };
};


export function NotificationBellDialog({
  allRepairRequests,
  allTransferRequests,
}: NotificationBellDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const repairAlerts = useRepairAlerts(allRepairRequests);
  const transferAlerts = useTransferAlerts(allTransferRequests);

  const totalAlertsCount = repairAlerts.length + transferAlerts.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {totalAlertsCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 min-w-[1rem] p-0.5 text-xs flex items-center justify-center rounded-full"
            >
              {totalAlertsCount > 9 ? "9+" : totalAlertsCount}
            </Badge>
          )}
          <span className="sr-only">Mở thông báo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] md:max-w-[650px] lg:max-w-[750px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Thông báo và Cảnh báo ({totalAlertsCount})</DialogTitle>
          {/* Optional: <DialogDescription>Xem các cảnh báo quan trọng tại đây.</DialogDescription> */}
        </DialogHeader>

        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Added pr-6 and -mr-6 for better scrollbar spacing */}
          {totalAlertsCount === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Không có thông báo mới.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {repairAlerts.length > 0 && (
                <section>
                  <h3 className="text-md font-semibold mb-2 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-orange-500" />
                    Yêu cầu Sửa chữa ({repairAlerts.length})
                  </h3>
                  <div className="space-y-2">
                    {repairAlerts.map((alert) => {
                      const dueDateInfo = getDueDateInfo(alert.daysDifference, alert.isOverdue, alert.isUpcoming, alert.ngay_mong_muon_hoan_thanh);
                      return (
                        <NotificationItemCard
                          key={`repair-${alert.id}`}
                          id={alert.id}
                          title={`${alert.thiet_bi?.ten_thiet_bi || 'N/A'} (${alert.thiet_bi?.ma_thiet_bi || 'N/A'})`}
                          description={alert.mo_ta_su_co ? `Mô tả: ${alert.mo_ta_su_co}` : undefined}
                          statusText={dueDateInfo.text}
                          statusClassName={dueDateInfo.className}
                          timestamp={alert.ngay_yeu_cau}
                          linkHref={`/(app)/repair-requests/${alert.id}`} // Adjust if your route is different
                          type="repair"
                          details={{ nguoi_yeu_cau: (alert as RepairRequestWithEquipment).nguoi_yeu_cau }}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {transferAlerts.length > 0 && repairAlerts.length > 0 && <Separator className="my-4" />}

              {transferAlerts.length > 0 && (
                <section>
                  <h3 className="text-md font-semibold mb-2 flex items-center">
                    <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
                    Yêu cầu Luân chuyển ({transferAlerts.length})
                  </h3>
                  <div className="space-y-2">
                    {transferAlerts.map((alert) => {
                      const dueDateInfo = getDueDateInfo(alert.daysDifference, alert.isOverdue, alert.isUpcoming, alert.ngay_du_kien_tra);
                      return (
                        <NotificationItemCard
                          key={`transfer-${alert.id}`}
                          id={alert.id}
                          title={`${alert.ma_yeu_cau} - ${alert.thiet_bi?.ten_thiet_bi || 'N/A'}`}
                          description={
                            alert.loai_hinh === 'ben_ngoai'
                            ? `ĐV nhận: ${alert.don_vi_nhan || 'N/A'}`
                            : `Từ: ${alert.khoa_phong_hien_tai || 'N/A'} → Đến: ${alert.khoa_phong_nhan || 'N/A'}`
                          }
                          statusText={dueDateInfo.text}
                          statusClassName={dueDateInfo.className}
                          timestamp={alert.created_at}
                          linkHref={`/(app)/transfers/${alert.id}`} // Adjust if your route is different
                          type="transfer"
                          details={{ nguoi_yeu_cau: (alert as TransferRequest).nguoi_yeu_cau?.full_name || (alert as TransferRequest).nguoi_yeu_cau?.username }}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </ScrollArea>
        {/* Optional: DialogFooter if needed */}
      </DialogContent>
    </Dialog>
  );
}
