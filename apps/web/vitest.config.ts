import { defineConfig } from "vitest/config";

// Không dùng plugin react: để esbuild biên dịch JSX (runtime tự động) cho nhẹ và ổn định trong test
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
