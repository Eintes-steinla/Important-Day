import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CalendarHeart, Monitor, Moon, Sun } from "lucide-react-native";
import { SUPPORTED_LANGUAGES, THEME_PREFERENCES, type Language } from "@important-dates/core";
import { setLanguage } from "../src/i18n";
import { useTheme } from "../src/theme/ThemeProvider";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

// Màn hình khung của Phase 0: chỉ để kiểm tra i18n và dark/light. UI thật làm ở Phase 4.
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { preference, setPreference } = useTheme();
  const currentLanguage = i18n.language as Language;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-6 p-4">
        <View className="flex-row items-center gap-3">
          <CalendarHeart size={32} color="#818cf8" />
          <View>
            <Text className="text-xl font-semibold text-foreground">{t("app.name")}</Text>
            <Text className="text-sm text-muted">{t("app.tagline")}</Text>
          </View>
        </View>

        <View className="rounded-xl border border-border bg-surface p-4">
          <Text className="mb-3 text-sm font-medium text-muted">
            {t("settings.language.title")}
          </Text>
          <View className="flex-row gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = currentLanguage === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  className={`rounded-lg px-3 py-2 ${active ? "bg-primary" : "bg-surface-muted"}`}
                >
                  <Text className={active ? "text-primary-foreground" : "text-foreground"}>
                    {t(`settings.language.${lang}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="rounded-xl border border-border bg-surface p-4">
          <Text className="mb-3 text-sm font-medium text-muted">{t("settings.theme.title")}</Text>
          <View className="flex-row gap-2">
            {THEME_PREFERENCES.map((pref) => {
              const Icon = THEME_ICONS[pref];
              const active = preference === pref;
              return (
                <Pressable
                  key={pref}
                  onPress={() => setPreference(pref)}
                  className={`flex-row items-center gap-2 rounded-lg px-3 py-2 ${
                    active ? "bg-primary" : "bg-surface-muted"
                  }`}
                >
                  <Icon size={16} color={active ? "#ffffff" : "#94a3b8"} />
                  <Text className={active ? "text-primary-foreground" : "text-foreground"}>
                    {t(`settings.theme.${pref}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
