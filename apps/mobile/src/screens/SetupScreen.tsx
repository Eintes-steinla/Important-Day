import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "../components/Text";

/** Hiện khi thiếu hoặc sai cấu hình Supabase, thay vì một màn hình trắng. */
export function SetupScreen({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 py-10">
        <Text weight="display" className="text-3xl">
          {t("setup.title")}
        </Text>
        <Text className="mt-3 text-muted">{t("setup.body")}</Text>
        <View className="mt-6 gap-2">
          {["setup.step1Mobile", "setup.step2Mobile", "setup.step3Mobile"].map((key, index) => (
            <Text key={key}>{`${index + 1}. ${t(key)}`}</Text>
          ))}
        </View>
        <View accessibilityRole="alert" className="mt-6 rounded-lg bg-surface-muted p-3">
          <Text className="text-sm text-danger">{message}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
