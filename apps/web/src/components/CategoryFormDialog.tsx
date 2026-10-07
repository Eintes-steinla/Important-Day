import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  categoryInputSchema,
  getCategoryName,
  type Category,
  type CategoryFormInput,
  type CategoryInput,
} from "@important-dates/core";
import { errorMessage } from "../lib/errors";
import { useSaveCategory } from "../hooks/queries";
import { useToast } from "../providers/ToastProvider";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { FieldGroup, TextField } from "./fields";
import { ColorPicker, IconPicker } from "./pickers";

export function CategoryFormDialog({
  open,
  category,
  onClose,
}: {
  open: boolean;
  /** null = tạo mới. */
  category: Category | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={category ? t("categories.edit") : t("categories.add")}
    >
      <CategoryForm category={category} onClose={onClose} />
    </Dialog>
  );
}

function CategoryForm({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const save = useSaveCategory();
  const originalName = category ? getCategoryName(category, t) : "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: {
      name: originalName,
      color: category?.color ?? "indigo",
      icon: category?.icon ?? "tag",
    },
  });
  const color = watch("color") ?? "indigo";
  const icon = watch("icon") ?? "tag";

  const onValid = async (values: CategoryInput) => {
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
      onClose();
    } catch {
      // Lỗi hiển thị bằng save.error bên dưới
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onValid)(e)} noValidate className="space-y-5">
      <TextField
        label={t("categories.fields.name")}
        autoComplete="off"
        error={errors.name?.message ? t(errors.name.message) : undefined}
        {...register("name")}
      />
      <FieldGroup legend={t("events.fields.color")}>
        <ColorPicker
          name="category-color"
          value={color}
          onChange={(v) => setValue("color", v ?? "indigo", { shouldDirty: true })}
        />
      </FieldGroup>
      <FieldGroup legend={t("events.fields.icon")}>
        <IconPicker
          name="category-icon"
          value={icon}
          onChange={(v) => setValue("icon", v ?? "tag", { shouldDirty: true })}
        />
      </FieldGroup>
      {save.error ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage(t, save.error)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="subtle" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
