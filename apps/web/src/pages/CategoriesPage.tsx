import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryName, getEventColor, type Category } from "@important-dates/core";
import { Button } from "../components/Button";
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useCategoriesQuery, useDeleteCategory, useEventsQuery } from "../hooks/queries";
import { errorMessage } from "../lib/errors";
import { EventIcon } from "../lib/icons";
import { useAppearance } from "../providers/AppearanceProvider";
import { useToast } from "../providers/ToastProvider";

export function CategoriesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { resolvedTheme } = useAppearance();
  const categories = useCategoriesQuery();
  const events = useEventsQuery();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [deleting, setDeleting] = useState<Category | null>(null);

  if (categories.isPending || events.isPending) return <LoadingState />;
  if (categories.isError || events.isError) {
    return (
      <ErrorState
        detail={errorMessage(t, categories.error ?? events.error)}
        onRetry={() => {
          void categories.refetch();
          void events.refetch();
        }}
      />
    );
  }

  const counts = new Map<string, number>();
  for (const event of events.data) {
    if (event.categoryId) counts.set(event.categoryId, (counts.get(event.categoryId) ?? 0) + 1);
  }

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.show(t("categories.deleted"));
    } catch (error) {
      toast.show(errorMessage(t, error), "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t("nav.categories")}</h1>
        <Button onClick={() => setEditing({ open: true, category: null })}>
          <Plus aria-hidden="true" size={18} />
          {t("categories.add")}
        </Button>
      </div>

      {categories.data.length === 0 ? (
        <EmptyState title={t("categories.empty")} />
      ) : (
        <ul className="divide-y divide-border">
          {categories.data.map((category) => {
            const color = getEventColor(category.color, resolvedTheme);
            const name = getCategoryName(category, t);
            return (
              <li key={category.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color.bg, color: color.fg }}
                >
                  <EventIcon name={category.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="text-sm text-muted">
                    {t("categories.eventCount", { count: counts.get(category.id) ?? 0 })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="size-11 px-0"
                  aria-label={`${t("common.edit")} ${name}`}
                  onClick={() => setEditing({ open: true, category })}
                >
                  <Pencil aria-hidden="true" size={18} />
                </Button>
                <Button
                  variant="ghost"
                  className="size-11 px-0"
                  aria-label={`${t("common.delete")} ${name}`}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 aria-hidden="true" size={18} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <CategoryFormDialog
        open={editing.open}
        category={editing.category}
        onClose={() => setEditing((current) => ({ ...current, open: false }))}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t("categories.deleteTitle", { name: deleting ? getCategoryName(deleting, t) : "" })}
        body={t("categories.deleteBody")}
        confirmLabel={t("categories.delete")}
        busy={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
