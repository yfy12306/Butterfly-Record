function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeConfidenceToPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return clamp(normalized, 0, 100);
}

export function formatConfidencePercent(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return `${Math.round(normalizeConfidenceToPercent(value))}%`;
}
