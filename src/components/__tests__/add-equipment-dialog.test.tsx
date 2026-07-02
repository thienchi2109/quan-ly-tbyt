import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { AddEquipmentDialog } from "@/components/add-equipment-dialog"
import type { EquipmentFormValues } from "@/components/equipment-form-dialog-shared"

const toastMock = jest.fn()
const onOpenChangeMock = jest.fn()
const onSuccessMock = jest.fn()
const insertMock = jest.fn()
const selectMock = jest.fn()

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === "thiet_bi") {
        return {
          select: selectMock,
          insert: insertMock,
        }
      }

      return {}
    }),
  },
}))

jest.mock("@/components/equipment-form-dialog-shared", () => {
  const { z } = jest.requireActual("zod")
  const payload: EquipmentFormValues = {
    ma_thiet_bi: "TB-DOUBLE-SUBMIT",
    ten_thiet_bi: "Máy test double submit",
    model: "",
    serial: "",
    hang_san_xuat: "",
    noi_san_xuat: "",
    nam_san_xuat: null,
    ngay_nhap: "",
    ngay_dua_vao_su_dung: "",
    nguon_kinh_phi: "",
    gia_goc: null,
    han_bao_hanh: "",
    vi_tri_lap_dat: "Phòng test",
    khoa_phong_quan_ly: "Xét nghiệm",
    nguoi_dang_truc_tiep_quan_ly: "Người test",
    tinh_trang_hien_tai: "Hoạt động",
    cau_hinh_thiet_bi: "",
    phu_kien_kem_theo: "",
    ghi_chu: "",
    phan_loai_theo_nd98: null,
  }

  return {
    equipmentFormDefaultValues: {},
    equipmentFormSchema: z.object({}),
    EquipmentFormDialogShared: ({ onSubmit }: { onSubmit: (values: EquipmentFormValues) => Promise<void> }) => (
      <>
        <button type="button" onClick={() => void onSubmit(payload)}>
          Save once
        </button>
        <button
          type="button"
          onClick={() => {
            void onSubmit(payload)
            void onSubmit(payload)
          }}
        >
          Save twice
        </button>
      </>
    ),
  }
})

describe("AddEquipmentDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    selectMock.mockReturnValue({
      not: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    insertMock.mockResolvedValue({ error: null })
  })

  it("ignores a second submit while the first add request is in flight", async () => {
    render(
      <AddEquipmentDialog
        open
        onOpenChange={onOpenChangeMock}
        onSuccess={onSuccessMock}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Save twice" }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledTimes(1)
    })
  })

  it("shows a clear message when the equipment code already exists", async () => {
    insertMock.mockResolvedValue({
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint \"thiet_bi_ma_thiet_bi_key\"",
        details: "Key (ma_thiet_bi)=(TB-DOUBLE-SUBMIT) already exists.",
      },
    })

    render(
      <AddEquipmentDialog
        open
        onOpenChange={onOpenChangeMock}
        onSuccess={onSuccessMock}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Save once" }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        variant: "destructive",
        title: "Lỗi",
        description: "Mã thiết bị này đã tồn tại. Vui lòng kiểm tra lại mã thiết bị hoặc chọn mã khác.",
      }))
    })
  })
})
