import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "蝴蝶收藏管理网站",
  description: "个人使用的蝴蝶收藏、记录与图片管理网站"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  return (
    <html lang="zh-CN">
      <body>
        <PageShell pathname={pathname}>{children}</PageShell>
      </body>
    </html>
  );
}
