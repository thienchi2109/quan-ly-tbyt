"use client"

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Simple hook to add realtime sync to existing components
 * This is a lightweight alternative to the full realtime context
 */
export function useRealtimeSync(options?: {
  tables?: string[]
  queryKeys?: string[][]
  enabled?: boolean
}) {
  const queryClient = useQueryClient()
  const {
    tables = ['thiet_bi', 'yeu_cau_sua_chua', 'ke_hoach_bao_tri'],
    queryKeys = [['equipment'], ['repair'], ['maintenance'], ['dashboard-stats']],
    enabled = true
  } = options || {}

  useEffect(() => {
    if (!enabled || !supabase) return

    console.log('[useRealtimeSync] Setting up realtime sync for tables:', tables)

    // Create a single channel for all subscriptions
    const channel = supabase.channel('app-sync')

    // Subscribe to each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`[useRealtimeSync] ${payload.eventType} on ${table}:`, payload)
          
          // Invalidate all relevant query keys
          queryKeys.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey })
          })
        }
      )
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('[useRealtimeSync] Channel status:', status)
    })

    // Cleanup
    return () => {
      console.log('[useRealtimeSync] Cleaning up realtime sync')
      supabase.removeChannel(channel)
    }
  }, [enabled, tables.join(','), JSON.stringify(queryKeys)])
}

/**
 * Hook specifically for dashboard components
 */
export function useDashboardRealtimeSync() {
  return useRealtimeSync({
    tables: ['thiet_bi', 'yeu_cau_sua_chua', 'ke_hoach_bao_tri'],
    queryKeys: [['dashboard-stats'], ['equipment'], ['repair'], ['maintenance']]
  })
}

/**
 * Hook specifically for equipment pages
 */
export function useEquipmentRealtimeSync() {
  return useRealtimeSync({
    tables: ['thiet_bi', 'yeu_cau_luan_chuyen'],
    queryKeys: [['equipment'], ['transfers'], ['dashboard-stats']]
  })
}

/**
 * Hook specifically for repair requests pages
 */
export function useRepairRealtimeSync() {
  return useRealtimeSync({
    tables: ['yeu_cau_sua_chua'],
    queryKeys: [['repair'], ['dashboard-stats']]
  })
}

/**
 * Hook specifically for maintenance pages
 */
export function useMaintenanceRealtimeSync() {
  return useRealtimeSync({
    tables: ['ke_hoach_bao_tri'],
    queryKeys: [['maintenance'], ['dashboard-stats'], ['calendar-events']]
  })
}
