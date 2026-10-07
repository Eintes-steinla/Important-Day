import { DEFAULT_EVENT_COLOR_KEY, DEFAULT_EVENT_ICON } from "./constants";
import type { Translate } from "./date/format";
import type { Category, EventItem } from "./models";

/**
 * Màu và icon thực tế của sự kiện: ưu tiên giá trị riêng của sự kiện, sau đó đến danh mục,
 * cuối cùng là mặc định. `colorKey` là khóa trong eventColors (dùng với getEventColor).
 */
export function resolveEventAppearance(
  event: Pick<EventItem, "color" | "icon">,
  category: Pick<Category, "color" | "icon"> | null | undefined,
): { colorKey: string; icon: string } {
  return {
    colorKey: event.color ?? category?.color ?? DEFAULT_EVENT_COLOR_KEY,
    icon: event.icon ?? category?.icon ?? DEFAULT_EVENT_ICON,
  };
}

/** Tên hiển thị của danh mục: tên người dùng đặt, hoặc tên mặc định đã dịch theo locale. */
export function getCategoryName(
  category: Pick<Category, "name" | "defaultKey">,
  t: Translate,
): string {
  if (category.name) return category.name;
  return category.defaultKey ? t(`categories.default.${category.defaultKey}`) : "";
}
