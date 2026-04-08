export const requestStatuses = [
  "Chờ xử lý",
  "Đã duyệt",
  "Hoàn thành",
  "Không HT",
] as const

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export function getRepairRequestStatusVariant(status: string | null): BadgeVariant {
  switch (status) {
    case "Chờ xử lý":
      return "destructive"
    case "Đã duyệt":
      return "secondary"
    case "Hoàn thành":
      return "default"
    case "Không HT":
      return "outline"
    default:
      return "outline"
  }
}
