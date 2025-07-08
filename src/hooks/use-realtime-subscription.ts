import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import type { 
  RealtimeChannel, 
  RealtimePostgresInsertPayload, 
  RealtimePostgresUpdatePayload, 
  RealtimePostgresDeletePayload 
} from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  /**
   * Tên bảng trong database
   */
  table: string
  
  /**
   * Schema name (mặc định: 'public')
   */
  schema?: string
  
  /**
   * Query keys cần invalidate khi có thay đổi
   */
  queryKeys: readonly (readonly string[])[]
  
  /**
   * Có hiển thị toast notification khi có thay đổi không
   */
  showNotifications?: boolean
  
  /**
   * Callback tùy chỉnh khi có INSERT
   */
  onInsert?: (payload: RealtimePostgresInsertPayload<any>) => void
  
  /**
   * Callback tùy chỉnh khi có UPDATE  
   */
  onUpdate?: (payload: RealtimePostgresUpdatePayload<any>) => void
  
  /**
   * Callback tùy chỉnh khi có DELETE
   */
  onDelete?: (payload: RealtimePostgresDeletePayload<any>) => void
  
  /**
   * Có bật subscription không (mặc định: true)
   */
  enabled?: boolean
  
  /**
   * Filter conditions for subscription
   */
  filter?: string
}

/**
 * Hook để quản lý Realtime subscriptions với TanStack Query
 * Tự động invalidate cache khi có thay đổi dữ liệu
 */
export function useRealtimeSubscription({
  table,
  schema = 'public',
  queryKeys,
  showNotifications = false,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
  filter
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    if (!supabase || !enabled || isSubscribedRef.current) {
      return
    }

    // Tạo unique channel name
    const channelName = `realtime:${schema}:${table}${filter ? `:${filter}` : ''}`
    
    console.log(`🔴 [Realtime] Subscribing to ${channelName}`)
    console.log(`🔍 [Realtime] Query keys to invalidate:`, queryKeys)

    try {
      // Tạo channel và subscribe
      const channel = supabase!
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: schema,
            table: table,
            ...(filter && { filter }),
          },
          (payload) => {
            console.log(`🔄 [Realtime] Change detected in ${table}:`, payload)

            // Invalidate tất cả query keys liên quan
            console.log(`🗂️ [Realtime] About to invalidate ${queryKeys.length} query keys`)
            queryKeys.forEach(queryKey => {
              console.log(`🗂️ [Realtime] Invalidating query:`, queryKey)
              queryClient.invalidateQueries({ queryKey })
            })
            
            // Debug: List all queries in cache
            const allQueries = queryClient.getQueryCache().getAll()
            console.log(`📚 [Realtime] Total queries in cache: ${allQueries.length}`)
            allQueries.slice(0, 5).forEach(query => {
              console.log(`📋 [Realtime] Query key:`, query.queryKey)
            })

            // Xử lý theo loại event
            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload as RealtimePostgresInsertPayload<any>)
                if (showNotifications) {
                  toast({
                    title: "Dữ liệu mới",
                    description: `Có bản ghi mới được thêm vào ${table}`,
                  })
                }
                break

              case 'UPDATE':
                onUpdate?.(payload as RealtimePostgresUpdatePayload<any>)
                if (showNotifications) {
                  toast({
                    title: "Dữ liệu cập nhật", 
                    description: `Bản ghi trong ${table} đã được cập nhật`,
                  })
                }
                break

              case 'DELETE':
                onDelete?.(payload as RealtimePostgresDeletePayload<any>)
                if (showNotifications) {
                  toast({
                    title: "Dữ liệu xóa",
                    description: `Bản ghi trong ${table} đã được xóa`,
                    variant: "destructive",
                  })
                }
                break
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 [Realtime] Subscription status for ${table}:`, status)
          
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [Realtime] Successfully subscribed to ${table}`)
            isSubscribedRef.current = true
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ [Realtime] Error subscribing to ${table}`)
            isSubscribedRef.current = false
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏰ [Realtime] Subscription timeout for ${table}`)
            isSubscribedRef.current = false
          } else if (status === 'CLOSED') {
            console.log(`🔒 [Realtime] Subscription closed for ${table}`)
            isSubscribedRef.current = false
          }
        })

      channelRef.current = channel

    } catch (error) {
      console.error(`❌ [Realtime] Failed to subscribe to ${table}:`, error)
    }

    // Cleanup function
    return () => {
      if (channelRef.current && supabase) {
        console.log(`🧹 [Realtime] Cleaning up subscription for ${table}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [table, schema, enabled, filter, queryKeys])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (channelRef.current && supabase) {
        console.log(`🧹 [Realtime] Component unmount - cleaning up ${table}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [])

  return {
    isSubscribed: isSubscribedRef.current,
    channel: channelRef.current
  }
} 