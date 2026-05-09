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

const normalizedDepartmentUser: User = {
  id: 102,
  username: "normalized-dept-user",
  password: "",
  full_name: "Normalized Department User",
  role: "qltb_khoa",
  khoa_phong: "  Xét nghiệm  ",
  created_at: new Date().toISOString(),
}

const hyphenDepartmentUser: User = {
  id: 103,
  username: "hyphen-dept-user",
  password: "",
  full_name: "Hyphen Department User",
  role: "qltb_khoa",
  khoa_phong: "Phòng khám Đa khoa - Chuyên khoa",
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
    const equipmentSelect = jest.fn().mockResolvedValue({
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

    const requestOrder = jest.fn().mockResolvedValue({
      data: [requestOutsideDepartment, requestInsideDepartment],
      error: null,
    })

    const requestSelect = jest.fn().mockReturnValue({
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

    expect(result.current.requests).toEqual([requestInsideDepartment])
  })

  it("shows equipment when department names differ by case, spaces and accents", async () => {
    const normalizedDepartmentEquipment = {
      id: 601,
      ma_thiet_bi: "TB-601",
      ten_thiet_bi: "Máy xét nghiệm",
      khoa_phong_quan_ly: "Xét Nghiệm",
    }

    const equipmentSelect = jest.fn().mockResolvedValue({
      data: [
        normalizedDepartmentEquipment,
        {
          id: 602,
          ma_thiet_bi: "TB-602",
          ten_thiet_bi: "Thiết bị khoa khác",
          khoa_phong_quan_ly: "Khoa khác",
        },
      ],
      error: null,
    })

    const requestOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const requestSelect = jest.fn().mockReturnValue({
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
        user: normalizedDepartmentUser,
        toast: jest.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.allEquipment).toEqual([normalizedDepartmentEquipment])
  })

  it("matches department names with hyphen differences in spacing and case", async () => {
    const hyphenDepartmentEquipment = {
      id: 701,
      ma_thiet_bi: "TB-701",
      ten_thiet_bi: "Máy nội soi",
      khoa_phong_quan_ly: "Phòng khám đa khoa- chuyên khoa",
    }

    const equipmentSelect = jest.fn().mockResolvedValue({
      data: [
        hyphenDepartmentEquipment,
        {
          id: 702,
          ma_thiet_bi: "TB-702",
          ten_thiet_bi: "Thiết bị ngoài khoa",
          khoa_phong_quan_ly: "Khoa ngoại",
        },
      ],
      error: null,
    })

    const requestOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const requestSelect = jest.fn().mockReturnValue({
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
        user: hyphenDepartmentUser,
        toast: jest.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.allEquipment).toEqual([hyphenDepartmentEquipment])
  })
})
