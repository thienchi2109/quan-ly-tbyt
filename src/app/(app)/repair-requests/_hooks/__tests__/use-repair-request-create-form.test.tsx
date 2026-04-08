import { renderHook, waitFor } from "@testing-library/react"
import { useSearchParams } from "next/navigation"

import type { User } from "@/types/database"

import { useRepairRequestCreateForm } from "../use-repair-request-create-form"

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}))

const mockedUseSearchParams = useSearchParams as jest.Mock

const user: User = {
  id: 1,
  username: "tester",
  password: "",
  full_name: "Test User",
  role: "admin",
  khoa_phong: "Khoa A",
  created_at: new Date().toISOString(),
}

describe("useRepairRequestCreateForm", () => {
  beforeEach(() => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams("equipmentId=42"))
  })

  it("opens create sheet and prefills selected equipment from deep-link", async () => {
    const { result } = renderHook(() =>
      useRepairRequestCreateForm({
        user,
        canSetRepairUnit: true,
        allEquipment: [
          {
            id: 42,
            ma_thiet_bi: "TB-42",
            ten_thiet_bi: "Monitor X",
            khoa_phong_quan_ly: "Khoa A",
          },
        ],
        toast: jest.fn(),
        onSuccess: jest.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.selectedEquipment?.id).toBe(42)
    })

    expect(result.current.searchQuery).toBe("Monitor X (TB-42)")
    expect(result.current.open).toBe(true)
  })
})
