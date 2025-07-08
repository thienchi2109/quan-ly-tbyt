import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { useRealtimeSubscription } from './use-realtime-subscription'

// Query keys for caching
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...maintenanceKeys.lists(), { filters }] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  schedules: () => [...maintenanceKeys.all, 'schedules'] as const,
  schedule: (filters: Record<string, any>) => [...maintenanceKeys.schedules(), { filters }] as const,
  plans: () => [...maintenanceKeys.all, 'plans'] as const,
  plan: (filters: Record<string, any>) => [...maintenanceKeys.plans(), { filters }] as const,
}

// Fetch maintenance plans (ke_hoach_bao_tri)
export function useMaintenancePlans(filters?: {
  search?: string
  nam?: number
  trang_thai?: string
}) {
  // Setup realtime subscription for maintenance plans changes
  useRealtimeSubscription({
    table: 'ke_hoach_bao_tri',
    queryKeys: [
      maintenanceKeys.all,
      maintenanceKeys.plans(),
    ],
    showNotifications: true,
    onInsert: (payload) => {
      console.log('🆕 [Maintenance Plans] New maintenance plan:', payload.new)
    },
    onUpdate: (payload) => {
      console.log('📝 [Maintenance Plans] Maintenance plan updated:', payload.new)
    },
    onDelete: (payload) => {
      console.log('🗑️ [Maintenance Plans] Maintenance plan deleted:', payload.old)
    }
  })

  // Setup realtime subscription for maintenance tasks
  useRealtimeSubscription({
    table: 'cong_viec_bao_tri',
    queryKeys: [
      maintenanceKeys.all,
      maintenanceKeys.schedules(),
      maintenanceKeys.lists(),
    ],
    showNotifications: true,
    onInsert: (payload) => {
      console.log('🆕 [Maintenance Tasks] New maintenance task:', payload.new)
    },
    onUpdate: (payload) => {
      console.log('📝 [Maintenance Tasks] Maintenance task updated:', payload.new)
    },
    onDelete: (payload) => {
      console.log('🗑️ [Maintenance Tasks] Maintenance task deleted:', payload.old)
    }
  })

  return useQuery({
    queryKey: maintenanceKeys.plan(filters || {}),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('ke_hoach_bao_tri')
        .select('*')
        .order('nam', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.search) {
        query = query.or(`ten_ke_hoach.ilike.%${filters.search}%,mo_ta.ilike.%${filters.search}%`)
      }
      if (filters?.trang_thai) {
        query = query.eq('trang_thai', filters.trang_thai)
      }
      if (filters?.nam) {
        query = query.eq('nam', filters.nam)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    staleTime: 15 * 60 * 1000, // Tăng lên 15 phút vì có realtime
    gcTime: 45 * 60 * 1000, // Tăng lên 45 phút vì có realtime
  })
}

// Fetch maintenance schedules with filters
export function useMaintenanceSchedules(filters?: {
  search?: string
  phong_ban?: string
  trang_thai?: string
  loai_bao_tri?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: maintenanceKeys.schedule(filters || {}),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('lich_bao_tri')
        .select(`
          *,
          thiet_bi:thiet_bi(ma_thiet_bi, ten_thiet_bi, phong_ban:phong_ban(ten_phong_ban)),
          nguoi_thuc_hien:profiles(ho_ten)
        `)

      // Apply filters
      if (filters?.search) {
        query = query.or(`mo_ta.ilike.%${filters.search}%,ghi_chu.ilike.%${filters.search}%`)
      }
      if (filters?.trang_thai) {
        query = query.eq('trang_thai', filters.trang_thai)
      }
      if (filters?.loai_bao_tri) {
        query = query.eq('loai_bao_tri', filters.loai_bao_tri)
      }
      if (filters?.dateFrom) {
        query = query.gte('ngay_bao_tri', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('ngay_bao_tri', filters.dateTo)
      }

      const { data, error } = await query.order('ngay_bao_tri', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 15 * 60 * 1000, // Tăng lên 15 phút vì có realtime
    gcTime: 45 * 60 * 1000, // Tăng lên 45 phút vì có realtime
  })
}

// Fetch maintenance history
export function useMaintenanceHistory(filters?: {
  thiet_bi_id?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters || {}),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('lich_bao_tri')
        .select(`
          *,
          thiet_bi:thiet_bi(ma_thiet_bi, ten_thiet_bi),
          nguoi_thuc_hien:profiles(ho_ten)
        `)
        .eq('trang_thai', 'hoan_thanh')

      if (filters?.thiet_bi_id) {
        query = query.eq('thiet_bi_id', filters.thiet_bi_id)
      }
      if (filters?.dateFrom) {
        query = query.gte('ngay_bao_tri', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('ngay_bao_tri', filters.dateTo)
      }

      const { data, error } = await query.order('ngay_bao_tri', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 20 * 60 * 1000, // Tăng lên 20 phút vì có realtime
    gcTime: 60 * 60 * 1000, // Tăng lên 60 phút vì có realtime
  })
}

// Fetch single maintenance record details
export function useMaintenanceDetail(id: string | null) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from('lich_bao_tri')
        .select(`
          *,
          thiet_bi:thiet_bi(*),
          nguoi_thuc_hien:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // Tăng lên 15 phút vì có realtime
  })
}

// Create maintenance plan mutation
export function useCreateMaintenancePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: newPlan, error } = await supabase
        .from('ke_hoach_bao_tri')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newPlan
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa

      toast({
        title: "Thành công",
        description: "Tạo kế hoạch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo kế hoạch bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Update maintenance plan mutation
export function useUpdateMaintenancePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; data: any }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('ke_hoach_bao_tri')
        .update(params.data)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa

      toast({
        title: "Thành công",
        description: "Cập nhật kế hoạch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật kế hoạch bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Delete maintenance plan mutation
export function useDeleteMaintenancePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('ke_hoach_bao_tri')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa

      toast({
        title: "Thành công",
        description: "Xóa kế hoạch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa kế hoạch bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Create maintenance schedule mutation
export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: newSchedule, error } = await supabase
        .from('lich_bao_tri')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newSchedule
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa
      
      toast({
        title: "Thành công",
        description: "Tạo lịch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo lịch bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Update maintenance schedule mutation
export function useUpdateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; data: any }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('lich_bao_tri')
        .update(params.data)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Với realtime, cache sẽ được tự động invalidate
      // Chỉ cần update optimistic cache
      queryClient.setQueryData(maintenanceKeys.detail(data.id), data)
      
      toast({
        title: "Thành công",
        description: "Cập nhật lịch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật lịch bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Complete maintenance mutation
export function useCompleteMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { 
      id: string
      ket_qua?: string
      ghi_chu?: string
      chi_phi?: number
      nguoi_thuc_hien: string
    }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('lich_bao_tri')
        .update({
          trang_thai: 'hoan_thanh',
          ngay_hoan_thanh: new Date().toISOString(),
          ket_qua: params.ket_qua,
          ghi_chu: params.ghi_chu,
          chi_phi: params.chi_phi,
          nguoi_thuc_hien: params.nguoi_thuc_hien
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa
      
      toast({
        title: "Thành công",
        description: "Hoàn thành bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hoàn thành bảo trì",
        variant: "destructive",
      })
    },
  })
}

// Delete maintenance schedule mutation
export function useDeleteMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('lich_bao_tri')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Với realtime, cache sẽ được tự động invalidate
      // Không cần manual invalidation nữa
      
      toast({
        title: "Thành công",
        description: "Xóa lịch bảo trì thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa lịch bảo trì",
        variant: "destructive",
      })
    },
  })
} 