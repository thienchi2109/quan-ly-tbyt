import {
  isSameRepairRequestDepartment,
  normalizeRepairRequestDepartmentName,
} from "../department-normalization"

describe("department-normalization", () => {
  describe("normalizeRepairRequestDepartmentName", () => {
    it("normalizes case, accents and hyphen spacing", () => {
      expect(
        normalizeRepairRequestDepartmentName("  Phòng khám Đa khoa - Chuyên khoa  "),
      ).toBe("phong kham da khoa-chuyen khoa")
    })
  })

  describe("isSameRepairRequestDepartment", () => {
    it("matches names that differ by case and accents", () => {
      expect(isSameRepairRequestDepartment("Xét nghiệm", "xet nghiem")).toBe(true)
    })

    it("matches parent-child department names separated by hyphen", () => {
      expect(
        isSameRepairRequestDepartment(
          "Phòng khám đa khoa",
          "Phòng khám Đa khoa - Chuyên khoa",
        ),
      ).toBe(true)
      expect(
        isSameRepairRequestDepartment(
          "Dược",
          "Dược - Vật tư - TBYT",
        ),
      ).toBe(true)
    })

    it("does not match unrelated departments", () => {
      expect(isSameRepairRequestDepartment("Khoa Nội", "Khoa Ngoại")).toBe(false)
    })
  })
})
