import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  resolveLanguage,
  resolveTheme,
  type Language,
  type ResolvedTheme,
  type ThemePreference,
} from "@important-dates/core";
import { setLanguage as applyLanguage } from "../i18n";
import { applyTheme, getStoredTheme, getSystemScheme } from "../theme/applyTheme";

interface AppearanceValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  language: Language;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

/** Giữ theme và ngôn ngữ đang áp dụng. Việc lưu lên profile do màn hình Cài đặt đảm nhiệm. */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<ThemePreference>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme(), getSystemScheme()),
  );

  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
    if (theme !== "system") return undefined;
    // Theo hệ thống: cập nhật khi người dùng đổi chế độ sáng/tối của hệ điều hành
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => setThemeState(next), []);
  const setLanguage = useCallback((next: Language) => applyLanguage(next), []);

  const language = resolveLanguage(i18n.language);
  const value = useMemo(
    () => ({ theme, resolvedTheme, language, setTheme, setLanguage }),
    [theme, resolvedTheme, language, setTheme, setLanguage],
  );
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance phải nằm trong AppearanceProvider");
  return value;
}
