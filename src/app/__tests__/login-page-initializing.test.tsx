import * as React from "react"
import { render, screen } from "@testing-library/react"

import LoginPage from "@/app/page"

const mockUseAuth = jest.fn()

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    currentLanguage: { code: "vi", name: "Tiếng Việt" },
    setLanguage: jest.fn(),
    t: (key: string) =>
      ({
        "login.error": "Tên đăng nhập hoặc mật khẩu không đúng",
        "login.password": "Mật khẩu",
        "login.passwordPlaceholder": "Nhập mật khẩu",
        "login.signIn": "Đăng nhập",
        "login.signingIn": "Đang xác thực...",
        "login.subtitle": "Đăng nhập vào hệ thống",
        "login.username": "Tên đăng nhập",
        "login.usernamePlaceholder": "Nhập tên đăng nhập",
      })[key],
  }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}))

jest.mock("@/components/icons", () => ({
  Logo: () => <div aria-label="Logo" />,
}))

jest.mock("lucide-react", () => ({
  BarChart3: () => null,
  Calendar: () => null,
  FileText: () => null,
  Globe: () => null,
  Lock: () => null,
  QrCode: () => null,
  Settings: () => null,
  User: () => null,
  Wrench: () => null,
}))

describe("LoginPage auth initialization", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isInitialized: false,
      login: jest.fn(),
      user: null,
    })
  })

  it("does not render the login form before auth initialization completes", () => {
    render(<LoginPage />)

    expect(screen.queryAllByRole("button", { name: "Đăng nhập" })).toHaveLength(0)
  })
})
