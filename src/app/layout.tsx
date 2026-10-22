import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#F2F2F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "FreshOptima — Tối Ưu Đặt Hàng Rau Củ",
  description: "Hệ thống tối ưu báo giá & đặt hàng rau củ theo từng bếp cho chuỗi nhà hàng và bếp ăn công nghiệp",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FreshOptima",
  },
  icons: {
    icon: "/favicon-64.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F2F2F7] text-[#1C1C1E] selection:bg-[#34C759] selection:text-white pb-[max(env(safe-area-inset-bottom),76px)]">
        {children}
      </body>
    </html>
  );
}
