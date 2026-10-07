import { getEventColor, formatPlainDate, type Language } from "@important-dates/core";
import { cn } from "../lib/cn";
import { useAppearance } from "../providers/AppearanceProvider";

/**
 * Tờ lịch bloc: dải tháng phía trên, số ngày lớn bên dưới, tô theo màu sự kiện.
 * Đây là hình ảnh nhận diện duy nhất của app, dùng ở danh sách sắp tới và lịch từng ngày.
 */
export function EventLeaf({
  day,
  month,
  colorKey,
  size = "md",
  language,
}: {
  day: number;
  month: number;
  colorKey: string;
  size?: "sm" | "md";
  language?: Language;
}) {
  const appearance = useAppearance();
  const color = getEventColor(colorKey, appearance.resolvedTheme);
  const monthLabel = formatPlainDate(
    { year: 2000, month, day: 1 },
    language ?? appearance.language,
    { month: "short" },
  );
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-lg text-center",
        size === "md" ? "w-14" : "w-11",
      )}
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      <span
        className={cn(
          "font-semibold leading-none",
          size === "md" ? "py-1 text-[11px]" : "py-0.5 text-[10px]",
        )}
        style={{ backgroundColor: color.fg, color: color.bg }}
      >
        {monthLabel}
      </span>
      <span
        className={cn(
          "font-display font-bold leading-none",
          size === "md" ? "py-2 text-2xl" : "py-1.5 text-lg",
        )}
      >
        {day}
      </span>
    </div>
  );
}
