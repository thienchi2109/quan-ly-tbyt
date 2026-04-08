"use client"

import type { ReactNode } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface RepairRequestSheetFrameProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
  trigger?: ReactNode
  contentClassName?: string
}

export function RepairRequestSheetFrame({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  contentClassName = "w-full overflow-y-auto sm:max-w-xl md:max-w-2xl",
}: RepairRequestSheetFrameProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent side="right" className={contentClassName}>
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {children}
        {footer ? <SheetFooter className="mt-6">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
