import { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";

export function PageShell({
  pathname,
  children
}: {
  pathname: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <SidebarNav pathname={pathname} />
      <main className="space-y-6">{children}</main>
    </div>
  );
}
