import type { Config } from "tailwindcss";

// Màu trỏ tới CSS variables (được đổ từ design tokens của packages/core trong src/theme/applyTheme.ts)
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface: token("surface"),
        "surface-muted": token("surface-muted"),
        foreground: token("text"),
        muted: token("text-muted"),
        border: token("border"),
        primary: token("primary"),
        "primary-foreground": token("primary-foreground"),
        danger: token("danger"),
      },
    },
  },
  plugins: [],
} satisfies Config;
