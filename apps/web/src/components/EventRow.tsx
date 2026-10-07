import {
  getCategoryName,
  getEventColor,
  getYearsLabel,
  resolveEventAppearance,
  type Category,
  type EventItem,
} from "@important-dates/core";
import { EventIcon } from "../lib/icons";
import { useAppearance } from "../providers/AppearanceProvider";

/** Dòng phụ của sự kiện: danh mục và (nếu có năm gốc) số năm kỷ niệm. */
export function eventSubtitle(
  event: EventItem,
  category: Category | undefined,
  years: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];
  if (category) parts.push(getCategoryName(category, t));
  if (years !== null && years > 0) parts.push(getYearsLabel(years, t));
  // Gộp bằng dấu phẩy để câu vẫn đọc tự nhiên cả khi chỉ có một phần
  return parts.join(", ");
}

/** Huy hiệu icon tròn tô màu sự kiện, dùng trong danh sách theo ngày. */
export function EventBadge({
  event,
  category,
}: {
  event: EventItem;
  category: Category | undefined;
}) {
  const { resolvedTheme } = useAppearance();
  const appearance = resolveEventAppearance(event, category);
  const color = getEventColor(appearance.colorKey, resolvedTheme);
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      <EventIcon name={appearance.icon} />
    </span>
  );
}

export function lunarSubtitle(
  event: EventItem,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const base = t("events.lunarDate", { day: event.day, month: event.month });
  return event.isLeapMonth ? `${base} ${t("events.leapMonthSuffix")}` : base;
}
