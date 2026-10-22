import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "FreshOptima — Hệ Thống Tối Ưu Đặt Hàng Rau Củ",
  description: "Hệ thống tối ưu báo giá & đặt hàng rau củ theo từng bếp cho chuỗi nhà hàng và bếp ăn công nghiệp",
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
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-zinc-900 selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
