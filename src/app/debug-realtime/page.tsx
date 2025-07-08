'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import { useEquipment } from '@/hooks/use-cached-equipment'

export default function DebugRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const queryClient = useQueryClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[DEBUG] ${message}`)
  }

  // Test realtime subscription
  useRealtimeSubscription({
    table: 'thiet_bi',
    queryKeys: [['equipment'], ['equipment', 'list']],
    showNotifications: false,
    onInsert: (payload) => {
      addLog(`🆕 INSERT detected: ${JSON.stringify(payload.new)}`)
    },
    onUpdate: (payload) => {
      addLog(`📝 UPDATE detected: ${JSON.stringify(payload.new)}`)
    },
    onDelete: (payload) => {
      addLog(`🗑️ DELETE detected: ${JSON.stringify(payload.old)}`)
    }
  })

  // Use equipment hook for cache testing
  const { data: equipment, isLoading, error } = useEquipment()

  useEffect(() => {
    addLog('🚀 Debug page loaded')
    
    // Log initial cache state
    const allQueries = queryClient.getQueryCache().getAll()
    addLog(`📚 Initial cache has ${allQueries.length} queries`)
  }, [])

  const testDirectUpdate = async () => {
    if (!supabase) {
      addLog('❌ Supabase not initialized')
      return
    }

    setIsTestRunning(true)
    addLog('🧪 Starting direct database update test...')

    try {
      // Get first equipment
      const { data: firstEquipment } = await supabase
        .from('thiet_bi')
        .select('id, ten_thiet_bi')
        .limit(1)
        .single()

      if (!firstEquipment) {
        addLog('❌ No equipment found to test with')
        return
      }

      addLog(`🎯 Testing with equipment: ${firstEquipment.ten_thiet_bi}`)

      // Update the equipment
      const updateData = {
        ten_thiet_bi: `${firstEquipment.ten_thiet_bi} (Updated ${Date.now()})`
      }

      const { data, error } = await supabase
        .from('thiet_bi')
        .update(updateData)
        .eq('id', firstEquipment.id)
        .select()
        .single()

      if (error) {
        addLog(`❌ Update failed: ${error.message}`)
      } else {
        addLog(`✅ Update successful: ${data.ten_thiet_bi}`)
        addLog('⏰ Waiting for realtime event...')
      }
    } catch (error: any) {
      addLog(`❌ Test failed: ${error.message}`)
    } finally {
      setIsTestRunning(false)
    }
  }

  const clearLogs = () => setLogs([])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Realtime Debug Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Connection Status</h3>
            <p className="text-sm">
              Supabase: {supabase ? '✅ Connected' : '❌ Not Connected'}
            </p>
            <p className="text-sm">
              Equipment Query: {isLoading ? '🔄 Loading' : error ? '❌ Error' : '✅ Loaded'}
            </p>
            <p className="text-sm">
              Equipment Count: {equipment?.length || 0}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={testDirectUpdate}
              disabled={isTestRunning}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isTestRunning ? '🧪 Testing...' : '🧪 Test Direct DB Update'}
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded"
            >
              🗑️ Clear Logs
            </button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click "Test Direct DB Update"</li>
              <li>Watch logs for realtime events</li>
              <li>Check if cache updates automatically</li>
              <li>Or manually update equipment in main app</li>
            </ol>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h3 className="font-semibold mb-2">📋 Debug Logs</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 