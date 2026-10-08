import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text } from "../components/Text";
import { useAppearance } from "../providers/AppearanceProvider";

/** Khung chung của các màn hình dạng modal (form sự kiện, form danh mục). */
export function ModalFrame({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppearance();
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Text accessibilityRole="header" weight="displaySemibold" className="flex-1 text-xl">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
          className="-mr-2 size-11 items-center justify-center rounded-lg active:bg-surface-muted"
        >
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-10 pt-2">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
