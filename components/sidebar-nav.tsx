import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/species", label: "蝴蝶名录" },
  { href: "/regions", label: "地区分布" },
  { href: "/records", label: "收集记录" },
  { href: "/images", label: "图片管理" },
  { href: "/stats", label: "统计页" },
  { href: "/import-export", label: "导入导出" }
];

export function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <aside className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-panel backdrop-blur">
      <div className="mb-6 rounded-2xl bg-ink px-4 py-5 text-cream">
        <p className="text-xs uppercase tracking-[0.28em] text-sand">Personal Collection</p>
        <h1 className="mt-2 text-2xl font-semibold">蝴蝶收藏管理</h1>
        <p className="mt-2 text-sm text-sand/90">单用户、本地图片、本地数据库的轻量站点骨架。</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-moss text-white" : "text-ink hover:bg-cream"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
