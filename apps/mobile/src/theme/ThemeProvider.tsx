import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import {
  DEFAULT_THEME_PREFERENCE,
  cssVarsFor,
  type ResolvedTheme,
  type ThemePreference,
} from "@important-dates/core";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme phải nằm trong ThemeProvider");
  return ctx;
}

/**
 * NativeWind lo việc theo dõi hệ thống (system) và ghi đè thủ công (light/dark),
 * còn màu cụ thể lấy từ design tokens của packages/core qua CSS variables.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);

  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);

  const resolved: ResolvedTheme = colorScheme === "dark" ? "dark" : "light";
  const themeVars = useMemo(() => vars(cssVarsFor(resolved)), [resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference: setPreferenceState }),
    [preference, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars]}>{children}</View>
    </ThemeContext.Provider>
  );
}
