import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { Text } from "./Text";
import { useAppearance } from "../providers/AppearanceProvider";

type Variant = "primary" | "subtle" | "ghost" | "danger";

const BOX: Record<Variant, string> = {
  primary: "bg-primary",
  subtle: "bg-surface-muted",
  ghost: "",
  danger: "bg-danger",
};
const LABEL: Record<Variant, string> = {
  primary: "text-primary-foreground",
  subtle: "text-foreground",
  ghost: "text-muted",
  danger: "text-background",
};

export function Button({
  label,
  icon,
  variant = "primary",
  loading = false,
  className,
  disabled,
  ...props
}: Omit<PressableProps, "children"> & {
  label: string;
  icon?: ReactNode;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}) {
  const { colors } = useAppearance();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg px-4 active:opacity-80 ${BOX[variant]} ${inactive ? "opacity-50" : ""} ${className ?? ""}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.primaryForeground : colors.text}
          size="small"
        />
      ) : (
        icon
      )}
      <Text weight="semibold" className={`text-sm ${LABEL[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
