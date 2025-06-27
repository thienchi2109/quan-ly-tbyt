'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseError } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { User, UserRole } from '@/types/database'

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'auth_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const sessionString = localStorage.getItem(AUTH_SESSION_KEY);
      if (sessionString) {
        const session = JSON.parse(sessionString);
        if (session.user && session.timestamp && (Date.now() - session.timestamp < SESSION_DURATION_MS)) {
            setUser(session.user);
        } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to parse session from localStorage", error);
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    setIsInitialized(true);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (supabaseError || !supabase) {
      toast({
        variant: "destructive",
        title: "Lỗi cấu hình",
        description: supabaseError || "Không thể kết nối đến Supabase.",
      });
      return false;
    }

    const { data, error } = await supabase
      .from("nhan_vien")
      .select("id, username, password, role, khoa_phong, full_name, created_at")
      .eq("username", username)
      .single();

    if (error && error.code !== 'PGRST116') { 
      toast({
        variant: "destructive",
        title: "Lỗi truy vấn dữ liệu",
        description: `Không thể tìm người dùng. Nguyên nhân phổ biến nhất là do chính sách Row Level Security trên Supabase đang chặn quyền đọc.`,
        duration: 10000,
      });
      return false;
    }

    if (data && data.password === password) {
      const userData: User = {
        id: data.id,
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        role: data.role as UserRole,
        khoa_phong: data.khoa_phong,
        created_at: data.created_at,
      };

      const sessionData = {
          user: userData,
          timestamp: Date.now(),
      };

      setUser(userData);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
      
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${userData.full_name || userData.username}!`,
      });
      
      router.push("/dashboard");
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: "Tên đăng nhập hoặc mật khẩu không đúng.",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
