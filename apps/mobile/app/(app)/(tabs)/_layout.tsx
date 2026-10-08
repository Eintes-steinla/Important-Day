import { Tabs } from "expo-router";
import { CalendarDays, Settings, Tags } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppearance } from "../../../src/providers/AppearanceProvider";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppearance();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: "BeVietnamPro_500Medium", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("nav.categories"),
          tabBarIcon: ({ color, size }) => <Tags size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("nav.settings"),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
