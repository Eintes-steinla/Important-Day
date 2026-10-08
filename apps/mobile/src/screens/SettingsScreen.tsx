import { View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  THEME_PREFERENCES,
  detectTimeZone,
  signOut,
  type Language,
  type ProfileUpdateInput,
  type ThemePreference,
} from "@important-dates/core";
import { Button } from "../components/Button";
import { SegmentedControl } from "../components/fields";
import { Screen } from "../components/Screen";
import { ErrorState, LoadingState } from "../components/StateViews";
import { Text } from "../components/Text";
import { useProfileQuery, useUpdateProfile } from "../hooks/queries";
import { errorMessage } from "../lib/errors";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSignedInUser } from "../providers/AuthProvider";
import { useSupabase } from "../providers/SupabaseProvider";
import { useToast } from "../providers/ToastProvider";

export function SettingsScreen() {
  const { t } = useTranslation();
  const client = useSupabase();
  const user = useSignedInUser();
  const toast = useToast();
  const { theme, language, setTheme, setLanguage } = useAppearance();
  const profile = useProfileQuery(user.id);
  const update = useUpdateProfile(user.id);
  const deviceZone = detectTimeZone();

  /** Giao diện đổi ngay ở máy; lưu lên profile để đồng bộ sang thiết bị khác (và web). */
  const persist = async (patch: ProfileUpdateInput) => {
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

  let body;
  if (profile.isPending) {
    body = <LoadingState />;
  } else if (profile.isError) {
    body = (
      <ErrorState detail={errorMessage(t, profile.error)} onRetry={() => void profile.refetch()} />
    );
  } else {
    const zone = profile.data.timezone;
    body = (
      <View className="gap-8">
        <View>
          <Text weight="medium" className="mb-2 text-sm">
            {t("settings.language.title")}
          </Text>
          <SegmentedControl<Language>
            value={language}
            options={SUPPORTED_LANGUAGES.map((value) => ({
              value,
              label: t(`settings.language.${value}`),
            }))}
            onChange={(next) => {
              setLanguage(next);
              void persist({ language: next });
            }}
          />
        </View>

        <View>
          <Text weight="medium" className="mb-2 text-sm">
            {t("settings.theme.title")}
          </Text>
          <SegmentedControl<ThemePreference>
            value={theme}
            options={THEME_PREFERENCES.map((value) => ({
              value,
              label: t(`settings.theme.${value}`),
            }))}
            onChange={(next) => {
              setTheme(next);
              void persist({ theme: next });
            }}
          />
        </View>

        <View>
          <Text weight="medium" className="mb-1 text-sm">
            {t("settings.timezone")}
          </Text>
          <Text className="text-sm text-muted">{t("settings.timezoneCurrent", { zone })}</Text>
          <Text className="mt-1 text-xs text-muted">{t("settings.timezoneHint")}</Text>
          {zone !== deviceZone ? (
            <Button
              variant="subtle"
              label={t("settings.timezoneUseDevice")}
              className="mt-3 self-start"
              onPress={() => void persist({ timezone: deviceZone })}
            />
          ) : null}
        </View>

        <View className="border-t border-border pt-6">
          <Text weight="medium" className="text-sm">
            {t("settings.account")}
          </Text>
          <Text className="mt-1 text-sm text-muted">
            {t("settings.signedInAs", { email: user.email ?? "" })}
          </Text>
          <Button
            variant="subtle"
            label={t("auth.signOut")}
            className="mt-4 self-start"
            onPress={() => void handleSignOut()}
          />
        </View>
      </View>
    );
  }

  return <Screen title={t("settings.title")}>{body}</Screen>;
}
