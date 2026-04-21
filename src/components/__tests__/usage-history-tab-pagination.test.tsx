import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

const fetchNextPage = jest.fn()
const useEquipmentUsageLogs = jest.fn()

jest.mock("lucide-react", () => ({
  ArrowDown: () => null,
  Clock: () => null,
  FileText: () => null,
  Loader2: () => null,
  Play: () => null,
  Square: () => null,
  Trash2: () => null,
  User: () => null,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props}>{children}</button>
  ),
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div />,
}))

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: React.PropsWithChildren) => <table>{children}</table>,
  TableBody: ({ children }: React.PropsWithChildren) => <tbody>{children}</tbody>,
  TableCell: ({ children }: React.PropsWithChildren) => <td>{children}</td>,
  TableHead: ({ children }: React.PropsWithChildren) => <th>{children}</th>,
  TableHeader: ({ children }: React.PropsWithChildren) => <thead>{children}</thead>,
  TableRow: ({ children }: React.PropsWithChildren) => <tr>{children}</tr>,
}))

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogAction: ({ children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
  AlertDialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: React.PropsWithChildren<{ asChild?: boolean }>) => <>{children}</>,
}))

jest.mock("@/hooks/use-usage-logs", () => ({
  useActiveEquipmentUsageLog: () => ({
    data: null,
  }),
  useDeleteUsageLog: () => ({
    mutateAsync: jest.fn(),
  }),
  useEquipmentUsageLogs: (...args: unknown[]) => useEquipmentUsageLogs(...args),
}))

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      role: "user",
    },
  }),
}))

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}))

jest.mock("@/components/start-usage-dialog", () => ({
  StartUsageDialog: () => null,
}))

jest.mock("@/components/end-usage-dialog", () => ({
  EndUsageDialog: () => null,
}))

jest.mock("@/components/usage-log-print", () => ({
  UsageLogPrint: () => null,
}))

import { UsageHistoryTab } from "@/components/usage-history-tab"

const equipment = {
  id: 1,
  ma_thiet_bi: "TB-001",
  ten_thiet_bi: "Máy xét nghiệm",
}

const usageLogs = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  thiet_bi_id: 1,
  nguoi_su_dung_id: 2,
  thoi_gian_bat_dau: new Date(Date.UTC(2026, 3, index + 1, 8)).toISOString(),
  thoi_gian_ket_thuc: new Date(Date.UTC(2026, 3, index + 1, 9)).toISOString(),
  tinh_trang_thiet_bi: "Hoạt động tốt",
  ghi_chu: "",
  trang_thai: "hoan_thanh",
  nguoi_su_dung: {
    full_name: `Người dùng ${index + 1}`,
  },
}))

describe("UsageHistoryTab pagination", () => {
  beforeEach(() => {
    fetchNextPage.mockReset()
    useEquipmentUsageLogs.mockReset()
    useEquipmentUsageLogs.mockReturnValue({
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      usageLogs,
    })
  })

  it("passes sort order to the server-side paginated usage log query", () => {
    render(<UsageHistoryTab equipment={equipment as never} />)

    expect(useEquipmentUsageLogs).toHaveBeenLastCalledWith("1", "newest")

    fireEvent.click(screen.getByRole("button", { name: "Mới nhất trước" }))

    expect(useEquipmentUsageLogs).toHaveBeenLastCalledWith("1", "oldest")
  })

  it("loads the next server page when clicking Xem thêm", () => {
    render(<UsageHistoryTab equipment={equipment as never} />)

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })
})
