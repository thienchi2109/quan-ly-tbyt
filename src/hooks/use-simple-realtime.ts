import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseSimpleRealtimeOptions {
  table: string
  onDataChange?: () => void
  enabled?: boolean
}

/**
 * Simple realtime hook that just forces React Query to refetch
 * when data changes, without complex invalidation logic
 */
export function useSimpleRealtime({
  table,
  onDataChange,
  enabled = true
}: UseSimpleRealtimeOptions) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!supabase || !enabled) {
      return
    }

    // Cleanup existing subscription
    if (channelRef.current) {
      console.log(`🧹 [SimpleRealtime] Cleaning up ${table}`)
      supabase?.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Create new subscription
    const channelName = `simple_${table}_${Date.now()}`
    console.log(`🔴 [SimpleRealtime] Subscribing to ${table}`)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`🔄 [SimpleRealtime] ${table} changed:`, payload.eventType)
          console.log(`📄 [SimpleRealtime] Payload:`, payload)

          try {
            // Simple approach: just refetch all queries
            console.log(`🔄 [SimpleRealtime] Refetching active queries...`)
            queryClient.refetchQueries({ type: 'active' })
            console.log(`✅ [SimpleRealtime] Refetch completed`)

            // Call custom callback
            onDataChange?.()
            console.log(`✅ [SimpleRealtime] Callback completed`)
          } catch (error) {
            console.error(`❌ [SimpleRealtime] Error in callback:`, error)
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [SimpleRealtime] ${table} status:`, status)

        if (status === 'SUBSCRIBED') {
          console.log(`✅ [SimpleRealtime] Successfully subscribed to ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [SimpleRealtime] Channel error for ${table}`)
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏰ [SimpleRealtime] Subscription timeout for ${table}`)
        } else if (status === 'CLOSED') {
          console.warn(`🔒 [SimpleRealtime] Subscription closed for ${table}`)
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        console.log(`🧹 [SimpleRealtime] Cleanup ${table}`)
        supabase?.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, enabled])

  return {
    isConnected: !!channelRef.current
  }
}
