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

const SESSION_TOKEN_KEY = 'secure_session_token';

// Utility functions for secure session management
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now();
  return `${token}.${timestamp}`;
};

const validateTokenFormat = (token: string): boolean => {
  try {
    const [tokenPart, timestampPart] = token.split('.');
    if (!tokenPart || !timestampPart) return false;
    
    const timestamp = parseInt(timestampPart);
    const now = Date.now();
    
    // Check if token is expired (24 hours)
    if (now - timestamp > 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Validate token format (64 hex characters)
    return tokenPart.length === 64 && /^[a-f0-9]+$/.test(tokenPart);
  } catch {
    return false;
  }
};

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
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
        
        if (!sessionToken || !validateTokenFormat(sessionToken)) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          setIsInitialized(true);
          return;
        }

        // Validate session with server
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
      // Call secure authentication function
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

      // Set user context for RLS
      await supabase.rpc('set_current_user_id', { user_id: data.id });

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${userData.full_name || userData.username}!`,
      });

      router.push("/dashboard");
      return true;

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi đăng nhập",
        description: error.message || "Có lỗi xảy ra khi đăng nhập.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (sessionToken && supabase) {
        // Invalidate session on server
        await supabase.rpc('invalidate_session', {
          p_session_token: sessionToken
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

  // Auto-logout on session expiry
  React.useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!sessionToken || !validateTokenFormat(sessionToken)) {
        await logout();
        return;
      }

      try {
        const { data } = await supabase.rpc('validate_session', {
          p_session_token: sessionToken
        });

        if (!data || !data.is_valid) {
          await logout();
        }
      } catch (error) {
        console.error("Session validation error:", error);
        await logout();
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

export function useSecureAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isInitialized } = useSecureAuth();
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

// Hook for role-based access control
export function usePermissions() {
  const { user } = useSecureAuth();

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
