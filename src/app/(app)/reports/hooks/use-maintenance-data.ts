import { useQuery } from '@tanstack/react-query'
import { supabase } from "@/lib/supabase"
import { format, startOfYear, endOfYear } from "date-fns"

// Query keys for maintenance reports caching
export const maintenanceReportKeys = {
  all: ['maintenance-reports'] as const,
  data: (filters: Record<string, any>) => [...maintenanceReportKeys.all, { filters }] as const,
}

interface DateRange {
  from: Date
  to: Date
}

// Default date range is the current year
const defaultDateRange: DateRange = {
  from: startOfYear(new Date()),
  to: endOfYear(new Date()),
}

export function useMaintenanceReportData(
  dateRange: DateRange = defaultDateRange
) {
  const fromDate = format(dateRange.from, 'yyyy-MM-dd')
  const toDate = format(dateRange.to, 'yyyy-MM-dd')

  return useQuery({
    queryKey: maintenanceReportKeys.data({ from: fromDate, to: toDate }),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // --- 1. Fetch Repair Data ---
      const { data: repairData, error: repairError } = await supabase
        .from('yeu_cau_sua_chua')
        .select('trang_thai')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (repairError) throw repairError

      // --- 2. Fetch PLANNED Maintenance Data ---
      const { data: maintenancePlanData, error: maintenancePlanError } = await supabase
        .from('lich_bao_tri')
        .select('loai_bao_tri')
        .gte('ngay_bao_tri', fromDate)
        .lte('ngay_bao_tri', toDate)

      if (maintenancePlanError) throw maintenancePlanError

      // --- 3. Fetch COMPLETED Maintenance Data ---
      const { data: maintenanceCompletedData, error: maintenanceCompletedError } = await supabase
        .from('lich_bao_tri')
        .select('loai_bao_tri')
        .gte('ngay_hoan_thanh', fromDate)
        .lte('ngay_hoan_thanh', toDate)
        .eq('trang_thai', 'hoan_thanh')

      if (maintenanceCompletedError) throw maintenanceCompletedError
      
      // --- 4. Process Data ---

      // Process Repair Data (based on requests created in the period)
      const totalRepairs = repairData.length
      const completedRepairs = repairData.filter(r => r.trang_thai === 'hoan_thanh').length
      const pendingRepairs = repairData.filter(r => r.trang_thai === 'cho_xu_ly').length
      const processingRepairs = repairData.filter(r => r.trang_thai === 'dang_xu_ly').length
      const rejectedRepairs = repairData.filter(r => r.trang_thai === 'tu_choi').length
      const repairCompletionRate = totalRepairs > 0 ? (completedRepairs / totalRepairs) * 100 : 0
      
      const repairStatusDistribution = [
        { name: 'Hoàn thành', value: completedRepairs, color: 'hsl(var(--chart-5))' },
        { name: 'Đang xử lý', value: processingRepairs, color: 'hsl(var(--chart-2))' },
        { name: 'Chờ xử lý', value: pendingRepairs, color: 'hsl(var(--chart-3))' },
        { name: 'Từ chối', value: rejectedRepairs, color: 'hsl(var(--chart-4))' },
      ]

      // Process Maintenance Data
      const maintenanceTypes = ['Bảo trì', 'Hiệu chuẩn', 'Kiểm định']
      const maintenancePlanVsActual = maintenanceTypes.map(type => {
        const planned = maintenancePlanData.filter(m => m.loai_bao_tri === type).length
        const actual = maintenanceCompletedData.filter(m => m.loai_bao_tri === type).length
        return { name: type, planned, actual }
      })

      const totalMaintenancePlanned = maintenancePlanData.length
      const totalMaintenanceCompleted = maintenanceCompletedData.length
      // This rate now compares work completed in period vs work planned for period.
      // This is a measure of throughput against plan.
      const maintenanceCompletionRate = totalMaintenancePlanned > 0 ? (totalMaintenanceCompleted / totalMaintenancePlanned) * 100 : 0
      
      // --- 5. Return Combined Report Data ---
      return {
        summary: {
          totalRepairs,
          repairCompletionRate,
          totalMaintenancePlanned,
          maintenanceCompletionRate,
        },
        charts: {
          repairStatusDistribution,
          maintenancePlanVsActual
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
} 