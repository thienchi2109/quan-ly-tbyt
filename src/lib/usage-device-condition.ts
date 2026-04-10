export const USAGE_DEVICE_CONDITION_PRESETS = [
  "Hoạt động bình thường",
  "Hoạt động nhưng cần theo dõi",
  "Bất thường nhẹ",
  "Tạm ngưng sử dụng",
  "Chờ sửa chữa",
  "Chờ bảo trì/hiệu chuẩn",
] as const

export function getUsageDeviceConditionPresetValue(condition?: string) {
  if (!condition) {
    return undefined
  }

  return USAGE_DEVICE_CONDITION_PRESETS.find((preset) => preset === condition)
}
