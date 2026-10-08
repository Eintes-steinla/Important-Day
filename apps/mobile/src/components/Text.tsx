import { Text as RNText, type TextProps } from "react-native";

const WEIGHT_CLASS = {
  regular: "font-sans",
  medium: "font-sans-medium",
  semibold: "font-sans-semibold",
  bold: "font-sans-bold",
  display: "font-display",
  displaySemibold: "font-display-semibold",
} as const;

export type TextWeight = keyof typeof WEIGHT_CLASS;

/** Text mặc định của app: đúng font và màu chữ. Độ đậm chọn bằng `weight` vì font tùy chỉnh không tự đổi độ đậm. */
export function Text({
  weight = "regular",
  className,
  ...props
}: TextProps & { weight?: TextWeight; className?: string }) {
  return (
    <RNText className={`${WEIGHT_CLASS[weight]} text-foreground ${className ?? ""}`} {...props} />
  );
}
