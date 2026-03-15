import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-ink via-moss to-leaf px-6 py-7 text-white shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sand">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm text-cream/90">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </section>
  );
}
