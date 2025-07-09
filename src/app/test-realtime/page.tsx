"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TestRealtime] ${message}`)
  }

  const testBasicConnection = async () => {
    addLog('Testing basic Supabase connection...')
    
    if (!supabase) {
      addLog('❌ Supabase client not initialized')
      return
    }

    try {
      // Test simple query
      const { data, error } = await supabase
        .from('thiet_bi')
        .select('id')
        .limit(1)

      if (error) {
        addLog(`❌ Basic query failed: ${error.message}`)
      } else {
        addLog('✅ Basic Supabase connection works')
        addLog(`Found ${data?.length || 0} equipment records`)
      }
    } catch (err: any) {
      addLog(`❌ Connection error: ${err.message}`)
    }
  }

  const testRealtimeConnection = () => {
    addLog('Testing realtime connection...')
    
    if (!supabase) {
      addLog('❌ Supabase client not initialized')
      return
    }

    // Create a simple test channel
    const channel = supabase.channel('test-channel')

    channel.on('system', {}, (payload) => {
      addLog(`System event: ${JSON.stringify(payload)}`)
    })

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'thiet_bi'
      },
      (payload) => {
        addLog(`Database change: ${payload.eventType} on thiet_bi`)
        addLog(`Payload: ${JSON.stringify(payload, null, 2)}`)
      }
    )

    channel.subscribe((status) => {
      addLog(`Channel subscription status: ${status}`)
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        addLog('✅ Realtime connection successful!')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setIsConnected(false)
        addLog('❌ Realtime connection failed')
      }
    })

    // Cleanup after 30 seconds
    setTimeout(() => {
      addLog('Cleaning up test channel...')
      supabase.removeChannel(channel)
      setIsConnected(false)
    }, 30000)
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    addLog('Test page loaded')
    addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    addLog(`Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`)
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Realtime Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testBasicConnection}>
              Test Basic Connection
            </Button>
            <Button onClick={testRealtimeConnection}>
              Test Realtime Connection
            </Button>
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
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
        </CardContent>
      </Card>
    </div>
  )
}
