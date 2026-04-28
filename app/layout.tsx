import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { InstallBanner } from "@/components/InstallBanner";

export const metadata: Metadata = {
  title: "Multiplay · Aprende Multiplicando",
  description: "Aprende las tablas de multiplicar en 3 días",
  manifest: "/manifest.webmanifest",
  applicationName: "Multiplay",
  appleWebApp: {
    capable: true,
    title: "Multiplay",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen font-display">
        <I18nProvider>
          <InstallBanner />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
