import * as React from "react"
import { render, screen } from "@testing-library/react"

jest.mock("lucide-react", () => ({
  CalendarIcon: () => null,
  Clock: () => null,
  Loader2: () => null,
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
  DialogContent: ({ children }: React.PropsWithChildren<{ className?: string }>) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

jest.mock("@/components/ui/form", () => ({
  Form: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  FormControl: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  FormField: ({
    name,
    render,
  }: {
    name: string
    render: (props: { field: { name: string; value: string; onChange: jest.Mock } }) => React.ReactNode
  }) => render({ field: { name, value: "", onChange: jest.fn() } }),
  FormItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  FormLabel: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
  FormMessage: () => null,
}))

jest.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentPropsWithoutRef<"input">) => <input {...props} />,
}))

jest.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.ComponentPropsWithoutRef<"textarea">) => <textarea {...props} />,
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: React.PropsWithChildren<{ onValueChange?: (value: string) => void; value?: string }>) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren<{ value: string }>) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

jest.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: (...args: unknown[]) => unknown) => (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.()
      return fn({})
    },
    reset: jest.fn(),
  }),
}))

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => undefined,
}))

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      full_name: "Người dùng test",
    },
  }),
}))

jest.mock("@/hooks/use-usage-logs", () => ({
  useStartUsageSession: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useEndUsageSession: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}))

import { EndUsageDialog, endUsageSchema } from "@/components/end-usage-dialog"
import { StartUsageDialog } from "@/components/start-usage-dialog"

describe("usage session dialogs", () => {
  const equipment = {
    id: 1,
    ma_thiet_bi: "TB-001",
    ten_thiet_bi: "Máy xét nghiệm",
    tinh_trang_hien_tai: "Hoạt động",
  }

  const usageLog = {
    id: 1,
    thiet_bi_id: 1,
    thoi_gian_bat_dau: "2026-04-10T08:00:00.000Z",
    trang_thai: "dang_su_dung",
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
    thiet_bi: equipment,
    nguoi_su_dung: {
      full_name: "Người dùng test",
    },
  }

  it("does not ask for equipment condition when starting usage", () => {
    render(
      <StartUsageDialog
        open
        onOpenChange={jest.fn()}
        equipment={equipment as never}
      />,
    )

    expect(screen.queryByText("Tình trạng thiết bị")).toBeNull()
    expect(screen.getByText("Ghi chú")).toBeTruthy()
  })

  it("still asks for equipment condition when ending usage", () => {
    render(
      <EndUsageDialog
        open
        onOpenChange={jest.fn()}
        usageLog={usageLog as never}
      />,
    )

    expect(screen.getByText("Tình trạng thiết bị sau khi sử dụng")).toBeTruthy()
  })

  it("requires equipment condition when ending usage", () => {
    expect(endUsageSchema.safeParse({ tinh_trang_thiet_bi: "", ghi_chu: "" }).success).toBe(false)
    expect(endUsageSchema.safeParse({ tinh_trang_thiet_bi: "   ", ghi_chu: "" }).success).toBe(false)
    expect(endUsageSchema.safeParse({ tinh_trang_thiet_bi: "Hoạt động tốt", ghi_chu: "" }).success).toBe(true)
  })
})
