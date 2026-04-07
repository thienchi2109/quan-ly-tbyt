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
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  // Temporarily disable useRealtimeSync to avoid conflict with RealtimeProvider
  // useDashboardRealtimeSync()
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <h1 className="welcome-banner-title">
            Chào mừng{user?.full_name ? ` ${user.full_name}` : ''} quay trở lại
          </h1>
          <p className="welcome-banner-subtitle">
            Hệ thống Quản lý thiết bị y tế của CDC Cần Thơ
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Quick Actions Section */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Thao tác nhanh</CardTitle>
          <CardDescription className="text-sm">
            Truy cập nhanh các chức năng chính của hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid gap-3 grid-cols-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            <Button asChild size="lg" variant="outline" className="mobile-quick-action">
              <Link href="/equipment?action=add">
                <Plus className="mobile-quick-action-icon" />
                <div className="mobile-quick-action-text">
                  <div className="mobile-quick-action-title">Thêm thiết bị</div>
                  <div className="mobile-quick-action-desc">Đăng ký thiết bị mới vào hệ thống</div>
                </div>
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="mobile-quick-action">
              <Link href="/maintenance?action=create">
                <ClipboardList className="mobile-quick-action-icon" />
                <div className="mobile-quick-action-text">
                  <div className="mobile-quick-action-title">Lập kế hoạch</div>
                  <div className="mobile-quick-action-desc">Tạo kế hoạch bảo trì, hiệu chuẩn, kiểm định</div>
                </div>
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="mobile-quick-action">
              <Link href="/qr-scanner">
                <QrCode className="mobile-quick-action-icon" />
                <div className="mobile-quick-action-text">
                  <div className="mobile-quick-action-title">Quét mã QR</div>
                  <div className="mobile-quick-action-desc">Quét mã QR thiết bị nhanh chóng</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Widget */}
      <CalendarWidget />

      {/* Monthly Summary and Main Content */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            <EquipmentAttentionTable />
            <MaintenancePlansTable />
          </div>
        </div>

        {/* Monthly Maintenance Summary */}
        <MonthlyMaintenanceSummary />
      </div>
    </div>
  )
}
