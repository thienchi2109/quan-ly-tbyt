import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'QUẢN LÝ TBYT CDC',
  description: 'Hệ thống quản lý trang thiết bị y tế',
  manifest: '/manifest.json', // Added manifest link
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#007bff" /> {/* Added theme-color */}
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
