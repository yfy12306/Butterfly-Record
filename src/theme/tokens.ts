export const colors = {
  background: "#f7f8f4",
  foreground: "#2d4135",
  card: "#ffffff",
  cardForeground: "#2d4135",
  muted: "#eef1ea",
  mutedForeground: "#6b7f72",
  border: "#dfe4da",
  primary: "#476753",
  primaryForeground: "#fdfdfc",
  secondary: "#e5ebe2",
  secondaryForeground: "#4a6354",
  accent: "#d6e1d1",
  accentForeground: "#375243",
  destructive: "#c45942",
  destructiveForeground: "#ffffff",
  success: "#4e7c61",
  warning: "#b0893f",
  info: "#5b7aa1",
  overlay: "rgba(247, 248, 244, 0.92)",
  scrim: "rgba(20, 28, 23, 0.42)",
} as const;

export const typography = {
  sans: ["Source Sans 3", "System", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"].join(", "),
  serif: ["Noto Serif SC", "Georgia", "Times New Roman", "serif"].join(", "),
  mono: ["SFMono-Regular", "Consolas", "Menlo", "monospace"].join(", "),
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
  } as const,
  scale: {
    hero: {
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.4,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    section: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
    },
  } as const,
} as const;

export const radius = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  pill: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const shadow = {
  card: {
    shadowColor: "rgba(44, 65, 53, 0.08)",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lift: {
    shadowColor: "rgba(44, 65, 53, 0.12)",
    shadowOpacity: 1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  soft: {
    shadowColor: "rgba(44, 65, 53, 0.05)",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
} as const;

export const layout = {
  screenPaddingX: 16,
  screenPaddingTop: 16,
  screenPaddingBottom: 24,
  contentMaxWidth: 480,
  headerHeight: 64,
  headerInsetTop: 12,
  sectionGap: 24,
  blockGap: 16,
  fieldGap: 12,
} as const;

export const surface = {
  default: colors.card,
  muted: colors.muted,
  elevated: "#fbfcfa",
  overlay: colors.overlay,
} as const;

export const theme = {
  colors,
  typography,
  radius,
  spacing,
  shadow,
  motion,
  layout,
  surface,
} as const;

export type Theme = typeof theme;
