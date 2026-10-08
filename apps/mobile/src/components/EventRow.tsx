import { View } from "react-native";
import {
  getCategoryName,
  getEventColor,
  getYearsLabel,
  resolveEventAppearance,
  type Category,
  type EventItem,
} from "@important-dates/core";
import { getIcon } from "../lib/icons";
import { useAppearance } from "../providers/AppearanceProvider";

type T = (key: string, options?: Record<string, unknown>) => string;

/** Dòng phụ của sự kiện: danh mục và (nếu có năm gốc) số năm kỷ niệm. */
export function eventSubtitle(
  event: EventItem,
  category: Category | undefined,
  years: number | null,
  t: T,
): string {
  const parts: string[] = [];
  if (category) parts.push(getCategoryName(category, t));
  if (years !== null && years > 0) parts.push(getYearsLabel(years, t));
  return parts.join(", ");
}

export function lunarSubtitle(event: EventItem, t: T): string {
  const base = t("events.lunarDate", { day: event.day, month: event.month });
  return event.isLeapMonth ? `${base} ${t("events.leapMonthSuffix")}` : base;
}

/** Huy hiệu icon tròn tô màu (danh mục hoặc sự kiện). */
export function IconBadge({
  colorKey,
  icon,
  size = 40,
}: {
  colorKey: string;
  icon: string | null;
  size?: number;
}) {
  const { resolvedTheme } = useAppearance();
  const color = getEventColor(colorKey, resolvedTheme);
  const Icon = getIcon(icon);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: color.bg }}
    >
      <Icon size={size * 0.45} color={color.fg} />
    </View>
  );
}

export function EventBadge({
  event,
  category,
}: {
  event: EventItem;
  category: Category | undefined;
}) {
  const appearance = resolveEventAppearance(event, category);
  return <IconBadge colorKey={appearance.colorKey} icon={appearance.icon} />;
}
