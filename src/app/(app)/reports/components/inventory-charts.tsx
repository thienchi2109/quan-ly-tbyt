"use client"

import * as React from "react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryItem } from "../hooks/use-inventory-data"
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { vi } from "date-fns/locale"

interface InventoryChartsProps {
  data: InventoryItem[]
  isLoading: boolean
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function InventoryCharts({ data, isLoading }: InventoryChartsProps) {
  // Process data for different chart types
  const processedData = React.useMemo(() => {
    if (!data.length) return { monthlyTrend: [], departmentData: [], sourceData: [], transferPurposeData: [] }

    // Group by month for trend chart
    const monthlyData = new Map<string, { month: string; nhap: number; xuat: number; ton: number }>()
    
    // Get date range from data
    const dates = data.map(item => parseISO(item.ngay_nhap))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    // Generate all months in range
    const months = eachMonthOfInterval({ start: startOfMonth(minDate), end: endOfMonth(maxDate) })
    
    months.forEach(month => {
      const monthKey = format(month, 'yyyy-MM')
      const monthLabel = format(month, 'MM/yyyy')
      monthlyData.set(monthKey, { month: monthLabel, nhap: 0, xuat: 0, ton: 0 })
    })

    // Count imports and exports by month
    data.forEach(item => {
      const monthKey = format(parseISO(item.ngay_nhap), 'yyyy-MM')
      const existing = monthlyData.get(monthKey)
      if (existing) {
        if (item.type === 'import') {
          existing.nhap += 1
        } else {
          existing.xuat += 1
        }
      }
    })

    // Calculate cumulative stock (simplified)
    let cumulativeStock = 0
    const monthlyTrend = Array.from(monthlyData.values()).map(item => {
      cumulativeStock += item.nhap - item.xuat
      return { ...item, ton: Math.max(0, cumulativeStock) }
    })

    // Group by department
    const deptMap = new Map<string, { department: string; nhap: number; xuat: number }>()
    data.forEach(item => {
      const dept = item.khoa_phong_quan_ly || 'Chưa phân loại'
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { department: dept, nhap: 0, xuat: 0 })
      }
      const existing = deptMap.get(dept)!
      if (item.type === 'import') {
        existing.nhap += 1
      } else {
        existing.xuat += 1
      }
    })
    const departmentData = Array.from(deptMap.values()).sort((a, b) => (b.nhap + b.xuat) - (a.nhap + a.xuat))

    // Group by source for imports
    const sourceMap: Record<string, number> = {}
    data.filter(item => item.type === 'import').forEach(item => {
      const source = item.source === 'manual' ? 'Thêm thủ công' : 
                     item.source === 'excel' ? 'Import Excel' : 'Khác'
      sourceMap[source] = (sourceMap[source] || 0) + 1
    })
    const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }))

    // Group by transfer purpose for exports
    const purposeMap: Record<string, number> = {}
    data.filter(item => item.type === 'export').forEach(item => {
      let purpose = 'Khác';
      if (item.source === 'transfer_internal') {
        purpose = 'Luân chuyển nội bộ';
      } else if (item.source === 'transfer_external') {
        purpose = 'Luân chuyển bên ngoài';
      } else if (item.source === 'liquidation') {
        purpose = 'Thanh lý';
      }
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1
    })
    const transferPurposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }))

    return { monthlyTrend, departmentData, sourceData, transferPurposeData }
  }, [data])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="trend" className="space-y-4">
      <TabsList>
        <TabsTrigger value="trend">Xu hướng theo thời gian</TabsTrigger>
        <TabsTrigger value="department">Theo khoa/phòng</TabsTrigger>
        <TabsTrigger value="distribution">Phân bố nguồn</TabsTrigger>
      </TabsList>

      <TabsContent value="trend" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {/* Monthly trend line chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Xu hướng xuất-nhập-tồn theo tháng</CardTitle>
              <CardDescription>
                Biểu đồ đường thể hiện xu hướng nhập, xuất và tồn kho theo thời gian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={processedData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Tháng ${label}`}
                    formatter={(value, name) => [
                      value,
                      name === 'nhap' ? 'Thiết bị nhập' :
                      name === 'xuat' ? 'Thiết bị xuất' : 'Tồn kho'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'nhap' ? 'Thiết bị nhập' :
                      value === 'xuat' ? 'Thiết bị xuất' : 'Tồn kho'
                    }
                  />
                  <Line type="monotone" dataKey="nhap" stroke="#00C49F" strokeWidth={2} />
                  <Line type="monotone" dataKey="xuat" stroke="#FF8042" strokeWidth={2} />
                  <Line type="monotone" dataKey="ton" stroke="#0088FE" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area chart for cumulative */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Biểu đồ tích lũy</CardTitle>
              <CardDescription>
                Biểu đồ vùng thể hiện sự tích lũy của hoạt động nhập-xuất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={processedData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Tháng ${label}`}
                    formatter={(value, name) => [
                      value,
                      name === 'nhap' ? 'Thiết bị nhập' : 'Thiết bị xuất'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'nhap' ? 'Thiết bị nhập' : 'Thiết bị xuất'
                    }
                  />
                  <Area type="monotone" dataKey="nhap" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.7} />
                  <Area type="monotone" dataKey="xuat" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="department" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo khoa/phòng</CardTitle>
            <CardDescription>
              So sánh hoạt động xuất-nhập thiết bị giữa các khoa/phòng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={processedData.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'nhap' ? 'Thiết bị nhập' : 'Thiết bị xuất'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'nhap' ? 'Thiết bị nhập' : 'Thiết bị xuất'
                  }
                />
                <Bar dataKey="nhap" fill="#00C49F" />
                <Bar dataKey="xuat" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="distribution" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Import sources pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>Nguồn nhập thiết bị</CardTitle>
              <CardDescription>
                Phân bố các nguồn nhập thiết bị vào hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {processedData.sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Export purposes pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mục đích xuất thiết bị</CardTitle>
              <CardDescription>
                Phân bố các hình thức xuất thiết bị khỏi hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.transferPurposeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {processedData.transferPurposeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
} 