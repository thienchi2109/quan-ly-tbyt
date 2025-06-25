"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function QRScannerPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Construction className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Tính năng đang phát triển</CardTitle>
            <CardDescription className="text-lg">
              Chức năng quét mã QR thiết bị y tế sẽ sớm được ra mắt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <QrCode className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quét mã QR thiết bị</h3>
              <p className="text-muted-foreground mb-4">
                Tính năng này sẽ cho phép bạn:
              </p>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  Quét mã QR trên thiết bị để xem thông tin chi tiết
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  Tra cứu nhanh lịch sử bảo trì và sửa chữa
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  Tạo yêu cầu sửa chữa trực tiếp từ thiết bị
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  Cập nhật trạng thái thiết bị nhanh chóng
                </li>
              </ul>
            </div>
            
            <div className="text-center pt-4">
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Về Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
