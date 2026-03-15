export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function percentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function regionLevelLabel(level: "country" | "province" | "city") {
  if (level === "country") return "全国";
  if (level === "province") return "省级";
  return "市级";
}

export function recordStatusLabel(status: string) {
  if (status === "confirmed") return "已确认";
  if (status === "pending_identification") return "待鉴定";
  return "观察记录";
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
