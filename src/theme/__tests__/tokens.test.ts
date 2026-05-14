import { colors, layout, radius, theme, typography } from "../tokens";

describe("theme tokens", () => {
  it("matches the current web palette", () => {
    expect(colors.background).toBe("#f7f8f4");
    expect(colors.foreground).toBe("#2d4135");
    expect(colors.primary).toBe("#476753");
    expect(colors.border).toBe("#dfe4da");
  });

  it("keeps the serif/sans pairing intact", () => {
    expect(typography.serif).toContain("Noto Serif SC");
    expect(typography.sans).toContain("Source Sans 3");
  });

  it("exposes the screen geometry used by layout helpers", () => {
    expect(layout.screenPaddingX).toBe(16);
    expect(layout.contentMaxWidth).toBe(480);
    expect(radius["3xl"]).toBe(28);
    expect(theme.surface.default).toBe("#ffffff");
  });
});
