import {
  cssVarsFor,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@important-dates/core";

const THEME_STORAGE_KEY = "theme";

export function getSystemScheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage có thể bị chặn, dùng mặc định
  }
  return "system";
}

/** Đặt class `dark` lên <html>, đổ design tokens vào CSS variables và cache lựa chọn. */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference, getSystemScheme());
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  for (const [name, value] of Object.entries(cssVarsFor(resolved))) {
    root.style.setProperty(name, value);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // bỏ qua nếu không ghi được
  }
  return resolved;
}
