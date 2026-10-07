import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_REMIND_DAYS_BEFORE,
  eventInputSchema,
  getCategoryName,
  type Category,
  type EventFormInput,
  type EventInput,
  type EventItem,
  type PlainDate,
} from "@important-dates/core";
import { cn } from "../lib/cn";
import { errorMessage } from "../lib/errors";
import { useDeleteEvent, useSaveEvent } from "../hooks/queries";
import { useToast } from "../providers/ToastProvider";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dialog } from "./Dialog";
import { FieldGroup, SegmentedRadio, TextField, inputClass } from "./fields";
import { ColorPicker, IconPicker } from "./pickers";

const REMIND_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

const toNumber = (value: unknown): number => (value === "" ? Number.NaN : Number(value));
const toYear = (value: unknown): number | null =>
  value === "" || value == null ? null : Number(value);

function defaultValues(event: EventItem | null, date: PlainDate): EventFormInput {
  if (event) {
    return {
      title: event.title,
      note: event.note ?? "",
      calendarType: event.calendarType,
      day: event.day,
      month: event.month,
      year: event.year,
      isLeapMonth: event.isLeapMonth,
      categoryId: event.categoryId ?? "",
      color: event.color,
      icon: event.icon,
      remindDaysBefore: event.remindDaysBefore,
    };
  }
  return {
    title: "",
    note: "",
    calendarType: "solar",
    day: date.day,
    month: date.month,
    year: null,
    isLeapMonth: false,
    categoryId: "",
    color: null,
    icon: null,
    remindDaysBefore: [...DEFAULT_REMIND_DAYS_BEFORE],
  };
}

export interface EventFormDialogProps {
  open: boolean;
  /** null = tạo mới. */
  event: EventItem | null;
  /** Ngày điền sẵn khi tạo mới. */
  defaultDate: PlainDate;
  categories: Category[];
  onClose: () => void;
}

export function EventFormDialog({
  open,
  event,
  defaultDate,
  categories,
  onClose,
}: EventFormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={event ? t("events.edit") : t("events.add")}>
      {/* Form chỉ được dựng khi mở nên mỗi lần mở là một trạng thái mới */}
      <EventForm
        event={event}
        defaultDate={defaultDate}
        categories={categories}
        onClose={onClose}
      />
    </Dialog>
  );
}

function EventForm({
  event,
  defaultDate,
  categories,
  onClose,
}: Omit<EventFormDialogProps, "open">) {
  const { t } = useTranslation();
  const toast = useToast();
  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [yearKnown, setYearKnown] = useState(event?.year != null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormInput, unknown, EventInput>({
    resolver: zodResolver(eventInputSchema),
    defaultValues: defaultValues(event, defaultDate),
  });

  const calendarType = watch("calendarType") ?? "solar";
  const color = watch("color") ?? null;
  const icon = watch("icon") ?? null;
  const remind = watch("remindDaysBefore") ?? [];
  const message = (key: string | undefined) => (key ? t(key) : undefined);

  const onValid = async (values: EventInput) => {
    try {
      await save.mutateAsync({ id: event?.id ?? null, input: values });
      toast.show(t(event ? "events.updated" : "events.created"));
      onClose();
    } catch {
      // Lỗi hiển thị bằng save.error bên dưới
    }
  };

  const onDelete = async () => {
    if (!event) return;
    try {
      await remove.mutateAsync(event.id);
      toast.show(t("events.deleted"));
      setConfirmingDelete(false);
      onClose();
    } catch (error) {
      setConfirmingDelete(false);
      toast.show(errorMessage(t, error), "error");
    }
  };

  const toggleRemind = (days: number) => {
    const next = remind.includes(days) ? remind.filter((d) => d !== days) : [...remind, days];
    setValue(
      "remindDaysBefore",
      next.sort((a, b) => a - b),
      { shouldDirty: true },
    );
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onValid)(e)} noValidate className="space-y-5">
      <TextField
        label={t("events.fields.title")}
        autoComplete="off"
        error={message(errors.title?.message)}
        {...register("title")}
      />

      <FieldGroup legend={t("events.fields.calendarType")}>
        <SegmentedRadio<"solar" | "lunar">
          name="calendarType"
          value={calendarType}
          options={[
            { value: "solar", label: t("events.fields.solar") },
            { value: "lunar", label: t("events.fields.lunar") },
          ]}
          onChange={(value) => {
            setValue("calendarType", value, { shouldDirty: true });
            if (value === "solar") setValue("isLeapMonth", false);
          }}
        />
      </FieldGroup>

      <FieldGroup
        legend={t("events.fields.date")}
        error={message(
          errors.day?.message ??
            errors.month?.message ??
            errors.year?.message ??
            errors.isLeapMonth?.message,
        )}
      >
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-xs text-muted">
            {t("events.fields.day")}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              className={cn(inputClass, "mt-1 text-foreground")}
              {...register("day", { setValueAs: toNumber })}
            />
          </label>
          <label className="block text-xs text-muted">
            {t("events.fields.month")}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              className={cn(inputClass, "mt-1 text-foreground")}
              {...register("month", { setValueAs: toNumber })}
            />
          </label>
          <label className="block text-xs text-muted">
            {t("events.fields.year")}
            <input
              type="number"
              inputMode="numeric"
              disabled={!yearKnown}
              className={cn(inputClass, "mt-1 text-foreground disabled:opacity-50")}
              {...register("year", { setValueAs: toYear })}
            />
          </label>
        </div>
        <label className="mt-3 flex min-h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!yearKnown}
            onChange={(e) => {
              const unknown = e.target.checked;
              setYearKnown(!unknown);
              setValue("year", unknown ? null : defaultDate.year, { shouldDirty: true });
            }}
            className="size-4 accent-primary"
          />
          {t("events.fields.yearUnknown")}
        </label>
        {calendarType === "lunar" ? (
          <>
            <label className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                {...register("isLeapMonth")}
              />
              {t("events.fields.leapMonth")}
            </label>
            <p className="mt-1 text-xs text-muted">{t("events.fields.lunarHint")}</p>
          </>
        ) : null}
      </FieldGroup>

      <div>
        <label htmlFor="event-category" className="mb-1.5 block text-sm font-medium">
          {t("events.fields.category")}
        </label>
        <select id="event-category" className={inputClass} {...register("categoryId")}>
          <option value="">{t("events.fields.noCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryName(category, t)}
            </option>
          ))}
        </select>
      </div>

      {/* Màu và icon mặc định theo danh mục nên gập lại cho form ngắn gọn */}
      <details className="group" open={color !== null || icon !== null}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          {t("events.fields.appearance")}
          <ChevronDown
            aria-hidden="true"
            size={18}
            className="ml-1 text-muted transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="space-y-5 pt-2">
          <FieldGroup legend={t("events.fields.color")}>
            <ColorPicker
              name="event-color"
              allowInherit
              value={color}
              onChange={(v) => setValue("color", v, { shouldDirty: true })}
            />
          </FieldGroup>

          <FieldGroup legend={t("events.fields.icon")}>
            <IconPicker
              name="event-icon"
              allowInherit
              value={icon}
              onChange={(v) => setValue("icon", v, { shouldDirty: true })}
            />
          </FieldGroup>
        </div>
      </details>

      <FieldGroup
        legend={t("events.fields.remind")}
        error={message(errors.remindDaysBefore?.message)}
      >
        <div className="flex flex-wrap gap-2">
          {REMIND_OPTIONS.map((days) => (
            <label
              key={days}
              className={cn(
                "flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                remind.includes(days)
                  ? "border-primary bg-surface-muted font-medium"
                  : "border-border text-muted",
              )}
            >
              <input
                type="checkbox"
                checked={remind.includes(days)}
                onChange={() => toggleRemind(days)}
                className="sr-only"
              />
              {days === 0
                ? t("events.fields.remindOnDay")
                : t("events.fields.remindDays", { count: days })}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{t("events.fields.remindHint")}</p>
      </FieldGroup>

      <div>
        <label htmlFor="event-note" className="mb-1.5 block text-sm font-medium">
          {t("events.fields.note")}
        </label>
        <textarea
          id="event-note"
          rows={3}
          className={cn(inputClass, "py-2")}
          {...register("note")}
        />
        {errors.note?.message ? (
          <p className="mt-1.5 text-sm text-danger">{t(errors.note.message)}</p>
        ) : null}
      </div>

      {save.error ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage(t, save.error)}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-1">
        {event ? (
          <Button
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => setConfirmingDelete(true)}
          >
            {t("common.delete")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="subtle" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      {event ? (
        <ConfirmDialog
          open={confirmingDelete}
          title={t("events.deleteTitle", { title: event.title })}
          body={t("events.deleteBody")}
          confirmLabel={t("events.delete")}
          busy={remove.isPending}
          onConfirm={() => void onDelete()}
          onClose={() => setConfirmingDelete(false)}
        />
      ) : null}
    </form>
  );
}
