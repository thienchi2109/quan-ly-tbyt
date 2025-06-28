"use client" // Vì sử dụng Date, có thể không cần nếu logic thuần túy

import * as React from "react"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
// Import kiểu RepairRequestWithEquipment từ nơi nó được định nghĩa và export
// Ví dụ: import type { RepairRequestWithEquipment } from "@/app/(app)/repair-requests/page";
// Hoặc từ "@/types/database" nếu bạn đã chuyển nó ra đó
// Tạm thời giả định nó sẽ được cung cấp đúng kiểu khi sử dụng hook.
// Để hook này độc lập hơn, ta có thể định nghĩa một kiểu cơ bản mà nó cần:
interface MinimalRepairRequest {
  id: number;
  ngay_mong_muon_hoan_thanh: string | null;
  trang_thai: string;
  // Các trường khác có thể thêm vào đây nếu hook cần xử lý dựa trên chúng
  // Ví dụ: thiet_bi?: { ten_thiet_bi?: string | null; ma_thiet_bi?: string | null }
}

// Các trạng thái được coi là chưa hoàn thành
const UNCOMPLETED_REPAIR_STATUSES = ['Chờ xử lý', 'Đã duyệt'];
// Có thể thêm các trạng thái khác như 'Đang sửa chữa', 'Chờ linh kiện' nếu có

export interface RepairAlertItem extends MinimalRepairRequest {
  daysDifference: number; // Số ngày chênh lệch so với hôm nay (âm là quá hạn, dương là còn lại)
  isOverdue: boolean;
  isUpcoming: boolean;
}

export function useRepairAlerts<T extends MinimalRepairRequest>(
  allRepairRequests: T[] | null | undefined
): RepairAlertItem[] {
  const today = startOfDay(new Date());

  const alertableRequests = React.useMemo(() => {
    if (!allRepairRequests || allRepairRequests.length === 0) {
      return [];
    }

    const filteredAndProcessed: RepairAlertItem[] = [];

    allRepairRequests.forEach(req => {
      if (!UNCOMPLETED_REPAIR_STATUSES.includes(req.trang_thai)) {
        return; // Bỏ qua nếu đã hoàn thành hoặc ở trạng thái không cần cảnh báo
      }
      if (!req.ngay_mong_muon_hoan_thanh) {
        return; // Bỏ qua nếu không có ngày mong muốn
      }
      try {
        const dueDate = startOfDay(parseISO(req.ngay_mong_muon_hoan_thanh));
        const daysDifference = differenceInDays(dueDate, today);

        const isOverdue = daysDifference < 0;
        // Sắp đến hạn: từ hôm nay (diff=0) đến 7 ngày tới (diff=7)
        const isUpcoming = daysDifference >= 0 && daysDifference <= 7;

        if (isOverdue || isUpcoming) {
          filteredAndProcessed.push({
            ...req, // Giữ lại tất cả các trường của T
            daysDifference,
            isOverdue,
            isUpcoming,
          });
        }
      } catch (error) {
        console.error("Invalid date format for repair request ngay_mong_muon_hoan_thanh:", req.ngay_mong_muon_hoan_thanh, req.id, error);
      }
    });

    // Sắp xếp: quá hạn lên trước, sau đó đến gần hạn nhất
    return filteredAndProcessed.sort((a, b) => a.daysDifference - b.daysDifference);

  }, [allRepairRequests, today]);

  return alertableRequests;
}
