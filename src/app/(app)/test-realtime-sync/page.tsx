"use client"

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtimeDebug } from '@/hooks/use-realtime-debug'
import { 
  useTotalEquipment,
  useMaintenanceCount,
  useRepairRequestStats,
  useMaintenancePlanStats,
  useEquipmentAttention
} from '@/hooks/use-dashboard-stats'

export default function TestRealtimeSyncPage() {
  const [logs, setLogs] = useState<string[]>([])
  const queryClient = useQueryClient()
  
  // Get dashboard data
  const { data: totalEquipment, isLoading: equipmentLoading } = useTotalEquipment()
  const { data: maintenanceCount, isLoading: maintenanceLoading } = useMaintenanceCount()
  const { data: repairStats, isLoading: repairLoading } = useRepairRequestStats()
  const { data: planStats, isLoading: planLoading } = useMaintenancePlanStats()
  const { data: equipmentAttention, isLoading: attentionLoading } = useEquipmentAttention()
  
  // Get realtime debug info
  const { 
    isConnected, 
    connectionStatus, 
    lastUpdate, 
    queryStates,
    invalidateDashboard,
    refetchDashboard 
  } = useRealtimeDebug()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testDatabaseUpdate = async () => {
    addLog('Testing database update to trigger realtime...')
    
    if (!supabase) {
      addLog('❌ Supabase client not available')
      return
    }
    
    try {
      // Insert a test equipment record
      const { data, error } = await supabase
        .from('thiet_bi')
        .insert({
          ten_thiet_bi: 'Test Thiết Bị Realtime',
          ma_thiet_bi: `TEST-${Date.now()}`,
          model: 'Test Model',
          khoa_phong_quan_ly: 'Khoa Hành chính',
          nguoi_dang_truc_tiep_quan_ly: 1,
          tinh_trang_hien_tai: 'Hoạt động tốt',
          vi_tri_lap_dat: 'Test Location'
        })
        .select()

      if (error) {
        addLog(`❌ Insert failed: ${error.message}`)
      } else {
        addLog(`✅ Inserted test equipment: ${data[0]?.ma_thiet_bi}`)
        addLog('⏱️ Waiting for realtime sync...')
        
        // Delete after 10 seconds
        setTimeout(async () => {
          if (supabase) {
            await supabase
              .from('thiet_bi')
              .delete()
              .eq('id', data[0].id)
            addLog(`🗑️ Deleted test equipment: ${data[0]?.ma_thiet_bi}`)
          }
        }, 10000)
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`)
    }
  }

  const clearLogs = () => setLogs([])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Realtime Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Realtime Sync Test
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testDatabaseUpdate}>
              Test Database Update
            </Button>
            <Button variant="outline" onClick={invalidateDashboard}>
              Manual Invalidate
            </Button>
            <Button variant="outline" onClick={refetchDashboard}>
              Manual Refetch
            </Button>
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Dashboard Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipmentLoading ? '...' : totalEquipment}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Maintenance Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceLoading ? '...' : maintenanceCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repair Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {repairLoading ? '...' : repairStats?.total}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Maintenance Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planLoading ? '...' : planStats?.total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Attention Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Needing Attention</CardTitle>
        </CardHeader>
        <CardContent>
          {attentionLoading ? (
            <div>Loading equipment attention...</div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Found {equipmentAttention?.length || 0} equipment requiring attention
              </p>
              {equipmentAttention?.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm">
                  • {item.ten_thiet_bi} ({item.tinh_trang_hien_tai})
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query States */}
      <Card>
        <CardHeader>
          <CardTitle>Query States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {queryStates.map((state, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant={state.status === 'success' ? 'default' : 'destructive'}>
                  {state.status}
                </Badge>
                <span className="font-mono">{state.queryKey.join(' → ')}</span>
                <span className="text-muted-foreground">
                  Updated: {new Date(state.dataUpdatedAt).toLocaleTimeString()}
                </span>
                {state.isFetching && <Badge variant="outline">fetching</Badge>}
                {state.isStale && <Badge variant="secondary">stale</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
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