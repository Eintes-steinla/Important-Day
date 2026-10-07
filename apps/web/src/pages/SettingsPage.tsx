import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { detectTimeZone, signOut } from "@important-dates/core";
import { Button } from "../components/Button";
import { inputClass } from "../components/fields";
import { ErrorState, LoadingState } from "../components/StateViews";
import { LanguageSwitch, ThemeSwitch } from "../components/Switches";
import { useProfileQuery, useUpdateProfile } from "../hooks/queries";
import { errorMessage } from "../lib/errors";
import { useSignedInUser } from "../providers/AuthProvider";
import { useSupabase } from "../providers/SupabaseProvider";
import { useToast } from "../providers/ToastProvider";

function listTimeZones(current: string): string[] {
  const zones = new Set<string>(Intl.supportedValuesOf("timeZone"));
  zones.add(current);
  zones.add(detectTimeZone());
  return [...zones].sort();
}

export function SettingsPage() {
  const { t } = useTranslation();
  const client = useSupabase();
  const user = useSignedInUser();
  const toast = useToast();
  const profile = useProfileQuery(user.id);
  const update = useUpdateProfile(user.id);
  const timezone = profile.data?.timezone ?? detectTimeZone();
  const zones = useMemo(() => listTimeZones(timezone), [timezone]);

  /** Giao diện đổi ngay ở máy; lưu lên profile để đồng bộ sang thiết bị khác. */
  const persist = async (patch: Parameters<typeof update.mutateAsync>[0]) => {
    try {
      await update.mutateAsync(patch);
      toast.show(t("settings.saved"));
    } catch (error) {
      toast.show(errorMessage(t, error), "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(client);
    } catch (error) {
      toast.show(errorMessage(t, error), "error");
    }
  };

  if (profile.isPending) return <LoadingState />;
  if (profile.isError) {
    return (
      <ErrorState detail={errorMessage(t, profile.error)} onRetry={() => void profile.refetch()} />
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold">{t("settings.title")}</h1>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium">{t("settings.language.title")}</h2>
        <LanguageSwitch onChange={(language) => void persist({ language })} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium">{t("settings.theme.title")}</h2>
        <ThemeSwitch onChange={(theme) => void persist({ theme })} />
      </section>

      <section className="mt-8">
        <label htmlFor="timezone" className="mb-2 block text-sm font-medium">
          {t("settings.timezone")}
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => void persist({ timezone: e.target.value })}
          className={inputClass}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">{t("settings.timezoneHint")}</p>
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-medium">{t("settings.account")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("settings.signedInAs", { email: user.email ?? "" })}
        </p>
        <Button variant="subtle" className="mt-4" onClick={() => void handleSignOut()}>
          {t("auth.signOut")}
        </Button>
      </section>
    </div>
  );
}
