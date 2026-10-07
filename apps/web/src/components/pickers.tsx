import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EVENT_ICON_NAMES, eventColors, getEventColor } from "@important-dates/core";
import { cn } from "../lib/cn";
import { EventIcon } from "../lib/icons";
import { useAppearance } from "../providers/AppearanceProvider";

/** Chọn màu từ bảng màu chung. `allowInherit` thêm lựa chọn "Theo danh mục" (giá trị null). */
export function ColorPicker({
  value,
  onChange,
  allowInherit = false,
  name,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowInherit?: boolean;
  name: string;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useAppearance();
  return (
    <div role="radiogroup" aria-label={t("events.fields.color")} className="flex flex-wrap gap-2">
      {allowInherit ? (
        <label
          className={cn(
            "flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
            value === null
              ? "border-primary bg-surface-muted font-medium"
              : "border-border text-muted",
          )}
        >
          <input
            type="radio"
            name={name}
            checked={value === null}
            onChange={() => onChange(null)}
            className="sr-only"
          />
          {t("events.fields.useCategoryColor")}
        </label>
      ) : null}
      {eventColors.map((color) => {
        const swatch = getEventColor(color.key, resolvedTheme);
        const checked = value === color.key;
        return (
          <label
            key={color.key}
            className="relative flex size-9 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            style={{
              backgroundColor: swatch.bg,
              color: swatch.fg,
              boxShadow: `inset 0 0 0 2px ${swatch.fg}`,
            }}
          >
            <input
              type="radio"
              name={name}
              value={color.key}
              checked={checked}
              aria-label={color.key}
              onChange={() => onChange(color.key)}
              className="sr-only"
            />
            {checked ? <Check aria-hidden="true" size={16} strokeWidth={3} /> : null}
          </label>
        );
      })}
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
  allowInherit = false,
  name,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowInherit?: boolean;
  name: string;
}) {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-label={t("events.fields.icon")}>
      {allowInherit ? (
        <label
          className={cn(
            "mb-2 inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
            value === null
              ? "border-primary bg-surface-muted font-medium"
              : "border-border text-muted",
          )}
        >
          <input
            type="radio"
            name={name}
            checked={value === null}
            onChange={() => onChange(null)}
            className="sr-only"
          />
          {t("events.fields.useCategoryIcon")}
        </label>
      ) : null}
      <div className="grid grid-cols-8 gap-1">
        {EVENT_ICON_NAMES.map((icon) => (
          <label
            key={icon}
            className={cn(
              "flex aspect-square cursor-pointer items-center justify-center rounded-lg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
              value === icon
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-surface-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              value={icon}
              checked={value === icon}
              aria-label={icon}
              onChange={() => onChange(icon)}
              className="sr-only"
            />
            <EventIcon name={icon} size={18} />
          </label>
        ))}
      </div>
    </div>
  );
}
