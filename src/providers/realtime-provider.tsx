'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

interface RealtimeContextType {
  isConnected: boolean
  isEnabled: boolean
  setIsEnabled: (enabled: boolean) => void
  connectionStatus: 'CONNECTING' | 'OPEN' | 'CLOSED'
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  isEnabled: true,
  setIsEnabled: () => {},
  connectionStatus: 'CLOSED'
})

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
  enableToasts?: boolean
  enableAutoInvalidation?: boolean
}

export function RealtimeProvider({ 
  children, 
  enableToasts = false,
  enableAutoInvalidation = true 
}: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'OPEN' | 'CLOSED'>('CLOSED')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!supabase || !isEnabled) {
      setIsConnected(false)
      setConnectionStatus('CLOSED')
      return
    }

    // Track connection status
    const channel = supabase.channel('realtime-status')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true)
        setConnectionStatus('OPEN')
        if (enableToasts) {
          toast({
            title: "🟢 Realtime kết nối",
            description: "Dữ liệu sẽ được cập nhật tự động",
          })
        }
        console.log('✅ [Realtime] Connected successfully')
      })
      .on('presence', { event: 'join' }, () => {
        setConnectionStatus('CONNECTING')
        console.log('🔄 [Realtime] Connecting...')
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false)
        setConnectionStatus('CLOSED')
        if (enableToasts) {
          toast({
            title: "🔴 Realtime mất kết nối",
            description: "Dữ liệu có thể không được cập nhật tự động",
            variant: "destructive"
          })
        }
        console.log('❌ [Realtime] Disconnected')
      })

    // Subscribe to connection
    channel.subscribe((status) => {
      console.log('🔗 [Realtime] Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setConnectionStatus('OPEN')
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        setIsConnected(false)
        setConnectionStatus('CLOSED')
      }
    })

    // Handle connection errors through channel events
    channel.on('system', {}, (payload) => {
      console.log('🔗 [Realtime] System event:', payload)
      if (payload.extension === 'postgres_changes') {
        if (payload.status === 'error') {
          console.error('❌ [Realtime] Connection error:', payload)
          setIsConnected(false)
          setConnectionStatus('CLOSED')
          
          if (enableToasts) {
            toast({
              title: "⚠️ Lỗi Realtime",
              description: "Có lỗi xảy ra với kết nối realtime",
              variant: "destructive"
            })
          }
        }
      }
    })

    // Cleanup function
    return () => {
      channel.unsubscribe()
      console.log('🧹 [Realtime] Cleanup completed')
    }
  }, [isEnabled, enableToasts, queryClient])

  // Global invalidation on reconnect (with debounce)
  useEffect(() => {
    if (isConnected && isEnabled && enableAutoInvalidation) {
      // Debounce invalidation to prevent excessive calls
      const timer = setTimeout(() => {
        queryClient.invalidateQueries()
        console.log('🔄 [Realtime] Invalidated all queries on reconnect')
      }, 1000) // Wait 1 second after connection

      return () => clearTimeout(timer)
    }
  }, [isConnected, isEnabled, queryClient, enableAutoInvalidation])

  const contextValue: RealtimeContextType = {
    isConnected,
    isEnabled,
    setIsEnabled,
    connectionStatus
  }

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
      {/* Connection status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${isConnected && isEnabled 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : isEnabled
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
            }
          `}>
            {!isEnabled ? '🚫 Realtime OFF' : 
             isConnected ? '🟢 Realtime ON' : 
             connectionStatus === 'CONNECTING' ? '🔄 Connecting...' : 
             '🔴 Disconnected'}
          </div>
        </div>
      )}
    </RealtimeContext.Provider>
  )
}

// HOC để bọc component với RealtimeProvider
export function withRealtime<P extends object>(
  Component: React.ComponentType<P>,
  options?: { enableToasts?: boolean; enableAutoInvalidation?: boolean }
) {
  const WrappedComponent = (props: P) => (
    <RealtimeProvider 
      enableToasts={options?.enableToasts}
      enableAutoInvalidation={options?.enableAutoInvalidation}
    >
      <Component {...props} />
    </RealtimeProvider>
  )
  
  WrappedComponent.displayName = `withRealtime(${Component.displayName || Component.name})`
  return WrappedComponent
} 