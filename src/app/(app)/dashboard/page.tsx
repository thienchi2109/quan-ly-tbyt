import Link from "next/link"
import {
  ArrowUpRight,
  HardHat,
  Package,
  Wrench,
  Calendar,
  Plus,
  QrCode,
  ClipboardList,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Equipment, type MaintenancePlan } from "@/lib/data"
import { supabase, supabaseError } from "@/lib/supabase"

export default async function Dashboard() {
  let totalDevices = 0;
  let upcomingMaintenance = 0;
  let repairRequestsCount = 0;
  let equipmentNeedingAttention: Equipment[] = [];
  let maintenancePlans: MaintenancePlan[] = [];

  if (supabase) {
    const { count: devicesCount } = await supabase
      .from('thiet_bi')
      .select('*', { count: 'exact', head: true });
    totalDevices = devicesCount ?? 0;

    const { count: maintenanceCount } = await supabase
      .from('thiet_bi')
      .select('*', { count: 'exact', head: true })
      .in('tinh_trang_hien_tai', ['Chờ bảo trì', 'Chờ hiệu chuẩn/kiểm định']);
    upcomingMaintenance = maintenanceCount ?? 0;

    const { count: requestsCount } = await supabase
      .from('yeu_cau_sua_chua')
      .select('*', { count: 'exact', head: true })
      .in('trang_thai', ['Chờ xử lý', 'Đang xử lý']);
    repairRequestsCount = requestsCount ?? 0;

    const { data: attentionData } = await supabase
      .from('thiet_bi')
      .select('*')
      .in('tinh_trang_hien_tai', ['Chờ sửa chữa', 'Chờ bảo trì', 'Chờ hiệu chuẩn/kiểm định'])
      .limit(5)
      .order('ngay_bt_tiep_theo', { ascending: true, nullsFirst: false });
    equipmentNeedingAttention = attentionData as Equipment[] ?? [];

    // Fetch maintenance plans
    const { data: plansData } = await supabase
      .from('ke_hoach_bao_tri')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    maintenancePlans = plansData as MaintenancePlan[] ?? [];
  }

  const getStatusVariant = (status: MaintenancePlan["trang_thai"]) => {
    switch (status) {
      case "Bản nháp":
        return "secondary"
      case "Đã duyệt":
        return "default"
      default:
        return "outline"
    }
  }

  const totalPlans = maintenancePlans.length;
  const draftPlans = maintenancePlans.filter(p => p.trang_thai === 'Bản nháp').length;
  const approvedPlans = maintenancePlans.filter(p => p.trang_thai === 'Đã duyệt').length;

  if (supabaseError) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lỗi kết nối</CardTitle>
                <CardDescription>{supabaseError}</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số thiết bị
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Thiết bị đang được quản lý
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cần bảo trì/hiệu chuẩn
            </CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Thiết bị có lịch bảo trì hoặc hiệu chuẩn
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu sửa chữa</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repairRequestsCount}</div>
            <p className="text-xs text-muted-foreground">
              Yêu cầu đang hoạt động
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kế hoạch BT/HC/KĐ</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              {draftPlans} nháp • {approvedPlans} đã duyệt
            </p>
          </CardContent>
        </Card>
      </div>
      
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
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Thiết bị cần chú ý</CardTitle>
              <CardDescription>
                Danh sách các thiết bị cần sửa chữa hoặc đang bảo trì.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/equipment">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thiết bị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Vị trí</TableHead>
                  <TableHead className="text-right">Ngày BT tiếp theo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentNeedingAttention.length > 0 ? equipmentNeedingAttention.map((item: Equipment) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <div className="font-medium">{item.ten_thiet_bi}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {item.model}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={item.tinh_trang_hien_tai === 'Chờ sửa chữa' ? 'destructive' : 'secondary'}>
                                {item.tinh_trang_hien_tai}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{item.vi_tri_lap_dat}</TableCell>
                        <TableCell className="text-right">{item.ngay_bt_tiep_theo || 'N/A'}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Không có thiết bị nào cần chú ý.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Kế hoạch BT/HC/KĐ gần đây</CardTitle>
              <CardDescription>
                Danh sách các kế hoạch bảo trì, hiệu chuẩn, kiểm định mới nhất.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/maintenance">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên kế hoạch</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Năm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenancePlans.length > 0 ? maintenancePlans.map((plan: MaintenancePlan) => (
                    <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell>
                            <Link 
                              href={`/maintenance?planId=${plan.id}&tab=tasks`}
                              className="block w-full hover:no-underline"
                            >
                              <div className="font-medium">{plan.ten_ke_hoach}</div>
                              <div className="text-sm text-muted-foreground">
                                  {plan.khoa_phong || 'Tổng thể'}
                              </div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link 
                              href={`/maintenance?planId=${plan.id}&tab=tasks`}
                              className="block w-full hover:no-underline"
                            >
                              <Badge variant="outline">{plan.loai_cong_viec}</Badge>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link 
                              href={`/maintenance?planId=${plan.id}&tab=tasks`}
                              className="block w-full hover:no-underline"
                            >
                              <Badge variant={getStatusVariant(plan.trang_thai)}>
                                  {plan.trang_thai}
                              </Badge>
                            </Link>
                        </TableCell>
                        <TableCell className="text-right">
                            <Link 
                              href={`/maintenance?planId=${plan.id}&tab=tasks`}
                              className="block w-full hover:no-underline"
                            >
                              {plan.nam}
                            </Link>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Chưa có kế hoạch nào.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
