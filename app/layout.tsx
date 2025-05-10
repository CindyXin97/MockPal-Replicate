import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MockPal - 数据岗位模拟面试匹配平台",
  description: "专为数据岗位(DA/DS/DE)求职者设计的模拟面试匹配平台，通过标签匹配系统帮助用户快速找到合适的练习伙伴。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
