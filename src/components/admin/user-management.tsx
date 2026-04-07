'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface UserStatus {
  username: string;
  full_name: string;
  role: string;
  khoa_phong: string;
  is_active: boolean;
  last_login: string | null;
  failed_attempts: number;
  password_reset_required: boolean;
  created_at: string;
  disabled_at: string | null;
  disabled_reason: string | null;
}

export function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserStatus[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<string>('');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [disableReason, setDisableReason] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Load user list
  const loadUsers = async () => {
    if (!user || user.role !== 'admin' || !supabase) return;

    try {
      // Direct query (after rollback - admin_get_user_status function removed)
      const { data, error } = await supabase
        .from('nhan_vien')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi tải danh sách",
        description: error.message
      });
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, [user]);

  // Reset password function
  const resetPassword = async () => {
    if (!supabase) return;
    if (!selectedUser || !newPassword) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn user và nhập mật khẩu mới"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_reset_password', {
        p_admin_user_id: user!.id,
        p_target_username: selectedUser,
        p_new_password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Reset thành công",
        description: `Mật khẩu của ${selectedUser} đã được reset`
      });

      setNewPassword('');
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi reset password",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate temporary password
  const generateTempPassword = async () => {
    if (!supabase) return;
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn user"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_generate_temp_password', {
        p_admin_user_id: user!.id,
        p_target_username: selectedUser
      });

      if (error) throw error;

      toast({
        title: "Tạo mật khẩu tạm thời",
        description: `Mật khẩu tạm: ${data}`,
        duration: 10000 // Show longer for copying
      });

      // Copy to clipboard
      navigator.clipboard.writeText(data);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi tạo mật khẩu tạm",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (username: string, newStatus: boolean) => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('admin_toggle_user_status', {
        p_admin_user_id: user!.id,
        p_target_username: username,
        p_is_active: newStatus,
        p_reason: newStatus ? null : disableReason
      });

      if (error) throw error;

      toast({
        title: newStatus ? "Kích hoạt thành công" : "Vô hiệu hóa thành công",
        description: `Tài khoản ${username} đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`
      });

      setDisableReason('');
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi thay đổi trạng thái",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Chỉ admin mới có quyền truy cập trang này</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔑 Quản Lý Tài Khoản Người Dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Reset Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reset Mật Khẩu</h3>
              
              <div>
                <Label htmlFor="user-select">Chọn User</Label>
                <select
                  id="user-select"
                  className="w-full p-2 border rounded"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">-- Chọn user --</option>
                  {users.map(u => (
                    <option key={u.username} value={u.username}>
                      {u.username} - {u.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={resetPassword}
                  disabled={isLoading || !selectedUser || !newPassword}
                >
                  Reset Password
                </Button>
                <Button 
                  variant="outline"
                  onClick={generateTempPassword}
                  disabled={isLoading || !selectedUser}
                >
                  Tạo Pass Tạm Thời
                </Button>
              </div>
            </div>

            {/* Disable Account Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vô Hiệu Hóa Tài Khoản</h3>
              
              <div>
                <Label htmlFor="disable-reason">Lý do vô hiệu hóa</Label>
                <Textarea
                  id="disable-reason"
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="Nhập lý do vô hiệu hóa tài khoản..."
                />
              </div>
            </div>
          </div>

          {/* User List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📋 Danh Sách Người Dùng</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Username</th>
                    <th className="border border-gray-300 p-2 text-left">Họ Tên</th>
                    <th className="border border-gray-300 p-2 text-left">Role</th>
                    <th className="border border-gray-300 p-2 text-left">Khoa Phòng</th>
                    <th className="border border-gray-300 p-2 text-left">Trạng Thái</th>
                    <th className="border border-gray-300 p-2 text-left">Login Cuối</th>
                    <th className="border border-gray-300 p-2 text-left">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{u.username}</td>
                      <td className="border border-gray-300 p-2">{u.full_name}</td>
                      <td className="border border-gray-300 p-2">
                        <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 p-2">{u.khoa_phong}</td>
                      <td className="border border-gray-300 p-2">
                        <div className="space-y-1">
                          <Badge variant={u.is_active ? 'default' : 'destructive'}>
                            {u.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </Badge>
                          {u.failed_attempts > 0 && (
                            <Badge variant="outline">
                              {u.failed_attempts} lần thất bại
                            </Badge>
                          )}
                          {u.password_reset_required && (
                            <Badge variant="secondary">
                              Cần đổi pass
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2">
                        {u.last_login ? new Date(u.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {u.username !== user.username && (
                          <Button
                            size="sm"
                            variant={u.is_active ? "destructive" : "default"}
                            onClick={() => toggleUserStatus(u.username, !u.is_active)}
                            disabled={isLoading}
                          >
                            {u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
