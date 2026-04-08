"use client"

import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface RepairDesiredDateFieldProps {
  label?: string
  value?: Date
  onSelect: (date: Date | undefined) => void
  disabledDate?: (date: Date) => boolean
  buttonClassName?: string
}

export function RepairDesiredDateField({
  label = "Ngày mong muốn hoàn thành (nếu có)",
  value,
  onSelect,
  disabledDate,
  buttonClassName,
}: RepairDesiredDateFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : <span>Chọn ngày</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onSelect}
            initialFocus
            disabled={disabledDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
