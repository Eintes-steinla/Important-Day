import { initReactI18next } from "react-i18next";
import { createI18n, resolveLanguage, type Language } from "@important-dates/core";

const LANGUAGE_STORAGE_KEY = "language";

/** Ưu tiên cache local, sau đó đến ngôn ngữ trình duyệt, cuối cùng fallback "en". */
export function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "vi" || stored === "en") return stored;
  } catch {
    // bỏ qua nếu localStorage bị chặn
  }
  return resolveLanguage(navigator.language);
}

export const i18n = createI18n(getInitialLanguage());
void i18n.use(initReactI18next);

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // bỏ qua nếu không ghi được
  }
}
