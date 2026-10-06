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
  danger: string;
}

export const colorTokens: Record<ResolvedTheme, ColorTokens> = {
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    danger: "#dc2626",
  },
  dark: {
    background: "#0b1120",
    surface: "#111827",
    surfaceMuted: "#1f2937",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#1f2937",
    primary: "#818cf8",
    primaryForeground: "#0b1120",
    danger: "#f87171",
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
