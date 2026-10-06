export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

/** Đổi lựa chọn của người dùng (light/dark/system) thành theme thực tế đang áp dụng. */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: ResolvedTheme | null | undefined,
): ResolvedTheme {
  if (preference === "system") return systemScheme === "dark" ? "dark" : "light";
  return preference;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}
