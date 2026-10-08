import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { categoryInputSchema, getCategoryName, type Category } from "@important-dates/core";
import { Button } from "../components/Button";
import { FieldGroup, TextField } from "../components/fields";
import { ColorPicker, IconPicker } from "../components/pickers";
import { ErrorState, LoadingState } from "../components/StateViews";
import { Text } from "../components/Text";
import { useCategoriesQuery, useSaveCategory } from "../hooks/queries";
import { errorMessage } from "../lib/errors";
import { fieldErrors } from "../lib/forms";
import { useToast } from "../providers/ToastProvider";
import { ModalFrame } from "./ModalFrame";

export function CategoryFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const categories = useCategoriesQuery();
  const title = id ? t("categories.edit") : t("categories.add");

  if (categories.isPending) {
    return (
      <ModalFrame title={title}>
        <LoadingState />
      </ModalFrame>
    );
  }
  if (categories.isError) {
    return (
      <ModalFrame title={title}>
        <ErrorState
          detail={errorMessage(t, categories.error)}
          onRetry={() => void categories.refetch()}
        />
      </ModalFrame>
    );
  }
  return (
    <ModalFrame title={title}>
      <CategoryForm category={categories.data.find((c) => c.id === id) ?? null} />
    </ModalFrame>
  );
}

function CategoryForm({ category }: { category: Category | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const save = useSaveCategory();
  const originalName = category ? getCategoryName(category, t) : "";

  const [name, setName] = useState(originalName);
  const [color, setColor] = useState(category?.color ?? "indigo");
  const [icon, setIcon] = useState(category?.icon ?? "tag");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const parsed = categoryInputSchema.safeParse({ name, color, icon });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const values = parsed.data;
    try {
      // Danh mục mặc định không đổi tên: chỉ cập nhật màu/icon để tên vẫn được dịch theo ngôn ngữ
      const keepDefaultName =
        category?.defaultKey && !category.name && values.name === originalName;
      if (category && keepDefaultName) {
        await save.mutateAsync({
          id: category.id,
          appearanceOnly: true,
          input: { color: values.color, icon: values.icon },
        });
      } else if (category) {
        await save.mutateAsync({ id: category.id, appearanceOnly: false, input: values });
      } else {
        await save.mutateAsync({ id: null, input: values });
      }
      toast.show(t(category ? "categories.updated" : "categories.created"));
      router.back();
    } catch {
      // Lỗi hiển thị bằng save.error bên dưới
    }
  };

  return (
    <View className="gap-5">
      <TextField
        label={t("categories.fields.name")}
        value={name}
        onChangeText={setName}
        error={errors.name ? t(errors.name) : undefined}
      />
      <FieldGroup legend={t("events.fields.color")}>
        <ColorPicker value={color} onChange={(next) => setColor(next ?? "indigo")} />
      </FieldGroup>
      <FieldGroup legend={t("events.fields.icon")}>
        <IconPicker value={icon} onChange={(next) => setIcon(next ?? "tag")} />
      </FieldGroup>
      {save.error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {errorMessage(t, save.error)}
        </Text>
      ) : null}
      <Button
        label={save.isPending ? t("common.saving") : t("common.save")}
        loading={save.isPending}
        onPress={() => void submit()}
      />
    </View>
  );
}
