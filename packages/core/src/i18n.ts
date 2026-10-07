import i18next, { type i18n } from "i18next";
import vi from "../locales/vi.json";
import en from "../locales/en.json";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const FALLBACK_LANGUAGE: Language = "en";

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

/**
 * Chuẩn hóa mã locale của thiết bị/trình duyệt (vd "vi-VN", "en-US") về vi | en.
 * Ngoài hai ngôn ngữ này thì fallback về "en".
 */
export function resolveLanguage(locale: string | null | undefined): Language {
  const base = locale?.toLowerCase().split(/[-_]/)[0];
  return base === "vi" || base === "en" ? base : FALLBACK_LANGUAGE;
}

/**
 * Tạo instance i18next dùng chung cho web và mobile.
 * Mỗi app tự gắn `initReactI18next` bằng `.use()` ở phía app, vì phụ thuộc vào react-i18next.
 */
export function createI18n(initialLanguage: Language): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    resources,
    lng: initialLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    // Resource nằm sẵn trong bundle nên khởi tạo đồng bộ, dùng `t()` được ngay
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

/** Locale dùng cho `Intl` (định dạng ngày, số, đếm ngược). */
export function intlLocale(language: Language): string {
  return language === "vi" ? "vi-VN" : "en-US";
}
