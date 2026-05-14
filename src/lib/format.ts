export function parseTaxonomy(value?: string | null): { cn: string; latin: string } {
  if (!value) {
    return { cn: "", latin: "" };
  }

  const backslashParts = value.split("\\");
  if (backslashParts.length >= 2) {
    return {
      cn: backslashParts[0]?.trim() || "",
      latin: backslashParts.slice(1).join("\\").trim() || "",
    };
  }

  const fullWidthParenMatch = value.match(/^(.+?)（(.+?)）$/);
  if (fullWidthParenMatch) {
    return {
      cn: fullWidthParenMatch[1]?.trim() || "",
      latin: fullWidthParenMatch[2]?.trim() || "",
    };
  }

  const halfWidthParenMatch = value.match(/^(.+?)\((.+?)\)$/);
  if (halfWidthParenMatch) {
    return {
      cn: halfWidthParenMatch[1]?.trim() || "",
      latin: halfWidthParenMatch[2]?.trim() || "",
    };
  }

  return { cn: value.trim(), latin: "" };
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) {
    return "";
  }

  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}
