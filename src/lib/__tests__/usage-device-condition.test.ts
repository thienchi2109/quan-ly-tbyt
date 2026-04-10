import {
  getUsageDeviceConditionPresetValue,
  USAGE_DEVICE_CONDITION_PRESETS,
} from "@/lib/usage-device-condition"

describe("usage device condition presets", () => {
  it("returns the preset value when condition matches a suggested option", () => {
    expect(getUsageDeviceConditionPresetValue("Hoạt động bình thường")).toBe(
      "Hoạt động bình thường",
    )
  })

  it("returns undefined for a custom condition", () => {
    expect(getUsageDeviceConditionPresetValue("Máy rung nhẹ nhưng vẫn chạy")).toBeUndefined()
  })

  it("keeps the preset list stable for start/end usage dialogs", () => {
    expect(USAGE_DEVICE_CONDITION_PRESETS).toEqual([
      "Hoạt động bình thường",
      "Hoạt động nhưng cần theo dõi",
      "Bất thường nhẹ",
      "Tạm ngưng sử dụng",
      "Chờ sửa chữa",
      "Chờ bảo trì/hiệu chuẩn",
    ])
  })
})
