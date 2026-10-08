import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./Text";

/** Khung màn hình: vùng an toàn, cuộn được, tiêu đề lớn và (tùy chọn) nút hành động bên phải. */
export function Screen({
  title,
  action,
  children,
  scroll = true,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}) {
  const header = (
    <View className="mb-5 flex-row items-center justify-between gap-3">
      <Text accessibilityRole="header" weight="display" className="flex-1 text-3xl">
        {title}
      </Text>
      {action}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-4 pt-4 pb-10"
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1 px-4 pt-4">
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
