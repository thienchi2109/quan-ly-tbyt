import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

jest.mock("lucide-react", () => ({
  Calendar: () => null,
  Download: () => null,
  Filter: () => null,
  Printer: () => null,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentPropsWithoutRef<"input">) => <input {...props} />,
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: React.ComponentPropsWithoutRef<"label">) => (
    <label {...props}>{children}</label>
  ),
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

jest.mock("@/lib/usage-log-display", () => ({
  USAGE_LOG_SORT_LABELS: {
    newest: "Mới nhất",
    oldest: "Cũ nhất",
  },
  getVisibleUsageLogs: (usageLogs: unknown[]) => usageLogs,
}))

import { UsageLogPrint } from "@/components/usage-log-print"

describe("UsageLogPrint", () => {
  const equipment = {
    ten_thiet_bi: "Máy xét nghiệm",
    ma_thiet_bi: "TB-001",
    khoa_phong_quan_ly: "Khoa XN",
    hang_san_xuat: "Hãng A",
    model: "Model B",
    tinh_trang_hien_tai: "Hoạt động",
    nguoi_dang_truc_tiep_quan_ly: "Nguyễn Văn A",
  }

  const createUsageLog = (index: number) => ({
    thoi_gian_bat_dau: "2026-04-10T08:00:00.000Z",
    thoi_gian_ket_thuc: "2026-04-10T09:00:00.000Z",
    trang_thai: "hoan_thanh",
    ghi_chu: `Ghi chú ${index}`,
    nguoi_su_dung: {
      full_name: `Người dùng ${index}`,
    },
  })

  const usageLogs = [createUsageLog(1)]

  it("prints without closing the print window immediately", () => {
    const openDocument = jest.fn()
    const writeDocument = jest.fn()
    const closeDocument = jest.fn()
    const focus = jest.fn()
    const print = jest.fn()
    const close = jest.fn()
    const popupOnLoad: { current?: (event: Event) => void } = {}
    const popup: Partial<Window> = {
      document: {
        open: openDocument,
        write: writeDocument,
        close: closeDocument,
      } as unknown as Document,
      focus,
      print,
      close,
    }
    Object.defineProperty(popup, "onload", {
      get: () => popupOnLoad.current,
      set: (value) => {
        popupOnLoad.current = value as (event: Event) => void
      },
    })
    const mockOpen = jest.spyOn(window, "open").mockReturnValue(popup as Window)

    render(
      <UsageLogPrint
        equipment={equipment as never}
        sortOrder="newest"
        usageLogs={usageLogs as never}
      />,
    )

    const printButtons = screen.getAllByRole("button", { name: "In báo cáo" })
    fireEvent.click(printButtons[1])

    expect(mockOpen).toHaveBeenCalledWith("", "_blank")
    expect(openDocument).toHaveBeenCalledTimes(1)
    expect(writeDocument).toHaveBeenCalledTimes(1)
    expect(writeDocument.mock.calls[0][0]).toContain("/cdc-logo-400x400.png")
    expect(writeDocument.mock.calls[0][0]).toContain(".data-table td:nth-child(1) { width: 4%; }")
    expect(writeDocument.mock.calls[0][0]).toContain("<th>Tình trạng thiết bị</th>")
    expect(writeDocument.mock.calls[0][0]).not.toContain("<th>Trạng thái</th>")
    expect(closeDocument).toHaveBeenCalledTimes(1)
    expect(focus).not.toHaveBeenCalled()
    expect(print).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()

    popupOnLoad.current?.(new Event("load"))

    expect(focus).toHaveBeenCalledTimes(1)
    expect(print).toHaveBeenCalledTimes(1)

    mockOpen.mockRestore()
  })

  it("renders explicit paginated footers instead of CSS counters", () => {
    const writeDocument = jest.fn()
    const mockOpen = jest.spyOn(window, "open").mockReturnValue({
      document: {
        open: jest.fn(),
        write: writeDocument,
        close: jest.fn(),
      },
      focus: jest.fn(),
      print: jest.fn(),
      close: jest.fn(),
    } as unknown as Window)

    render(
      <UsageLogPrint
        equipment={equipment as never}
        sortOrder="newest"
        usageLogs={Array.from({ length: 16 }, (_, index) => createUsageLog(index + 1)) as never}
      />,
    )

    const printButtons = screen.getAllByRole("button", { name: "In báo cáo" })
    fireEvent.click(printButtons[1])

    const html = writeDocument.mock.calls[0][0] as string

    expect(html).toContain('class="print-page"')
    expect(html).toContain("Trang: 1/2")
    expect(html).toContain("Trang: 2/2")
    expect(html).not.toContain("counter(pages)")
    expect(html).not.toContain("counter(page)")

    mockOpen.mockRestore()
  })
})
