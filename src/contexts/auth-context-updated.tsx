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
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'auth_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Initialize session on mount
  React.useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
        
        if (!sessionToken) {
          setIsInitialized(true);
          return;
        }

        // Validate session with new secure function
        const { data, error } = await supabase.rpc('validate_session', {
          p_session_token: sessionToken
        });

        if (error || !data || !data.is_valid) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          setIsInitialized(true);
          return;
        }

        // Restore user session
        const userData: User = {
          id: data.user_id,
          username: data.username,
          password: '', // Never store password in frontend
          full_name: '', // Will be fetched separately if needed
          role: data.role as UserRole,
          khoa_phong: data.khoa_phong,
          created_at: new Date().toISOString(),
        };

        setUser(userData);
      } catch (error) {
        console.error("Session initialization failed:", error);
        localStorage.removeItem(SESSION_TOKEN_KEY);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeSession();
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

    setIsLoading(true);

    try {
      // Use new secure authentication function
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username.trim(),
        p_password: password
      });

      if (error) {
        console.error("Authentication error:", error);
        toast({
          variant: "destructive",
          title: "Lỗi xác thực",
          description: "Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.",
        });
        return false;
      }

      if (!data || !data.session_token) {
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: "Tên đăng nhập hoặc mật khẩu không đúng.",
        });
        return false;
      }

      // Create user object (without password)
      const userData: User = {
        id: data.id,
        username: data.username,
        password: '', // Never store password
        full_name: data.full_name,
        role: data.role as UserRole,
        khoa_phong: data.khoa_phong,
        created_at: data.created_at,
      };

      // Store secure session token
      localStorage.setItem(SESSION_TOKEN_KEY, data.session_token);
      setUser(userData);

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${userData.full_name || userData.username}!`,
      });

      router.push("/dashboard");
      return true;

    } catch (error: any) {
      console.error("Login error:", error);
      
      // Fallback to old method if new method fails (backward compatibility)
      try {
        console.log("Trying fallback authentication method...");
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('nhan_vien')
          .select('*')
          .eq('username', username.trim())
          .single();

        if (!fallbackError && fallbackData && fallbackData.password === password) {
          // Old method worked, create session manually
          const sessionData = {
            user: fallbackData,
            timestamp: Date.now(),
          };
          
          localStorage.setItem(SESSION_TOKEN_KEY, `fallback_${Date.now()}`);
          setUser(fallbackData);
          
          toast({
            title: "Đăng nhập thành công",
            description: `Chào mừng ${fallbackData.full_name || fallbackData.username}! (Compatibility mode)`,
          });
          
          router.push("/dashboard");
          return true;
        }
      } catch (fallbackError) {
        console.error("Fallback authentication also failed:", fallbackError);
      }
      
      toast({
        variant: "destructive",
        title: "Lỗi đăng nhập",
        description: "Tên đăng nhập hoặc mật khẩu không đúng.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      // Try to invalidate session on server (if using new method)
      if (sessionToken && !sessionToken.startsWith('fallback_') && supabase) {
        await supabase.rpc('invalidate_session', {
          p_session_token: sessionToken
        }).catch(() => {
          // Ignore errors during logout
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of server response
      setUser(null);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      router.push('/');
    }
  };

  // Auto-logout on session expiry (only for new sessions)
  React.useEffect(() => {
    if (!user) return;

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken || sessionToken.startsWith('fallback_')) return;

    const checkSession = async () => {
      try {
        const { data } = await supabase.rpc('validate_session', {
          p_session_token: sessionToken
        });

        if (!data || !data.is_valid) {
          await logout();
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // Don't auto-logout on network errors
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isInitialized, 
      isLoading 
    }}>
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

// Utility function to check if user has specific role
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  const canAccessDepartment = (department: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'to_qltb') return true;
    return user.khoa_phong === department;
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    canAccessDepartment,
    isAdmin: user?.role === 'admin',
    isToQLTB: user?.role === 'to_qltb',
    isQLTBKhoa: user?.role === 'qltb_khoa',
    isUser: user?.role === 'user'
  };
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isInitialized } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
      if (!isInitialized) return;

      if (!user) {
        router.push('/');
        return;
      }

      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }, [user, isInitialized, router]);

    if (!isInitialized || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
