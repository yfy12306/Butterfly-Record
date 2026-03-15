import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  className
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? <div className="text-sm text-slate-600">{label}</div> : null}
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-moss to-leaf" style={{ width: `${value}%` }} />
      </div>
      <div className="text-right text-xs font-medium text-slate-500">{value}%</div>
    </div>
  );
}
