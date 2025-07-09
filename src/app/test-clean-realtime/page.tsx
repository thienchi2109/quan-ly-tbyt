'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSimpleRealtime } from '@/hooks/use-simple-realtime'

export default function TestCleanRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const queryClient = useQueryClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[CLEAN TEST] ${message}`)
  }

  // Clean query without any cache or localStorage
  const { data: repairs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['clean-repairs'],
    queryFn: async () => {
      if (!supabase) throw new Error('No supabase')
      
      addLog('🔍 Fetching repairs from database...')
      
      const { data, error } = await supabase
        .from('yeu_cau_sua_chua')
        .select('id, mo_ta_su_co, nguoi_yeu_cau, ngay_yeu_cau, trang_thai')
        .order('ngay_yeu_cau', { ascending: false })
        .limit(10)

      if (error) throw error
      
      addLog(`✅ Fetched ${data.length} repairs`)
      return data
    },
    staleTime: 0, // Always fresh
    gcTime: 0, // No cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })

  // Simple realtime subscription
  const { isConnected } = useSimpleRealtime({
    table: 'yeu_cau_sua_chua',
    onDataChange: () => {
      addLog('🔄 Realtime event detected - forcing refetch!')
      refetch() // Manual refetch
    }
  })

  const testDirectInsert = async () => {
    if (!supabase) {
      addLog('❌ Supabase not available')
      return
    }

    setIsTestRunning(true)
    addLog('🧪 Testing direct database insert...')

    try {
      const testData = {
        thiet_bi_id: 1,
        mo_ta_su_co: `Clean test ${Date.now()}`,
        hang_muc_sua_chua: 'Test repair',
        nguoi_yeu_cau: 'Clean Test User',
        ngay_yeu_cau: new Date().toISOString().split('T')[0],
        trang_thai: 'Chờ duyệt'
      }

      const { data, error } = await supabase
        .from('yeu_cau_sua_chua')
        .insert(testData)
        .select()
        .single()

      if (error) {
        addLog(`❌ Insert failed: ${error.message}`)
      } else {
        addLog(`✅ Insert successful: ${data.mo_ta_su_co}`)
        addLog('⏰ Waiting for realtime event...')
      }
    } catch (error: any) {
      addLog(`❌ Test failed: ${error.message}`)
    } finally {
      setIsTestRunning(false)
    }
  }

  const manualRefetch = () => {
    addLog('🔄 Manual refetch triggered')
    refetch()
  }

  const clearLogs = () => setLogs([])

  const clearAllCache = () => {
    addLog('🧹 Clearing all cache...')
    queryClient.clear()
    localStorage.clear()
    sessionStorage.clear()
    addLog('✅ All cache cleared')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Clean Realtime Test (No Cache)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status & Controls */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-sm">
              Realtime: {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </p>
            <p className="text-sm">
              Loading: {isLoading ? '🔄 Loading' : '✅ Ready'}
            </p>
            <p className="text-sm">
              Error: {error ? `❌ ${error.message}` : '✅ None'}
            </p>
            <p className="text-sm">
              Count: {repairs.length} repairs
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={testDirectInsert}
              disabled={isTestRunning}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isTestRunning ? '🧪 Testing...' : '🧪 Test Insert'}
            </button>
            
            <button
              onClick={manualRefetch}
              className="w-full bg-green-500 text-white px-4 py-2 rounded"
            >
              🔄 Manual Refetch
            </button>
            
            <button
              onClick={clearAllCache}
              className="w-full bg-red-500 text-white px-4 py-2 rounded"
            >
              🧹 Clear All Cache
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded"
            >
              🗑️ Clear Logs
            </button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold">Clean Test Features:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>No localStorage cache</li>
              <li>No React Query cache</li>
              <li>Manual refetch on realtime events</li>
              <li>Fresh data every time</li>
            </ul>
          </div>
        </div>

        {/* Logs & Data */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📋 Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto text-sm font-mono">
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

          <div>
            <h3 className="font-semibold mb-2">📊 Recent Repairs</h3>
            <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto text-sm">
              {repairs.map((repair: any) => (
                <div key={repair.id} className="mb-2 p-2 bg-white rounded border">
                  <div className="font-medium">{repair.mo_ta_su_co}</div>
                  <div className="text-gray-500 text-xs">
                    ID: {repair.id} | {repair.nguoi_yeu_cau} | {repair.ngay_yeu_cau}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
