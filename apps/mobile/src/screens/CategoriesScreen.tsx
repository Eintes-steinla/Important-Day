import { Alert, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Pencil, Plus, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { getCategoryName } from "@important-dates/core";
import { Button } from "../components/Button";
import { IconBadge } from "../components/EventRow";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { Text } from "../components/Text";
import { useCategoriesQuery, useDeleteCategory, useEventsQuery } from "../hooks/queries";
import { errorMessage } from "../lib/errors";
import { useAppearance } from "../providers/AppearanceProvider";
import { useToast } from "../providers/ToastProvider";

export function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const { colors } = useAppearance();
  const categories = useCategoriesQuery();
  const events = useEventsQuery();
  const remove = useDeleteCategory();

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(t("categories.deleteTitle", { name }), t("categories.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("categories.delete"),
        style: "destructive",
        onPress: () => {
          remove.mutate(id, {
            onSuccess: () => toast.show(t("categories.deleted")),
            onError: (error) => toast.show(errorMessage(t, error), "error"),
          });
        },
      },
    ]);
  };

  const addButton = (
    <Button
      label={t("categories.add")}
      icon={<Plus size={18} color={colors.primaryForeground} />}
      onPress={() => router.push({ pathname: "/category-form" })}
    />
  );

  let body;
  if (categories.isPending || events.isPending) {
    body = <LoadingState />;
  } else if (categories.isError || events.isError) {
    body = (
      <ErrorState
        detail={errorMessage(t, categories.error ?? events.error)}
        onRetry={() => {
          void categories.refetch();
          void events.refetch();
        }}
      />
    );
  } else if (categories.data.length === 0) {
    body = <EmptyState title={t("categories.empty")} />;
  } else {
    const counts = new Map<string, number>();
    for (const event of events.data) {
      if (event.categoryId) counts.set(event.categoryId, (counts.get(event.categoryId) ?? 0) + 1);
    }
    body = (
      <View>
        {categories.data.map((category) => {
          const name = getCategoryName(category, t);
          return (
            <View
              key={category.id}
              className="flex-row items-center gap-3 border-b border-border py-3"
            >
              <IconBadge colorKey={category.color} icon={category.icon} />
              <View className="flex-1">
                <Text weight="medium" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-sm text-muted">
                  {t("categories.eventCount", { count: counts.get(category.id) ?? 0 })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("common.edit")} ${name}`}
                onPress={() =>
                  router.push({ pathname: "/category-form", params: { id: category.id } })
                }
                className="size-11 items-center justify-center rounded-lg active:bg-surface-muted"
              >
                <Pencil size={18} color={colors.textMuted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("common.delete")} ${name}`}
                onPress={() => confirmDelete(category.id, name)}
                className="size-11 items-center justify-center rounded-lg active:bg-surface-muted"
              >
                <Trash2 size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <Screen title={t("nav.categories")} action={addButton}>
      {body}
    </Screen>
  );
}
