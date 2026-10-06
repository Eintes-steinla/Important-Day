import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // PGlite khởi động Postgres WASM nên lần đầu hơi chậm
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
