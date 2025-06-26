import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

// Query keys for caching
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...equipmentKeys.lists(), { filters }] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
}

// Fetch all equipment with filters
export function useEquipment(filters?: {
  search?: string
  phong_ban?: string
  trang_thai?: string
  loai_thiet_bi?: string
}) {
  return useQuery({
    queryKey: equipmentKeys.list(filters || {}),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabase
        .from('thiet_bi')
        .select(`
          *,
          phong_ban:phong_ban(ten_phong_ban),
          loai_thiet_bi:loai_thiet_bi(ten_loai)
        `)

      // Apply filters
      if (filters?.search) {
        query = query.or(`ten_thiet_bi.ilike.%${filters.search}%,ma_thiet_bi.ilike.%${filters.search}%`)
      }
      if (filters?.phong_ban) {
        query = query.eq('phong_ban_id', filters.phong_ban)
      }
      if (filters?.trang_thai) {
        query = query.eq('trang_thai', filters.trang_thai)
      }
      if (filters?.loai_thiet_bi) {
        query = query.eq('loai_thiet_bi_id', filters.loai_thiet_bi)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Fetch single equipment details
export function useEquipmentDetail(id: string | null) {
  return useQuery({
    queryKey: equipmentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from('thiet_bi')
        .select(`
          *,
          phong_ban:phong_ban(ten_phong_ban),
          loai_thiet_bi:loai_thiet_bi(ten_loai),
          yeu_cau_luan_chuyen(
            *,
            phong_ban_gui:phong_ban!yeu_cau_luan_chuyen_phong_ban_gui_fkey(ten_phong_ban),
            phong_ban_nhan:phong_ban!yeu_cau_luan_chuyen_phong_ban_nhan_fkey(ten_phong_ban)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Update equipment mutation with cache invalidation
export function useUpdateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; data: any }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('thiet_bi')
        .update(params.data)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate and refetch equipment lists
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() })
      // Update specific equipment detail cache
      queryClient.setQueryData(equipmentKeys.detail(data.id), data)
      
      toast({
        title: "Thành công",
        description: "Cập nhật thiết bị thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thiết bị",
        variant: "destructive",
      })
    },
  })
}

// Create equipment mutation
export function useCreateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: newEquipment, error } = await supabase
        .from('thiet_bi')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newEquipment
    },
    onSuccess: () => {
      // Invalidate all equipment queries to refetch data
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      
      toast({
        title: "Thành công",
        description: "Thêm thiết bị thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm thiết bị",
        variant: "destructive",
      })
    },
  })
}

// Delete equipment mutation
export function useDeleteEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('thiet_bi')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all equipment queries
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      
      toast({
        title: "Thành công",
        description: "Xóa thiết bị thành công",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thiết bị",
        variant: "destructive",
      })
    },
  })
} 