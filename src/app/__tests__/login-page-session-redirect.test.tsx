import * as React from "react"
import { render, waitFor } from "@testing-library/react"

import LoginPage from "@/app/page"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"

const pushMock = jest.fn()
const replaceMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
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

const encodeSession = (sessionData: Record<string, unknown>) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(sessionData))))

const seedUnexpiredSession = () => {
  localStorage.setItem(
    "auth_session_token",
    encodeSession({
      user_id: 1,
      username: "admin",
      role: "admin",
      khoa_phong: "Khoa A",
      full_name: "Admin User",
      created_at: Date.now(),
      expires_at: Date.now() + 3 * 60 * 60 * 1000,
    }),
  )
}

const renderLoginPage = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </LanguageProvider>,
  )

describe("LoginPage restored session navigation", () => {
  beforeEach(() => {
    localStorage.clear()
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  it("redirects a restored, unexpired session from the login page to the dashboard", async () => {
    seedUnexpiredSession()
    renderLoginPage()

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard")
    })
  })
})
