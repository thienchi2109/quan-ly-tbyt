"use client"

import { useState } from "react"
import { User, Lock, Globe } from "lucide-react"
import { Logo } from "@/components/icons"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"

export default function LoginPage() {
  const { login } = useAuth()
  const { currentLanguage, setLanguage, t } = useLanguage()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(username, password)
    if (!success) {
      setError(t("login.error") || "Tên đăng nhập hoặc mật khẩu không đúng")
      setIsLoading(false)
    }
  }

  const toggleLanguage = () => {
    const newLang = currentLanguage.code === 'en'
      ? { code: 'vi' as const, name: 'Tiếng Việt' }
      : { code: 'en' as const, name: 'English' }
    setLanguage(newLang)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent px-8 py-6 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">QUẢN LÝ THIẾT BỊ Y TẾ</h1>
            <p className="text-primary-foreground/80 mt-2">{t("login.subtitle") || "Đăng nhập vào hệ thống"}</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  {t("login.username") || "Tên đăng nhập"}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  placeholder={t("login.usernamePlaceholder") || "Nhập tên đăng nhập"}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="h-4 w-4 inline mr-1" />
                  {t("login.password") || "Mật khẩu"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  placeholder={t("login.passwordPlaceholder") || "Nhập mật khẩu"}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                {isLoading ? (t("login.signingIn") || "Đang xác thực...") : (t("login.signIn") || "Đăng nhập")}
              </button>
            </form>

            {/* Language Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4 mr-1" />
                {currentLanguage.code === 'en' ? 'Tiếng Việt' : 'English'}
              </button>
            </div>

            {/* Footer Content */}
            <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
              <p>{t("footer.developedBy") || "Phát triển bởi Nguyễn Thiện Chí"}</p>
              <p>{t("footer.contact") || "Mọi chi tiết xin LH: thienchi2109@gmail.com"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
