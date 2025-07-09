"use client"

import Link from "next/link"
import {
  Plus,
  QrCode,
  ClipboardList,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarWidget } from "@/components/ui/calendar-widget"
import { MonthlyMaintenanceSummary } from "@/components/monthly-maintenance-summary"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { EquipmentAttentionTable } from "@/components/dashboard/equipment-attention-table"
import { MaintenancePlansTable } from "@/components/dashboard/maintenance-plans-table"
import { useDashboardRealtimeSync } from "@/hooks/use-realtime-sync"

export default function Dashboard() {
  // Temporarily disable useRealtimeSync to avoid conflict with RealtimeProvider
  // useDashboardRealtimeSync()

  return (
    <>
      {/* KPI Cards */}
      <KPICards />
      
      {/* Quick Actions Section */}
      <div className="grid gap-4 md:gap-8">
  <Card>
    <CardHeader>
      <CardTitle>Thao tác nhanh</CardTitle>
      <CardDescription>
        Truy cập nhanh các chức năng chính của hệ thống.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 p-6">
          <Link href="/equipment?action=add">
            <Plus className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Thêm thiết bị</div>
              <div className="text-xs text-muted-foreground">Đăng ký thiết bị mới vào hệ thống</div>
            </div>
          </Link>
        </Button>
        
        <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 p-6">
          <Link href="/maintenance?action=create">
            <ClipboardList className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Lập kế hoạch BT/HC/KĐ</div>
              <div className="text-xs text-muted-foreground">Tạo kế hoạch bảo trì, hiệu chuẩn, kiểm định</div>
            </div>
          </Link>
        </Button>
        
        <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 p-6">
          <Link href="/qr-scanner">
            <QrCode className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Quét mã QR</div>
              <div className="text-xs text-muted-foreground">Quét mã QR thiết bị nhanh chóng</div>
            </div>
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
      </div>

      {/* Calendar Widget */}
      <div className="grid gap-4 md:gap-8">
        <CalendarWidget />
      </div>

      {/* Monthly Summary and Main Content */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <EquipmentAttentionTable />
            <MaintenancePlansTable />
          </div>
        </div>

        {/* Monthly Maintenance Summary */}
        <MonthlyMaintenanceSummary />
      </div>
    </>
  )
}
