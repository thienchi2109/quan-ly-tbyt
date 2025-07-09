"use client"

import Link from "next/link"
import { Package, HardHat, Wrench, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useTotalEquipment,
  useMaintenanceCount,
  useRepairRequestStats,
  useMaintenancePlanStats
} from "@/hooks/use-dashboard-stats"

// Total Equipment Card
export function TotalEquipmentCard() {
  const { data: totalDevices, isLoading, error } = useTotalEquipment()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Tổng số thiết bị
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : error ? (
          <div className="text-2xl font-bold text-destructive">--</div>
        ) : (
          <div className="text-2xl font-bold">{totalDevices}</div>
        )}
        <p className="text-xs text-muted-foreground">
          Thiết bị đang được quản lý
        </p>
      </CardContent>
    </Card>
  )
}

// Maintenance Count Card
export function MaintenanceCountCard() {
  const { data: maintenanceCount, isLoading, error } = useMaintenanceCount()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Cần bảo trì/hiệu chuẩn
        </CardTitle>
        <HardHat className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : error ? (
          <div className="text-2xl font-bold text-destructive">--</div>
        ) : (
          <div className="text-2xl font-bold">{maintenanceCount}</div>
        )}
        <p className="text-xs text-muted-foreground">
          Thiết bị có lịch bảo trì hoặc hiệu chuẩn
        </p>
      </CardContent>
    </Card>
  )
}

// Repair Requests Card
export function RepairRequestsCard() {
  const { data: repairStats, isLoading, error } = useRepairRequestStats()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Yêu cầu sửa chữa</CardTitle>
        <Wrench className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : error ? (
          <div className="text-2xl font-bold text-destructive">--</div>
        ) : (
          <div className="text-2xl font-bold">{repairStats?.total || 0}</div>
        )}
        {isLoading ? (
          <Skeleton className="h-3 w-32" />
        ) : (
          <p className="text-xs text-muted-foreground">
            {error ? (
              "Lỗi tải dữ liệu"
            ) : (
              `${repairStats?.pending || 0} chờ xử lý • ${repairStats?.approved || 0} đã duyệt • ${repairStats?.completed || 0} hoàn thành`
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Maintenance Plans Card
export function MaintenancePlansCard() {
  const { data: planStats, isLoading, error } = useMaintenancePlanStats()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Kế hoạch BT/HC/KĐ</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : error ? (
          <div className="text-2xl font-bold text-destructive">--</div>
        ) : (
          <div className="text-2xl font-bold">{planStats?.total || 0}</div>
        )}
        {isLoading ? (
          <Skeleton className="h-3 w-24" />
        ) : (
          <p className="text-xs text-muted-foreground">
            {error ? (
              "Lỗi tải dữ liệu"
            ) : (
              `${planStats?.draft || 0} nháp • ${planStats?.approved || 0} đã duyệt`
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Combined KPI Cards Component
export function KPICards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <TotalEquipmentCard />
      <MaintenanceCountCard />
      <RepairRequestsCard />
      <MaintenancePlansCard />
    </div>
  )
}
