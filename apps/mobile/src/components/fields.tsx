import type { ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

export const inputClass =
  "min-h-12 rounded-lg border border-border bg-surface px-3 text-base text-foreground font-sans";

/** Ô nhập kèm nhãn và thông báo lỗi. */
export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: TextInputProps & {
  label: string;
  error?: string | undefined;
  hint?: string;
  className?: string;
}) {
  const { colors } = useAppearance();
  return (
    <View className={className}>
      <Text weight="medium" className="mb-1.5 text-sm">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        className={`${inputClass} ${error ? "border-danger" : ""}`}
        {...props}
      />
      {hint ? <Text className="mt-1.5 text-xs text-muted">{hint}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function FieldGroup({
  legend,
  error,
  children,
  className,
}: {
  legend: string;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={className}>
      <Text weight="medium" className="mb-1.5 text-sm">
        {legend}
      </Text>
      {children}
      {error ? (
        <Text accessibilityRole="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Nhóm nút chọn một giá trị. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      className="flex-row self-start rounded-lg bg-surface-muted p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-10 justify-center rounded-md px-4 ${selected ? "bg-surface" : ""}`}
          >
            <Text weight="medium" className={`text-sm ${selected ? "" : "text-muted"}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Nút nhỏ dạng viên thuốc, dùng cho chọn danh mục và mốc nhắc trước. */
export function Chip({
  label,
  selected,
  onPress,
  role = "checkbox",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: "checkbox" | "radio";
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === "radio" ? { selected } : { checked: selected }}
      onPress={onPress}
      className={`min-h-10 justify-center rounded-full border px-3.5 ${selected ? "border-primary bg-surface-muted" : "border-border"}`}
    >
      <Text
        weight={selected ? "medium" : "regular"}
        className={`text-sm ${selected ? "" : "text-muted"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
