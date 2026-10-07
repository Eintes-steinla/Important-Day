import { DEFAULT_EVENT_COLOR_KEY } from "./constants";
import type { ResolvedTheme } from "./theme";

/**
 * Design tokens màu dùng chung cho web và mobile.
 * Không rải mã hex trong component: web dùng qua CSS variables / Tailwind,
 * mobile dùng qua NativeWind (xem tailwind preset của từng app).
 */
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryForeground: string;
  /** Màu lề đỏ của vở học sinh: đánh dấu "hôm nay" và sự kiện sắp đến. Không dùng cho lỗi. */
  accent: string;
  /** Lỗi và thao tác xóa. */
  danger: string;
}

/**
 * Bảng màu "mực tím": nền giấy hơi xanh, chữ mực tối, màu chính là mực tím của bút học sinh,
 * màu nhấn là lề đỏ của trang vở. Mọi cặp chữ/nền đều đạt WCAG AA (có test).
 */
export const colorTokens: Record<ResolvedTheme, ColorTokens> = {
  light: {
    background: "#f4f5fa",
    surface: "#ffffff",
    surfaceMuted: "#ebedf6",
    text: "#1c1b3a",
    textMuted: "#5a5b7a",
    border: "#dde0ee",
    primary: "#5336c9",
    primaryForeground: "#ffffff",
    accent: "#c2255c",
    danger: "#b3261e",
  },
  dark: {
    background: "#121120",
    surface: "#1b1a2d",
    surfaceMuted: "#26253d",
    text: "#ecebfa",
    textMuted: "#a3a3c4",
    border: "#2d2c48",
    primary: "#a99bff",
    primaryForeground: "#15133a",
    accent: "#ff7c9c",
    danger: "#ff8a80",
  },
};

/** "#4f46e5" -> "79 70 229" (dạng dùng được với alpha trong Tailwind/NativeWind). */
export function hexToRgbTriplet(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Đổi token sang map CSS variable: { "--color-surface-muted": "241 245 249", ... } */
export function cssVarsFor(theme: ResolvedTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, hex] of Object.entries(colorTokens[theme])) {
    const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    vars[`--color-${kebab}`] = hexToRgbTriplet(hex);
  }
  return vars;
}

/**
 * Bảng màu cho sự kiện. Mỗi màu có `bg` (nền) và `fg` (chữ/icon trên nền đó) cho từng theme,
 * chọn sao cho tương phản đủ rõ (>= 4.5:1) ở cả light lẫn dark.
 */
export interface EventColor {
  key: string;
  light: { bg: string; fg: string };
  dark: { bg: string; fg: string };
}

export const eventColors: readonly EventColor[] = [
  { key: "rose", light: { bg: "#ffe4e6", fg: "#9f1239" }, dark: { bg: "#4c0519", fg: "#fecdd3" } },
  {
    key: "orange",
    light: { bg: "#ffedd5", fg: "#9a3412" },
    dark: { bg: "#431407", fg: "#fed7aa" },
  },
  { key: "amber", light: { bg: "#fef3c7", fg: "#92400e" }, dark: { bg: "#451a03", fg: "#fde68a" } },
  { key: "green", light: { bg: "#dcfce7", fg: "#166534" }, dark: { bg: "#052e16", fg: "#bbf7d0" } },
  { key: "teal", light: { bg: "#ccfbf1", fg: "#115e59" }, dark: { bg: "#042f2e", fg: "#99f6e4" } },
  { key: "sky", light: { bg: "#e0f2fe", fg: "#075985" }, dark: { bg: "#082f49", fg: "#bae6fd" } },
  {
    key: "indigo",
    light: { bg: "#e0e7ff", fg: "#3730a3" },
    dark: { bg: "#1e1b4b", fg: "#c7d2fe" },
  },
  {
    key: "purple",
    light: { bg: "#f3e8ff", fg: "#6b21a8" },
    dark: { bg: "#3b0764", fg: "#e9d5ff" },
  },
] as const;

export function isEventColorKey(key: string | null | undefined): boolean {
  return eventColors.some((color) => color.key === key);
}

/**
 * Cặp màu nền/chữ của một khóa màu theo theme. Khóa không có trong bảng (hoặc null) thì
 * dùng màu mặc định, nên đổi bảng màu sau này không làm hỏng dữ liệu cũ.
 */
export function getEventColor(
  key: string | null | undefined,
  theme: ResolvedTheme,
): { bg: string; fg: string } {
  const found = eventColors.find((color) => color.key === key);
  const color =
    found ?? eventColors.find((c) => c.key === DEFAULT_EVENT_COLOR_KEY) ?? eventColors[0];
  // eventColors luôn có phần tử; kiểm tra để thỏa noUncheckedIndexedAccess
  if (!color) throw new Error("eventColors rỗng");
  return color[theme];
}
