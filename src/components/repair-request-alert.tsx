"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
// Kiểu dữ liệu RepairRequestWithEquipment cần được import hoặc định nghĩa ở đây nếu dùng chung
// Tạm thời định nghĩa lại một phần để component độc lập, hoặc có thể import từ types/database nếu nó được export
// Giả sử nó đã được export từ src/app/(app)/repair-requests/page.tsx hoặc src/types/database.ts
// For now, let's assume a simplified version or that it will be imported.

// Đây là kiểu dữ liệu được suy ra từ `src/app/(app)/repair-requests/page.tsx`
// Nếu bạn có định nghĩa chung, hãy import nó.
interface RepairRequest {
  id: number;
  ngay_mong_muon_hoan_thanh: string | null;
  trang_thai: string;
  // Thêm các trường khác nếu cần để hiển thị hoặc link tới yêu cầu
  thiet_bi?: {
    ten_thiet_bi?: string | null;
  } | null;
  mo_ta_su_co?: string;
}

interface RepairRequestAlertProps {
  requests: RepairRequest[];
  // Optional: Callback để xử lý khi người dùng muốn xem chi tiết các yêu cầu này
  // onViewDetails?: (overdueRequestIds: number[]) => void;
}

// Các trạng thái được coi là chưa hoàn thành
const UNCOMPLETED_STATUSES = ['Chờ xử lý', 'Đã duyệt'];
// Có thể thêm các trạng thái khác như 'Đang sửa chữa', 'Chờ linh kiện' nếu có

export function RepairRequestAlert({ requests /*, onViewDetails */ }: RepairRequestAlertProps) {
  const today = startOfDay(new Date());

  const overdueAndUpcomingRequests = React.useMemo(() => {
    if (!requests || requests.length === 0) {
      return [];
    }
    return requests.filter(req => {
      if (!UNCOMPLETED_STATUSES.includes(req.trang_thai)) {
        return false; // Bỏ qua nếu đã hoàn thành hoặc ở trạng thái không cần cảnh báo
      }
      if (!req.ngay_mong_muon_hoan_thanh) {
        return false; // Bỏ qua nếu không có ngày mong muốn
      }
      try {
        const dueDate = startOfDay(parseISO(req.ngay_mong_muon_hoan_thanh));
        const daysDifference = differenceInDays(dueDate, today);

        // Quá hạn (daysDifference < 0) hoặc sắp đến hạn trong vòng 7 ngày (0 <= daysDifference <= 7)
        return daysDifference <= 7;
      } catch (error) {
        console.error("Invalid date format for ngay_mong_muon_hoan_thanh:", req.ngay_mong_muon_hoan_thanh, error);
        return false;
      }
    });
  }, [requests, today]);

  if (overdueAndUpcomingRequests.length === 0) {
    return null; // Không hiển thị gì nếu không có yêu cầu nào thỏa mãn
  }

  const count = overdueAndUpcomingRequests.length;
  const message = `Có ${count} yêu cầu sửa chữa sắp đến hạn (trong vòng 7 ngày) hoặc đã quá hạn cần được chú ý.`;

  // Optional: Chuẩn bị list ID để truyền cho onViewDetails
  // const requestIds = overdueAndUpcomingRequests.map(req => req.id);

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Cảnh báo quan trọng!</AlertTitle>
      <AlertDescription>
        {message}
        {/* {onViewDetails && (
          <Button
            variant="link"
            className="p-0 h-auto ml-2 text-white hover:text-white/80"
            onClick={() => onViewDetails(requestIds)}
          >
            Xem chi tiết
          </Button>
        )} */}
      </AlertDescription>
    </Alert>
  );
}
