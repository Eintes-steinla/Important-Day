import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  const { colors } = useAppearance();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t("common.loading")}
      className="flex-row items-center gap-3 py-10"
    >
      <ActivityIndicator color={colors.primary} />
      <Text className="text-sm text-muted">{label ?? t("common.loading")}</Text>
    </View>
  );
}

export function ErrorState({ onRetry, detail }: { onRetry: () => void; detail?: string }) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="alert" className="items-start py-8">
      <Text weight="displaySemibold" className="text-lg">
        {t("errors.loadFailed")}
      </Text>
      <Text className="mt-1 text-sm text-muted">{detail ?? t("errors.loadFailedHint")}</Text>
      <Button variant="subtle" label={t("common.retry")} onPress={onRetry} className="mt-4" />
    </View>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-start py-8">
      <Text weight="displaySemibold" className="text-lg">
        {title}
      </Text>
      {hint ? <Text className="mt-1 text-sm text-muted">{hint}</Text> : null}
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
