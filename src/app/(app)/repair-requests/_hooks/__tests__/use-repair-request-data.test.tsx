import { renderHook, waitFor } from "@testing-library/react"

import type { User } from "@/types/database"

import type { RepairRequestWithEquipment } from "../../types"
import { useRepairRequestData } from "../use-repair-request-data"

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
  supabaseError: null,
}))

const { supabase } = jest.requireMock("@/lib/supabase") as {
  supabase: { from: jest.Mock }
}
const mockFrom = supabase.from

const departmentUser: User = {
  id: 101,
  username: "dept-user",
  password: "",
  full_name: "Department User",
  role: "qltb_khoa",
  khoa_phong: "Khoa A",
  created_at: new Date().toISOString(),
}

const requestOutsideDepartment: RepairRequestWithEquipment = {
  id: 1,
  thiet_bi_id: 501,
  ngay_yeu_cau: "2026-05-01T08:00:00.000Z",
  trang_thai: "Chờ duyệt",
  mo_ta_su_co: "Lỗi tín hiệu",
  hang_muc_sua_chua: null,
  ngay_mong_muon_hoan_thanh: null,
  nguoi_yeu_cau: "Nguyễn Văn A",
  ngay_duyet: null,
  ngay_hoan_thanh: null,
  nguoi_duyet: null,
  nguoi_xac_nhan: null,
  don_vi_thuc_hien: null,
  ten_don_vi_thue: null,
  ket_qua_sua_chua: null,
  ly_do_khong_hoan_thanh: null,
  thiet_bi: null,
}

const requestInsideDepartment: RepairRequestWithEquipment = {
  id: 2,
  thiet_bi_id: 502,
  ngay_yeu_cau: "2026-05-02T08:00:00.000Z",
  trang_thai: "Chờ duyệt",
  mo_ta_su_co: "Không lên nguồn",
  hang_muc_sua_chua: null,
  ngay_mong_muon_hoan_thanh: null,
  nguoi_yeu_cau: "Trần Thị B",
  ngay_duyet: null,
  ngay_hoan_thanh: null,
  nguoi_duyet: null,
  nguoi_xac_nhan: null,
  don_vi_thuc_hien: null,
  ten_don_vi_thue: null,
  ket_qua_sua_chua: null,
  ly_do_khong_hoan_thanh: null,
  thiet_bi: {
    ten_thiet_bi: "Máy monitor",
    ma_thiet_bi: "TB-502",
    model: "M-1",
    serial: "SN-502",
    khoa_phong_quan_ly: "Khoa A",
  },
}

describe("useRepairRequestData", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it("hides repair requests outside user department when embedded equipment is missing", async () => {
    const equipmentEq = jest.fn().mockResolvedValue({
      data: [
        {
          id: 502,
          ma_thiet_bi: "TB-502",
          ten_thiet_bi: "Máy monitor",
          khoa_phong_quan_ly: "Khoa A",
        },
      ],
      error: null,
    })

    const equipmentSelect = jest.fn().mockReturnValue({
      eq: equipmentEq,
    })

    const requestOrder = jest.fn().mockResolvedValue({
      data: [requestOutsideDepartment, requestInsideDepartment],
      error: null,
    })

    const requestEq = jest.fn().mockReturnValue({
      order: requestOrder,
    })

    const requestSelect = jest.fn().mockReturnValue({
      eq: requestEq,
      order: requestOrder,
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "thiet_bi") {
        return { select: equipmentSelect }
      }

      if (table === "yeu_cau_sua_chua") {
        return { select: requestSelect }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { result } = renderHook(() =>
      useRepairRequestData({
        user: departmentUser,
        toast: jest.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(requestEq).toHaveBeenCalledWith("thiet_bi.khoa_phong_quan_ly", "Khoa A")

    expect(result.current.requests).toEqual([requestInsideDepartment])
  })
})
