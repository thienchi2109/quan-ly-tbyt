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
        const { data, error } = await supabase!.rpc('validate_session', {
          p_session_token: sessionToken
        });

        if (error || !data || !Array.isArray(data) || data.length === 0 || !data[0].is_valid) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          setIsInitialized(true);
          return;
        }

        // Get first result from array
        const sessionResult = data[0];

        // Restore user session
        const userData: User = {
          id: sessionResult.user_id,
          username: sessionResult.username,
          password: '', // Never store password in frontend
          full_name: '', // Will be fetched separately if needed
          role: sessionResult.role as UserRole,
          khoa_phong: sessionResult.khoa_phong,
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
      // 🔐 NEW: Use enhanced dual mode authentication
      const { data: authData, error: authError } = await supabase!.rpc('authenticate_user_dual_mode', {
        p_username: username.trim(),
        p_password: password
      });

      if (authError) {
        console.error("Authentication error:", authError);
        throw authError; // Will trigger fallback
      }

      if (!authData || !Array.isArray(authData) || authData.length === 0) {
        console.error("No authentication data returned");
        throw new Error("Invalid authentication response");
      }

      const authResult = authData[0];

      // Check if authentication was successful
      if (!authResult.is_authenticated) {
        const message = authResult.authentication_mode === 'user_not_found' 
          ? "Tên đăng nhập không tồn tại."
          : authResult.authentication_mode === 'blocked_suspicious'
          ? "Thông tin đăng nhập không hợp lệ."
          : "Tên đăng nhập hoặc mật khẩu không đúng.";

        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: message,
        });
        return false;
      }

      // 🎉 Authentication successful
      const userData: User = {
        id: authResult.user_id,
        username: authResult.username,
        password: '', // Never store password in frontend
        full_name: authResult.full_name || '',
        role: authResult.role as UserRole,
        khoa_phong: authResult.khoa_phong || '',
        created_at: new Date().toISOString(),
      };

      // Create session token
      localStorage.setItem(SESSION_TOKEN_KEY, `session_${Date.now()}`);
      setUser(userData);

      const authModeText = authResult.authentication_mode === 'hashed' ? '🔐 Secure' : '⚠️ Legacy';
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${userData.full_name || userData.username}! (${authModeText})`,
      });

      router.push("/dashboard");
      return true;

    } catch (error: any) {
      console.error("Enhanced authentication failed, trying fallback:", error);

      // 🔄 FALLBACK: Use direct database query for backward compatibility
      try {
        console.log("Trying fallback authentication method...");

        const { data: fallbackData, error: fallbackError } = await supabase!
          .from('nhan_vien')
          .select('*')
          .eq('username', username.trim())
          .single();

        if (fallbackError || !fallbackData) {
          console.error("Fallback user lookup failed:", fallbackError);
          toast({
            variant: "destructive",
            title: "Đăng nhập thất bại",
            description: "Tên đăng nhập hoặc mật khẩu không đúng.",
          });
          return false;
        }

        // 🚨 SECURITY: Block login attempts with suspicious strings
        if (password === 'hashed password' || 
            password.includes('hash') || 
            password.includes('crypt') || 
            password.length > 200) {
          console.warn('Security: Blocked login attempt with suspicious password');
          toast({
            variant: "destructive",
            title: "Đăng nhập thất bại",
            description: "Thông tin đăng nhập không hợp lệ.",
          });
          return false;
        }

        // Check password (fallback method)
        if (fallbackData.password === password) {
          // Old method worked, create session manually
          localStorage.setItem(SESSION_TOKEN_KEY, `fallback_${Date.now()}`);
          setUser(fallbackData);

          toast({
            title: "Đăng nhập thành công",
            description: `Chào mừng ${fallbackData.full_name || fallbackData.username}! (Compatibility mode)`,
          });

          router.push("/dashboard");
          return true;
        }

        // Password incorrect
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: "Tên đăng nhập hoặc mật khẩu không đúng.",
        });
        return false;

      } catch (fallbackError) {
        console.error("Fallback authentication also failed:", fallbackError);
        toast({
          variant: "destructive",
          title: "Lỗi đăng nhập",
          description: "Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.",
        });
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

      // Note: Session invalidation function was removed during rollback
      // Sessions will expire naturally or be cleared on next login
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
        const { data } = await supabase!.rpc('validate_session', {
          p_session_token: sessionToken
        });

        if (!data || !Array.isArray(data) || data.length === 0 || !data[0].is_valid) {
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
