import { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { CalendarDays, Settings, Tags, type LucideIcon } from "lucide-react";
import { detectTimeZone } from "@important-dates/core";
import { cn } from "../lib/cn";
import { useProfileQuery, useUpdateProfile } from "../hooks/queries";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSignedInUser } from "../providers/AuthProvider";

const NAV: ReadonlyArray<{ to: string; labelKey: string; icon: LucideIcon; end?: boolean }> = [
  { to: "/", labelKey: "nav.home", icon: CalendarDays, end: true },
  { to: "/categories", labelKey: "nav.categories", icon: Tags },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

/** Khi đăng nhập, áp theme/ngôn ngữ đã lưu ở profile và ghi múi giờ thiết bị nếu profile còn mặc định (UTC). */
function ProfileSync() {
  const user = useSignedInUser();
  const profile = useProfileQuery(user.id);
  const update = useUpdateProfile(user.id);
  const { setTheme, setLanguage } = useAppearance();
  const syncedFor = useRef<string | null>(null);

  const data = profile.data;
  const { mutate } = update;
  useEffect(() => {
    if (!data || syncedFor.current === data.id) return;
    syncedFor.current = data.id;
    setTheme(data.theme);
    setLanguage(data.language);
    const timezone = detectTimeZone();
    if (data.timezone === "UTC" && timezone !== "UTC") mutate({ timezone });
  }, [data, setTheme, setLanguage, mutate]);

  return null;
}

export function AppShell() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        {t("a11y.skipToContent")}
      </a>
      <ProfileSync />
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <span className="font-display text-lg font-bold">{t("app.name")}</span>
          <nav aria-label={t("a11y.mainNav")} className="hidden gap-1 sm:flex">
            {NAV.map(({ to, labelKey, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium",
                    isActive
                      ? "bg-surface-muted text-foreground"
                      : "text-muted hover:text-foreground",
                  )
                }
              >
                <Icon aria-hidden="true" size={18} />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-12">
        <Outlet />
      </main>

      {/* Thanh điều hướng dưới cho điện thoại */}
      <nav
        aria-label={t("a11y.mainNav")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                isActive ? "text-primary" : "text-muted",
              )
            }
          >
            <Icon aria-hidden="true" size={20} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
