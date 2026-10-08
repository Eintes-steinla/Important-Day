/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Dùng dark mode theo class để cho phép ghi đè thủ công (light/dark/system)
  darkMode: "class",
  theme: {
    extend: {
      // Màu lấy từ design tokens của packages/core. Giá trị cụ thể áp qua `vars()` ở AppearanceProvider.
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        foreground: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--color-primary-foreground) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
      },
      // React Native không tự chọn độ đậm cho font tùy chỉnh: mỗi độ đậm là một family riêng (nạp ở app/_layout.tsx)
      fontFamily: {
        sans: ["BeVietnamPro_400Regular"],
        "sans-medium": ["BeVietnamPro_500Medium"],
        "sans-semibold": ["BeVietnamPro_600SemiBold"],
        "sans-bold": ["BeVietnamPro_700Bold"],
        display: ["BricolageGrotesque_700Bold"],
        "display-semibold": ["BricolageGrotesque_600SemiBold"],
      },
    },
  },
  plugins: [],
};
