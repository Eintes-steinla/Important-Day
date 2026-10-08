import { View } from "react-native";
import { formatPlainDate, getEventColor } from "@important-dates/core";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

/**
 * Tờ lịch bloc: dải tháng phía trên, số ngày lớn bên dưới, tô theo màu sự kiện.
 * Hình ảnh nhận diện duy nhất của app (giống web), dùng ở danh sách sắp tới.
 */
export function EventLeaf({
  day,
  month,
  colorKey,
}: {
  day: number;
  month: number;
  colorKey: string;
}) {
  const { resolvedTheme, language } = useAppearance();
  const color = getEventColor(colorKey, resolvedTheme);
  const monthLabel = formatPlainDate({ year: 2000, month, day: 1 }, language, { month: "short" });
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="w-14 overflow-hidden rounded-lg"
      style={{ backgroundColor: color.bg }}
    >
      <View className="items-center py-1" style={{ backgroundColor: color.fg }}>
        <Text weight="semibold" className="text-[11px] leading-[13px]" style={{ color: color.bg }}>
          {monthLabel}
        </Text>
      </View>
      <View className="items-center py-2">
        <Text weight="display" className="text-2xl leading-7" style={{ color: color.fg }}>
          {day}
        </Text>
      </View>
    </View>
  );
}
