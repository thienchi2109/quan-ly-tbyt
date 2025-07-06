"use client"

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * A custom hook to subscribe to real-time changes in a Supabase table.
 * When a change is detected, it invalidates the specified query key,
 * prompting TanStack Query to refetch the data.
 *
 * @param channelName A unique name for the real-time channel.
 * @param tableName The name of the database table to listen to.
 * @param queryKeyToInvalidate The TanStack Query key to invalidate on change.
 */
export const useRealtimeSubscription = (
  channelName: string,
  tableName: string,
  queryKeyToInvalidate: readonly unknown[]
) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase client not available, skipping real-time subscription.")
      return
    }

    const channel = supabase.channel(channelName)

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log(
            `Realtime change detected on table '${tableName}'. Invalidating query key:`,
            queryKeyToInvalidate
          )
          queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate })
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to real-time channel: ${channelName}`)
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Failed to subscribe to channel '${channelName}':`, err)
        }
      })

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      if (supabase && channel) {
        console.log(`Unsubscribing from real-time channel: ${channelName}`)
        supabase.removeChannel(channel).catch(err => {
          console.error(`Error unsubscribing from channel '${channelName}':`, err)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, tableName, queryClient]) // Do not include queryKeyToInvalidate to avoid re-subscribing when it changes
} 