import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarHeart, Monitor, Moon, Sun } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  THEME_PREFERENCES,
  type Language,
  type ThemePreference,
} from "@important-dates/core";
import { setLanguage } from "./i18n";
import { applyTheme, getStoredTheme, getSystemScheme } from "./theme/applyTheme";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

// Trang khung của Phase 0: chỉ để kiểm tra i18n và dark/light hoạt động. UI thật làm ở Phase 3.
export function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    // Theo dõi thay đổi theme hệ điều hành khi đang ở chế độ "system"
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const currentLanguage = i18n.language as Language;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <CalendarHeart className="h-8 w-8 text-primary" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">{t("app.name")}</h1>
          <p className="text-sm text-muted">{t("app.tagline")}</p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">{t("settings.language.title")}</h2>
        <div className="flex gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={currentLanguage === lang}
              className={`rounded-lg px-3 py-2 text-sm ${
                currentLanguage === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-foreground"
              }`}
            >
              {t(`settings.language.${lang}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">{t("settings.theme.title")}</h2>
        <div className="flex gap-2">
          {THEME_PREFERENCES.map((pref) => {
            const Icon = THEME_ICONS[pref];
            return (
              <button
                key={pref}
                type="button"
                onClick={() => setTheme(pref)}
                aria-pressed={theme === pref}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  theme === pref
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(`settings.theme.${pref}`)}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {theme === "system" ? `(${getSystemScheme()})` : null}
        </p>
      </section>
    </main>
  );
}
