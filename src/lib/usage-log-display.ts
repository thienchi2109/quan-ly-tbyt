import { type UsageLog } from '@/types/database'

export type UsageLogSortOrder = 'newest' | 'oldest'
export type UsageLogStatusFilter = 'all' | UsageLog['trang_thai']

export const USAGE_LOG_SORT_LABELS: Record<UsageLogSortOrder, string> = {
  newest: 'Mới nhất trước',
  oldest: 'Cũ nhất trước',
}

type GetVisibleUsageLogsOptions = {
  sortOrder?: UsageLogSortOrder
  dateFrom?: string
  dateTo?: string
  statusFilter?: UsageLogStatusFilter
}

export function getVisibleUsageLogs(
  usageLogs: UsageLog[] | undefined,
  options: GetVisibleUsageLogsOptions = {},
) {
  if (!usageLogs?.length) {
    return []
  }

  const {
    sortOrder = 'newest',
    dateFrom,
    dateTo,
    statusFilter = 'all',
  } = options

  const fromDate = dateFrom ? new Date(dateFrom) : null
  const toDate = dateTo
    ? (() => {
        const date = new Date(dateTo)
        date.setHours(23, 59, 59, 999)
        return date
      })()
    : null

  return [...usageLogs]
    .filter((log) => {
      const logDate = new Date(log.thoi_gian_bat_dau)

      if (fromDate && logDate < fromDate) return false
      if (toDate && logDate > toDate) return false
      if (statusFilter !== 'all' && log.trang_thai !== statusFilter) return false

      return true
    })
    .sort((a, b) => {
      const timeA = new Date(a.thoi_gian_bat_dau).getTime()
      const timeB = new Date(b.thoi_gian_bat_dau).getTime()

      return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA
    })
}
