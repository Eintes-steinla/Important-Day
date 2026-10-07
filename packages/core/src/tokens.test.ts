import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { DEFAULT_EVENT_COLOR_KEY } from "./constants";
import {
  colorTokens,
  cssVarsFor,
  eventColors,
  getEventColor,
  hexToRgbTriplet,
  isEventColorKey,
} from "./tokens";

const THEMES = ["light", "dark"] as const;

describe("contrastRatio", () => {
  it("đen/trắng là 21, cùng màu là 1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("không phụ thuộc thứ tự hai màu", () => {
    expect(contrastRatio("#0f172a", "#f8fafc")).toBeCloseTo(
      contrastRatio("#f8fafc", "#0f172a"),
      10,
    );
  });
});

describe("bảng màu sự kiện đọc được ở cả light và dark (WCAG AA >= 4.5)", () => {
  for (const theme of THEMES) {
    for (const color of eventColors) {
      it(`${color.key} (${theme})`, () => {
        const { bg, fg } = color[theme];
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("khóa màu không trùng nhau", () => {
    const keys = eventColors.map((color) => color.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("design tokens màu", () => {
  for (const theme of THEMES) {
    it(`chữ chính và chữ phụ đọc được trên nền (${theme})`, () => {
      const t = colorTokens[theme];
      expect(contrastRatio(t.text, t.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.textMuted, t.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.textMuted, t.surface)).toBeGreaterThanOrEqual(4.5);
    });

    it(`nút chính, chữ trên nút và màu lỗi đọc được (${theme})`, () => {
      const t = colorTokens[theme];
      expect(contrastRatio(t.primaryForeground, t.primary)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.primary, t.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(t.danger, t.surface)).toBeGreaterThanOrEqual(4.5);
    });

    it(`màu nhấn và màu lỗi đọc được trên cả nền và bề mặt (${theme})`, () => {
      const t = colorTokens[theme];
      for (const color of [t.accent, t.danger, t.primary]) {
        expect(contrastRatio(color, t.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(color, t.surface)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(t.textMuted, t.surfaceMuted)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("getEventColor và isEventColorKey", () => {
  it("trả về cặp màu theo theme", () => {
    expect(getEventColor("rose", "light")).toEqual({ bg: "#ffe4e6", fg: "#9f1239" });
    expect(getEventColor("rose", "dark")).toEqual({ bg: "#4c0519", fg: "#fecdd3" });
  });

  it("khóa lạ hoặc null thì dùng màu mặc định", () => {
    const fallback = getEventColor(DEFAULT_EVENT_COLOR_KEY, "light");
    expect(getEventColor("khong-co", "light")).toEqual(fallback);
    expect(getEventColor(null, "light")).toEqual(fallback);
    expect(getEventColor(undefined, "dark")).toEqual(
      getEventColor(DEFAULT_EVENT_COLOR_KEY, "dark"),
    );
  });

  it("khóa màu mặc định có trong bảng", () => {
    expect(isEventColorKey(DEFAULT_EVENT_COLOR_KEY)).toBe(true);
    expect(isEventColorKey("khong-co")).toBe(false);
    expect(isEventColorKey(null)).toBe(false);
  });
});

describe("CSS variables từ tokens", () => {
  it("hexToRgbTriplet", () => {
    expect(hexToRgbTriplet("#4f46e5")).toBe("79 70 229");
    expect(hexToRgbTriplet("#000000")).toBe("0 0 0");
  });

  it("cssVarsFor đặt tên kebab-case khớp tailwind config", () => {
    const vars = cssVarsFor("light");
    expect(vars["--color-surface-muted"]).toBe(hexToRgbTriplet(colorTokens.light.surfaceMuted));
    expect(vars["--color-primary-foreground"]).toBe(
      hexToRgbTriplet(colorTokens.light.primaryForeground),
    );
    expect(Object.keys(vars)).toHaveLength(Object.keys(colorTokens.light).length);
  });
});
