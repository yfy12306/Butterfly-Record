export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-panel">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}
