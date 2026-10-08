import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { useTranslation } from "react-i18next";
import {
  colorTokens,
  cssVarsFor,
  resolveLanguage,
  type ColorTokens,
  type Language,
  type ResolvedTheme,
  type ThemePreference,
} from "@important-dates/core";
import { saveThemePreference, setLanguage as applyLanguage } from "../i18n";

interface AppearanceValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  /** Màu thực tế của theme hiện tại, cho những chỗ cần giá trị màu (icon, StatusBar, tab bar). */
  colors: ColorTokens;
  language: Language;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function useAppearance(): AppearanceValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance phải nằm trong AppearanceProvider");
  return value;
}

/**
 * NativeWind lo việc theo dõi hệ thống (system) và ghi đè thủ công (light/dark), còn màu cụ thể
 * lấy từ design tokens của packages/core qua CSS variables. Lưu lên profile do màn Cài đặt đảm nhiệm.
 */
export function AppearanceProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemePreference;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme);

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  const resolvedTheme: ResolvedTheme = colorScheme === "dark" ? "dark" : "light";
  const themeVars = useMemo(() => vars(cssVarsFor(resolvedTheme)), [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    saveThemePreference(next);
  }, []);
  const setLanguage = useCallback((next: Language) => applyLanguage(next), []);

  const language = resolveLanguage(i18n.language);
  const value = useMemo<AppearanceValue>(
    () => ({
      theme,
      resolvedTheme,
      colors: colorTokens[resolvedTheme],
      language,
      setTheme,
      setLanguage,
    }),
    [theme, resolvedTheme, language, setTheme, setLanguage],
  );

  return (
    <AppearanceContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars]}>{children}</View>
    </AppearanceContext.Provider>
  );
}
