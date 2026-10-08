import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import {
  createI18n,
  isThemePreference,
  resolveLanguage,
  type Language,
  type ThemePreference,
} from "@important-dates/core";

const LANGUAGE_KEY = "language";
const THEME_KEY = "theme";

/** Ngôn ngữ mặc định theo thiết bị; ngoài vi/en thì fallback "en". */
export function getDeviceLanguage(): Language {
  return resolveLanguage(Localization.getLocales()[0]?.languageCode);
}

export const i18n = createI18n(getDeviceLanguage());
void i18n.use(initReactI18next);

/** Đổi ngôn ngữ đang hiển thị và nhớ lại cho lần mở sau. */
export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  void AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => undefined);
}

export function saveThemePreference(theme: ThemePreference): void {
  void AsyncStorage.setItem(THEME_KEY, theme).catch(() => undefined);
}

/** Đọc lựa chọn đã lưu ở máy (trước khi có profile) để mở app không bị nháy sai theme/ngôn ngữ. */
export async function loadStoredPreferences(): Promise<{ theme: ThemePreference }> {
  try {
    const [language, theme] = await Promise.all([
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(THEME_KEY),
    ]);
    if (language === "vi" || language === "en") await i18n.changeLanguage(language);
    return { theme: isThemePreference(theme) ? theme : "system" };
  } catch {
    return { theme: "system" };
  }
}
