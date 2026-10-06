import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { createI18n, resolveLanguage, type Language } from "@important-dates/core";

/** Ngôn ngữ mặc định theo thiết bị; ngoài vi/en thì fallback "en". */
export function getDeviceLanguage(): Language {
  return resolveLanguage(Localization.getLocales()[0]?.languageCode);
}

// Phase 4 sẽ đọc thêm cache local (AsyncStorage/SecureStore) và profiles.language
export const i18n = createI18n(getDeviceLanguage());
void i18n.use(initReactI18next);

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
}
