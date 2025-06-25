"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { USER_ROLES, type User, type UserRole } from "@/types/database"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: User | null
}

export function EditUserDialog({ open, onOpenChange, onSuccess, user }: EditUserDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
    full_name: "",
    role: "" as UserRole | "",
    khoa_phong: ""
  })

  React.useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username,
        password: user.password,
        full_name: user.full_name,
        role: user.role,
        khoa_phong: user.khoa_phong || ""
      })
    } else if (!open) {
      setFormData({
        username: "",
        password: "",
        full_name: "",
        role: "",
        khoa_phong: ""
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !formData.username || !formData.password || !formData.full_name || !formData.role) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc."
      })
      return
    }

    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kết nối đến cơ sở dữ liệu."
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('nhan_vien')
        .update({
          username: formData.username.trim(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          role: formData.role,
          khoa_phong: formData.khoa_phong.trim() || null
        })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin người dùng."
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật thông tin."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin tài khoản. Tất cả thông tin có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Tên đăng nhập *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Nhập tên đăng nhập"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Mật khẩu *</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-full_name">Họ và tên *</Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nhập họ và tên đầy đủ"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_ROLES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-khoa_phong">Khoa/Phòng</Label>
              <Input
                id="edit-khoa_phong"
                value={formData.khoa_phong}
                onChange={(e) => setFormData(prev => ({ ...prev, khoa_phong: e.target.value }))}
                placeholder="Nhập khoa/phòng làm việc"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cập nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 