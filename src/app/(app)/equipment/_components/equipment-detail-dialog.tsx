"use client"

import * as React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { AlertCircle, Link as LinkIcon, Loader2, Printer, QrCode, Trash2 } from "lucide-react"

import { UsageHistoryTab } from "@/components/usage-history-tab"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Equipment } from "@/lib/data"

import {
  type Attachment,
  columnLabels,
  getHistoryIcon,
  type HistoryItem,
  renderEquipmentFieldValue,
} from "../_lib/equipment-page-config"

type EquipmentDetailDialogProps = {
  equipment: Equipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTab: string
  onTabChange: (value: string) => void
  attachments: Attachment[]
  history: HistoryItem[]
  isLoadingAttachments: boolean
  isLoadingHistory: boolean
  newFileName: string
  newFileUrl: string
  isSubmittingAttachment: boolean
  deletingAttachmentId: string | null
  onNewFileNameChange: (value: string) => void
  onNewFileUrlChange: (value: string) => void
  onAddAttachment: (event: React.FormEvent) => void
  onDeleteAttachment: (attachmentId: string) => void
  onGenerateDeviceLabel: (equipment: Equipment) => void
  onGenerateProfileSheet: (equipment: Equipment) => void
}

export function EquipmentDetailDialog({
  equipment,
  open,
  onOpenChange,
  currentTab,
  onTabChange,
  attachments,
  history,
  isLoadingAttachments,
  isLoadingHistory,
  newFileName,
  newFileUrl,
  isSubmittingAttachment,
  deletingAttachmentId,
  onNewFileNameChange,
  onNewFileUrlChange,
  onAddAttachment,
  onDeleteAttachment,
  onGenerateDeviceLabel,
  onGenerateProfileSheet,
}: EquipmentDetailDialogProps) {
  if (!equipment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chi tiết thiết bị: {equipment.ten_thiet_bi}</DialogTitle>
          <DialogDescription>
            Mã thiết bị: {equipment.ma_thiet_bi}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={currentTab} onValueChange={onTabChange} className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="shrink-0">
            <TabsTrigger value="details">Thông tin chi tiết</TabsTrigger>
            <TabsTrigger value="files">File đính kèm</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
            <TabsTrigger value="usage">Nhật ký sử dụng</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                {(Object.keys(columnLabels) as Array<keyof Equipment>).map((key) => {
                  if (key === "id") return null

                  return (
                    <div key={key} className="border-b pb-2">
                      <p className="text-xs font-medium text-muted-foreground">{columnLabels[key]}</p>
                      <div className="font-semibold break-words">
                        {renderEquipmentFieldValue(equipment, key)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="files" className="flex-grow overflow-hidden">
            <div className="h-full flex flex-col gap-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thêm file đính kèm mới</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onAddAttachment} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="file-name">Tên file</Label>
                      <Input
                        id="file-name"
                        placeholder="VD: Giấy chứng nhận hiệu chuẩn"
                        value={newFileName}
                        onChange={(event) => onNewFileNameChange(event.target.value)}
                        required
                        disabled={isSubmittingAttachment}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="file-url">Đường dẫn (URL)</Label>
                      <Input
                        id="file-url"
                        type="url"
                        placeholder="https://..."
                        value={newFileUrl}
                        onChange={(event) => onNewFileUrlChange(event.target.value)}
                        required
                        disabled={isSubmittingAttachment}
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Làm thế nào để lấy URL?</AlertTitle>
                      <AlertDescription>
                        Tải file của bạn lên{" "}
                        <a
                          href="https://drive.google.com/open?id=1-lgEygGCIfxCbIIdgaCmh3GFJgAMr63e&usp=drive_fs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          thư mục Drive chung
                        </a>
                        , sau đó lấy link chia sẻ công khai và dán vào đây.
                      </AlertDescription>
                    </Alert>
                    <Button type="submit" disabled={isSubmittingAttachment || !newFileName || !newFileUrl}>
                      {isSubmittingAttachment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Lưu liên kết
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="flex-grow overflow-hidden">
                <p className="font-medium mb-2">Danh sách file đã đính kèm</p>
                <ScrollArea className="h-full pr-4">
                  {isLoadingAttachments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có file nào được đính kèm.</p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                          <Link href={file.duong_dan_luu_tru} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                            <LinkIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{file.ten_file}</span>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteAttachment(file.id)}
                            disabled={!!deletingAttachmentId}
                          >
                            {deletingAttachmentId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history" className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4 py-4">
              {isLoadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="font-semibold">Chưa có lịch sử</p>
                  <p className="text-sm">Mọi hoạt động sửa chữa, bảo trì sẽ được ghi lại tại đây.</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                  {history.map((item) => (
                    <div key={item.id} className="relative mb-8 last:mb-0">
                      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background -translate-x-1/2 ml-3"></div>
                      <div className="pl-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            {getHistoryIcon(item.loai_su_kien)}
                          </div>
                          <div>
                            <p className="font-semibold">{item.loai_su_kien}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(item.ngay_thuc_hien), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 ml-10 p-3 rounded-md bg-muted/50 border">
                          <p className="text-sm font-medium">{item.mo_ta}</p>
                          {item.chi_tiet?.mo_ta_su_co && <p className="text-sm text-muted-foreground mt-1">Sự cố: {item.chi_tiet.mo_ta_su_co}</p>}
                          {item.chi_tiet?.hang_muc_sua_chua && <p className="text-sm text-muted-foreground">Hạng mục: {item.chi_tiet.hang_muc_sua_chua}</p>}
                          {item.chi_tiet?.nguoi_yeu_cau && <p className="text-sm text-muted-foreground">Người yêu cầu: {item.chi_tiet.nguoi_yeu_cau}</p>}
                          {item.chi_tiet?.ten_ke_hoach && <p className="text-sm text-muted-foreground mt-1">Kế hoạch: {item.chi_tiet.ten_ke_hoach}</p>}
                          {item.chi_tiet?.thang && <p className="text-sm text-muted-foreground">Tháng: {item.chi_tiet.thang}/{item.chi_tiet.nam}</p>}
                          {item.chi_tiet?.ma_yeu_cau && <p className="text-sm text-muted-foreground mt-1">Mã yêu cầu: {item.chi_tiet.ma_yeu_cau}</p>}
                          {item.chi_tiet?.loai_hinh && (
                            <p className="text-sm text-muted-foreground">
                              Loại hình: {item.chi_tiet.loai_hinh === "noi_bo" ? "Nội bộ" : item.chi_tiet.loai_hinh === "ben_ngoai" ? "Bên ngoài" : "Thanh lý"}
                            </p>
                          )}
                          {item.chi_tiet?.khoa_phong_hien_tai && item.chi_tiet?.khoa_phong_nhan && (
                            <p className="text-sm text-muted-foreground">Từ: {item.chi_tiet.khoa_phong_hien_tai} → {item.chi_tiet.khoa_phong_nhan}</p>
                          )}
                          {item.chi_tiet?.don_vi_nhan && <p className="text-sm text-muted-foreground">Đơn vị nhận: {item.chi_tiet.don_vi_nhan}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="usage" className="flex-grow overflow-hidden">
            <div className="h-full py-4">
              <UsageHistoryTab equipment={equipment as never} />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="shrink-0 pt-4 border-t">
          <Button variant="secondary" onClick={() => onGenerateDeviceLabel(equipment)}>
            <QrCode className="mr-2 h-4 w-4" />
            Tạo nhãn thiết bị
          </Button>
          <Button onClick={() => onGenerateProfileSheet(equipment)}>
            <Printer className="mr-2 h-4 w-4" />
            In lý lịch
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
