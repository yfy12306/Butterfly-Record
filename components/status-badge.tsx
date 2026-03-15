import { cn } from "@/lib/utils";

export function StatusBadge({
  text,
  tone = "default"
}: {
  text: string;
  tone?: "default" | "success" | "warn" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "warn" && "bg-amber-100 text-amber-700",
        tone === "accent" && "bg-sky-100 text-sky-700",
        tone === "default" && "bg-slate-100 text-slate-600"
      )}
    >
      {text}
    </span>
  );
}
