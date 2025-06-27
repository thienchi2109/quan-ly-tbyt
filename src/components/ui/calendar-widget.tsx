"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useCalendarData, type CalendarEvent } from "@/hooks/use-calendar-data"
import { TaskType } from "@/lib/data"

interface CalendarWidgetProps {
  className?: string
}

const getEventTypeColor = (type: TaskType, isCompleted: boolean) => {
  if (isCompleted) {
    return "bg-green-100 text-green-800 border-green-200"
  }
  
  switch (type) {
    case "Bảo trì":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Hiệu chuẩn":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "Kiểm định":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getEventTypeIcon = (type: TaskType) => {
  switch (type) {
    case "Bảo trì":
      return "🔧"
    case "Hiệu chuẩn":
      return "📏"
    case "Kiểm định":
      return "✅"
    default:
      return "📅"
  }
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { toast } = useToast()

  // Get calendar range
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Fetch data using custom hook
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const { data, isLoading, error } = useCalendarData(year, month)

  const events = data?.events || []
  const departments = data?.departments || []
  const stats = data?.stats || { total: 0, completed: 0, pending: 0, byType: {} }

  // Show error toast
  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải lịch bảo trì."
      })
    }
  }, [error, toast])

  // Filter events by department
  const filteredEvents = React.useMemo(() => {
    if (selectedDepartment === "all") return events
    return events.filter(event => event.department === selectedDepartment)
  }, [events, selectedDepartment])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date))
  }

  // Get filtered statistics
  const filteredStats = React.useMemo(() => {
    const total = filteredEvents.length
    const completed = filteredEvents.filter(e => e.isCompleted).length
    const pending = total - completed
    const byType = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<TaskType, number>)

    return { total, completed, pending, byType }
  }, [filteredEvents])

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Lịch Bảo trì/Hiệu chuẩn/Kiểm định
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn khoa/phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa/phòng</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredStats.total}</div>
            <div className="text-sm text-muted-foreground">Tổng công việc</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{filteredStats.completed}</div>
            <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{filteredStats.pending}</div>
            <div className="text-sm text-muted-foreground">Chưa hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(filteredStats.byType).length}
            </div>
            <div className="text-sm text-muted-foreground">Loại công việc</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hôm nay
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h3>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <Dialog key={day.toISOString()}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`h-20 p-1 flex flex-col items-start justify-start relative hover:bg-muted/50 ${
                          !isCurrentMonth ? 'text-muted-foreground' : ''
                        } ${isToday ? 'bg-primary/10 border border-primary/20' : ''}`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <span className="text-sm font-medium">
                          {format(day, 'd')}
                        </span>
                        
                        {/* Event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 max-w-full">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`w-2 h-2 rounded-full ${
                                  event.isCompleted ? 'bg-green-500' : 
                                  event.type === 'Bảo trì' ? 'bg-blue-500' :
                                  event.type === 'Hiệu chuẩn' ? 'bg-orange-500' : 'bg-purple-500'
                                }`}
                                title={`${event.type}: ${event.title}`}
                              />
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{dayEvents.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </Button>
                    </DialogTrigger>

                    {/* Day details dialog */}
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Công việc ngày {format(day, 'dd/MM/yyyy', { locale: vi })}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <ScrollArea className="max-h-96">
                        {dayEvents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Không có công việc nào được lên lịch.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {dayEvents.map(event => (
                              <div key={event.id} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                                    <Badge className={getEventTypeColor(event.type, event.isCompleted)}>
                                      {event.type}
                                      {event.isCompleted && " ✓"}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <h4 className="font-medium mb-1">{event.title}</h4>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Mã TB: {event.equipmentCode}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Khoa/Phòng: {event.department}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Kế hoạch: {event.planName}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Bảo trì</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm">Hiệu chuẩn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm">Kiểm định</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Đã hoàn thành</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 