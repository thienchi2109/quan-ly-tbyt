"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryReportTab } from "./components/inventory-report-tab"
import { MaintenanceReportTab } from "./components/maintenance-report-tab"

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo</h2>
      </div>
      
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Xuất-Nhập-Tồn</TabsTrigger>
          <TabsTrigger value="maintenance">
            Bảo trì / Sửa chữa
          </TabsTrigger>
          <TabsTrigger value="utilization" disabled>
            Sử dụng thiết bị
            <span className="ml-1 text-xs text-muted-foreground">(Sắp ra mắt)</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryReportTab />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceReportTab />
        </TabsContent>
        
        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo Sử dụng thiết bị</CardTitle>
              <CardDescription>
                Báo cáo hiệu quả sử dụng, tình trạng hoạt động của thiết bị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                Tính năng đang được phát triển...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 