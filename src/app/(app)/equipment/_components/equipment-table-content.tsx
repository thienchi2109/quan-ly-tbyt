"use client"

import * as React from "react"
import { flexRender, type Table as ReactTable } from "@tanstack/react-table"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MobileEquipmentListItem } from "@/components/mobile-equipment-list-item"
import { type Equipment } from "@/lib/data"

type EquipmentTableContentProps = {
  table: ReactTable<Equipment>
  isLoading: boolean
  isMobile: boolean
  columnsLength: number
  onShowDetails: (equipment: Equipment) => void
  onEdit: React.Dispatch<React.SetStateAction<Equipment | null>>
}

export function EquipmentTableContent({
  table,
  isLoading,
  isMobile,
  columnsLength,
  onShowDetails,
  onEdit,
}: EquipmentTableContentProps) {
  if (isLoading) {
    return isMobile ? (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-start justify-between pb-4">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <Skeleton className="h-5 w-full" />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={columnsLength}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (table.getRowModel().rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Không có kết quả.
      </div>
    )
  }

  return isMobile ? (
    <div className="space-y-2">
      {table.getRowModel().rows.map((row) => (
        <MobileEquipmentListItem
          key={row.original.id}
          equipment={row.original}
          onShowDetails={onShowDetails}
          onEdit={onEdit}
        />
      ))}
    </div>
  ) : (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted hover:bg-muted">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              data-equipment-id={row.original.id}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
