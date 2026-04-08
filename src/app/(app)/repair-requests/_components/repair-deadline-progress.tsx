"use client"

type DeadlineStatus = "success" | "warning" | "danger"

function calculateDaysRemaining(desiredDate: string | null) {
  if (!desiredDate) return null

  const today = new Date()
  const targetDate = new Date(desiredDate)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: DeadlineStatus
  let color: string

  if (diffDays > 7) {
    status = "success"
    color = "bg-green-500"
  } else if (diffDays > 0) {
    status = "warning"
    color = "bg-orange-500"
  } else {
    status = "danger"
    color = "bg-red-500"
  }

  return {
    days: diffDays,
    status,
    color,
    text:
      diffDays > 0
        ? `Còn ${diffDays} ngày`
        : diffDays === 0
          ? "Hôm nay"
          : `Quá hạn ${Math.abs(diffDays)} ngày`,
  }
}

interface RepairDeadlineProgressProps {
  desiredDate: string | null
  requestStatus: string
}

export function RepairDeadlineProgress({
  desiredDate,
  requestStatus,
}: RepairDeadlineProgressProps) {
  const isCompleted =
    requestStatus === "Hoàn thành" || requestStatus === "Không HT"
  const daysInfo = !isCompleted ? calculateDaysRemaining(desiredDate) : null

  if (!daysInfo) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${daysInfo.color} transition-all duration-300`}
          style={{
            width:
              daysInfo.days > 0
                ? `${Math.min(100, Math.max(10, (daysInfo.days / 14) * 100))}%`
                : "100%",
          }}
        />
      </div>
      <span
        className={`text-xs font-medium ${
          daysInfo.status === "success"
            ? "text-green-600"
            : daysInfo.status === "warning"
              ? "text-orange-600"
              : "text-red-600"
        }`}
      >
        {daysInfo.text}
      </span>
    </div>
  )
}
