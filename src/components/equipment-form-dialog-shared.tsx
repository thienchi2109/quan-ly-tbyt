"use client"

import { Loader2 } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RequiredFormLabel } from "@/components/ui/required-form-label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type Equipment } from "@/lib/data"

export const equipmentStatusOptions = [
  "Hoạt động",
  "Chờ sửa chữa",
  "Chờ bảo trì",
  "Chờ hiệu chuẩn/kiểm định",
  "Ngưng sử dụng",
  "Chưa có nhu cầu sử dụng",
] as const

export const nd98ClassificationOptions = ["A", "B", "C", "D"] as const

const requiredStringField = (message: string) =>
  z.preprocess(
    (value) => (value == null ? "" : value),
    z.string().trim().min(1, message),
  )

export const equipmentFormSchema = z.object({
  ma_thiet_bi: requiredStringField("Mã thiết bị là bắt buộc"),
  ten_thiet_bi: requiredStringField("Tên thiết bị là bắt buộc"),
  model: z.string().optional().nullable(),
  serial: z.string().optional().nullable(),
  hang_san_xuat: z.string().optional().nullable(),
  noi_san_xuat: z.string().optional().nullable(),
  nam_san_xuat: z.coerce.number().optional().nullable(),
  ngay_nhap: z.string().optional().nullable(),
  ngay_dua_vao_su_dung: z.string().optional().nullable(),
  nguon_kinh_phi: z.string().optional().nullable(),
  gia_goc: z.coerce.number().optional().nullable(),
  han_bao_hanh: z.string().optional().nullable(),
  vi_tri_lap_dat: requiredStringField("Vị trí lắp đặt là bắt buộc"),
  khoa_phong_quan_ly: requiredStringField("Khoa/Phòng quản lý là bắt buộc"),
  nguoi_dang_truc_tiep_quan_ly: requiredStringField("Người trực tiếp quản lý (sử dụng) là bắt buộc"),
  tinh_trang_hien_tai: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(equipmentStatusOptions, { required_error: "Tình trạng hiện tại là bắt buộc" }),
  ),
  cau_hinh_thiet_bi: z.string().optional().nullable(),
  phu_kien_kem_theo: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  phan_loai_theo_nd98: z.enum(nd98ClassificationOptions).optional().nullable(),
})

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>

export const equipmentFormDefaultValues: Partial<EquipmentFormValues> = {
  ma_thiet_bi: "",
  ten_thiet_bi: "",
  model: "",
  serial: "",
  hang_san_xuat: "",
  noi_san_xuat: "",
  nam_san_xuat: null,
  ngay_nhap: "",
  ngay_dua_vao_su_dung: "",
  nguon_kinh_phi: "",
  gia_goc: null,
  han_bao_hanh: "",
  vi_tri_lap_dat: "",
  khoa_phong_quan_ly: "",
  nguoi_dang_truc_tiep_quan_ly: "",
  tinh_trang_hien_tai: undefined,
  cau_hinh_thiet_bi: "",
  phu_kien_kem_theo: "",
  ghi_chu: "",
  phan_loai_theo_nd98: null,
}

export function isNd98Classification(
  value: string | null | undefined,
): value is EquipmentFormValues["phan_loai_theo_nd98"] {
  return value !== null && value !== undefined && nd98ClassificationOptions.includes(value as typeof nd98ClassificationOptions[number])
}

export function toEquipmentFormValues(equipment: Equipment): Partial<EquipmentFormValues> {
  return {
    ma_thiet_bi: equipment.ma_thiet_bi,
    ten_thiet_bi: equipment.ten_thiet_bi,
    model: equipment.model ?? null,
    serial: equipment.serial ?? null,
    hang_san_xuat: equipment.hang_san_xuat ?? null,
    noi_san_xuat: equipment.noi_san_xuat ?? null,
    nam_san_xuat: equipment.nam_san_xuat ?? undefined,
    ngay_nhap: equipment.ngay_nhap ?? null,
    ngay_dua_vao_su_dung: equipment.ngay_dua_vao_su_dung ?? null,
    nguon_kinh_phi: equipment.nguon_kinh_phi ?? null,
    gia_goc: equipment.gia_goc ?? undefined,
    han_bao_hanh: equipment.han_bao_hanh ?? null,
    vi_tri_lap_dat: equipment.vi_tri_lap_dat ?? "",
    khoa_phong_quan_ly: equipment.khoa_phong_quan_ly ?? "",
    nguoi_dang_truc_tiep_quan_ly: equipment.nguoi_dang_truc_tiep_quan_ly ?? "",
    tinh_trang_hien_tai: equipment.tinh_trang_hien_tai ?? undefined,
    cau_hinh_thiet_bi: equipment.cau_hinh_thiet_bi ?? null,
    phu_kien_kem_theo: equipment.phu_kien_kem_theo ?? null,
    ghi_chu: equipment.ghi_chu ?? null,
    phan_loai_theo_nd98: isNd98Classification(equipment.phan_loai_theo_nd98) ? equipment.phan_loai_theo_nd98 : null,
  }
}

type EquipmentFormDialogSharedProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<EquipmentFormValues>
  title: string
  description: string
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: EquipmentFormValues) => void | Promise<void>
  departments?: string[]
  showDepartmentSuggestions?: boolean
  showNd98Classification?: boolean
}

export function EquipmentFormDialogShared({
  open,
  onOpenChange,
  form,
  title,
  description,
  submitLabel,
  isSubmitting,
  onSubmit,
  departments = [],
  showDepartmentSuggestions = false,
  showNd98Classification = false,
}: EquipmentFormDialogSharedProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ma_thiet_bi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã thiết bị</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: EQP-001" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ten_thiet_bi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên thiết bị</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Máy siêu âm" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hang_san_xuat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hãng sản xuất</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noi_san_xuat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nơi sản xuất</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nam_san_xuat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Năm sản xuất</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const value = event.target.value
                            field.onChange(value === "" ? null : Number(value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ngay_nhap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày nhập</FormLabel>
                        <FormControl>
                          <Input placeholder="DD/MM/YYYY" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ngay_dua_vao_su_dung"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày đưa vào sử dụng</FormLabel>
                        <FormControl>
                          <Input placeholder="DD/MM/YYYY" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nguon_kinh_phi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nguồn kinh phí</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gia_goc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giá gốc (VNĐ)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => {
                              const value = event.target.value
                              field.onChange(value === "" ? null : Number(value))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="han_bao_hanh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hạn bảo hành</FormLabel>
                      <FormControl>
                        <Input placeholder="DD/MM/YYYY" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="khoa_phong_quan_ly"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredFormLabel required>Khoa/Phòng quản lý</RequiredFormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Nhập hoặc chọn khoa/phòng" />
                        </FormControl>
                        {showDepartmentSuggestions && departments.length > 0 ? (
                          <ScrollArea className="mt-2 h-20 w-full rounded-md border p-2">
                            <div className="flex flex-wrap gap-2">
                              {departments.map((department) => (
                                <Badge
                                  key={department}
                                  variant="outline"
                                  className="cursor-pointer hover:border-blue-500 hover:bg-blue-100 hover:text-blue-800"
                                  onClick={() => form.setValue("khoa_phong_quan_ly", department, { shouldValidate: true })}
                                >
                                  {department}
                                </Badge>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vi_tri_lap_dat"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredFormLabel required>Vị trí lắp đặt</RequiredFormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nguoi_dang_truc_tiep_quan_ly"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredFormLabel required>Người trực tiếp quản lý (sử dụng)</RequiredFormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tinh_trang_hien_tai"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredFormLabel required>Tình trạng hiện tại</RequiredFormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tình trạng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {equipmentStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cau_hinh_thiet_bi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cấu hình thiết bị</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phu_kien_kem_theo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phụ kiện kèm theo</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ghi_chu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showNd98Classification ? (
                  <FormField
                    control={form.control}
                    name="phan_loai_theo_nd98"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phân loại TB theo NĐ 98</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phân loại" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nd98ClassificationOptions.map((classification) => (
                              <SelectItem key={classification} value={classification}>
                                {`Loại ${classification}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
