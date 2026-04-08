import { type UsageLog } from '@/types/database'
import { getVisibleUsageLogs } from '../usage-log-display'

const logs: UsageLog[] = [
  {
    id: 1,
    thiet_bi_id: 100,
    nguoi_su_dung_id: 10,
    thoi_gian_bat_dau: '2026-04-01T08:00:00.000Z',
    thoi_gian_ket_thuc: '2026-04-01T10:00:00.000Z',
    trang_thai: 'hoan_thanh',
    ghi_chu: 'Ca sáng',
    created_at: '2026-04-01T08:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 2,
    thiet_bi_id: 100,
    nguoi_su_dung_id: 11,
    thoi_gian_bat_dau: '2026-04-03T09:00:00.000Z',
    thoi_gian_ket_thuc: '2026-04-03T11:00:00.000Z',
    trang_thai: 'hoan_thanh',
    ghi_chu: 'Ca giữa tuần',
    created_at: '2026-04-03T09:00:00.000Z',
    updated_at: '2026-04-03T11:00:00.000Z',
  },
  {
    id: 3,
    thiet_bi_id: 100,
    nguoi_su_dung_id: 12,
    thoi_gian_bat_dau: '2026-04-05T07:30:00.000Z',
    trang_thai: 'dang_su_dung',
    ghi_chu: 'Ca gần nhất',
    created_at: '2026-04-05T07:30:00.000Z',
    updated_at: '2026-04-05T07:30:00.000Z',
  },
]

describe('getVisibleUsageLogs', () => {
  it('returns newest records first by default', () => {
    const result = getVisibleUsageLogs(logs)

    expect(result.map((log) => log.id)).toEqual([3, 2, 1])
  })

  it('returns oldest records first when requested', () => {
    const result = getVisibleUsageLogs(logs, { sortOrder: 'oldest' })

    expect(result.map((log) => log.id)).toEqual([1, 2, 3])
  })

  it('keeps the selected sort order after applying print filters', () => {
    const result = getVisibleUsageLogs(logs, {
      sortOrder: 'oldest',
      dateFrom: '2026-04-02',
      statusFilter: 'hoan_thanh',
    })

    expect(result.map((log) => log.id)).toEqual([2])
  })
})
