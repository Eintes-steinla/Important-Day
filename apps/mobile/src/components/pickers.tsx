import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { EVENT_ICON_NAMES, eventColors, getEventColor } from "@important-dates/core";
import { Chip } from "./fields";
import { getIcon } from "../lib/icons";
import { useAppearance } from "../providers/AppearanceProvider";

/** Chọn màu từ bảng màu chung. `allowInherit` thêm lựa chọn "Theo danh mục" (giá trị null). */
export function ColorPicker({
  value,
  onChange,
  allowInherit = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowInherit?: boolean;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useAppearance();
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap items-center gap-2">
      {allowInherit ? (
        <Chip
          role="radio"
          label={t("events.fields.useCategoryColor")}
          selected={value === null}
          onPress={() => onChange(null)}
        />
      ) : null}
      {eventColors.map((color) => {
        const swatch = getEventColor(color.key, resolvedTheme);
        const selected = value === color.key;
        return (
          <Pressable
            key={color.key}
            accessibilityRole="radio"
            accessibilityLabel={color.key}
            accessibilityState={{ selected }}
            onPress={() => onChange(color.key)}
            className="size-11 items-center justify-center rounded-full border-2"
            style={{ backgroundColor: swatch.bg, borderColor: swatch.fg }}
          >
            {selected ? <Check size={18} color={swatch.fg} strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconPicker({
  value,
  onChange,
  allowInherit = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowInherit?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useAppearance();
  return (
    <View accessibilityRole="radiogroup">
      {allowInherit ? (
        <View className="mb-2 flex-row">
          <Chip
            role="radio"
            label={t("events.fields.useCategoryIcon")}
            selected={value === null}
            onPress={() => onChange(null)}
          />
        </View>
      ) : null}
      <View className="flex-row flex-wrap">
        {EVENT_ICON_NAMES.map((name) => {
          const Icon = getIcon(name);
          const selected = value === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ selected }}
              onPress={() => onChange(name)}
              className={`h-12 w-[12.5%] items-center justify-center rounded-lg ${selected ? "bg-primary" : ""}`}
            >
              <Icon size={20} color={selected ? colors.primaryForeground : colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
