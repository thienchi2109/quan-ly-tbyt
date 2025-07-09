'use client'

import { useState } from 'react'
import { useRepairRequests } from '@/hooks/use-cached-repair'
import { useSimpleRealtime } from '@/hooks/use-simple-realtime'
import { supabase } from '@/lib/supabase'

export default function TestSimpleRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TEST] ${message}`)
  }

  // Use repair requests hook
  const { data: repairs = [], isLoading, error } = useRepairRequests()

  // Use simple realtime
  const { isConnected } = useSimpleRealtime({
    table: 'yeu_cau_sua_chua',
    onDataChange: () => {
      addLog('🔄 Data changed - UI should update now!')
    }
  })

  const testDirectUpdate = async () => {
    if (!supabase) {
      addLog('❌ Supabase not available')
      return
    }

    setIsTestRunning(true)
    addLog('🧪 Testing direct database update...')

    try {
      // Insert a test repair request
      const { data, error } = await supabase
        .from('yeu_cau_sua_chua')
        .insert({
          thiet_bi_id: 1, // Assuming equipment ID 1 exists
          mo_ta_su_co: `Test issue ${Date.now()}`,
          hang_muc_sua_chua: 'Test repair',
          nguoi_yeu_cau: 'Test User',
          ngay_yeu_cau: new Date().toISOString().split('T')[0],
          trang_thai: 'Chờ duyệt'
        })
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

  const clearLogs = () => setLogs([])

  const checkConnection = () => {
    addLog('🔍 Checking connection status...')
    addLog(`📡 Realtime connected: ${isConnected}`)
    addLog(`📊 Repairs loaded: ${repairs.length} items`)
    addLog(`⚡ Loading state: ${isLoading}`)
    if (error) {
      addLog(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Simple Realtime Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status & Controls */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-sm">
              Realtime: {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </p>
            <p className="text-sm">
              Repairs: {isLoading ? '🔄 Loading' : error ? '❌ Error' : '✅ Loaded'}
            </p>
            <p className="text-sm">
              Count: {repairs.length} repair requests
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={testDirectUpdate}
              disabled={isTestRunning}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isTestRunning ? '🧪 Testing...' : '🧪 Test Insert'}
            </button>
            
            <button
              onClick={checkConnection}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded"
            >
              🔍 Check Status
            </button>

            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded"
            >
              🗑️ Clear Logs
            </button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold">Test Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click "Test Insert" to add data</li>
              <li>Watch logs for realtime events</li>
              <li>Check if repair count updates instantly</li>
              <li>Open 2 tabs to test cross-tab sync</li>
            </ol>
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
              {repairs.slice(0, 5).map((repair: any) => (
                <div key={repair.id} className="mb-2 p-2 bg-white rounded border">
                  <div className="font-medium">{repair.mo_ta_su_co}</div>
                  <div className="text-gray-500 text-xs">
                    {repair.nguoi_yeu_cau} - {repair.ngay_yeu_cau}
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
