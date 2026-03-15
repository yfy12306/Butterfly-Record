import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
