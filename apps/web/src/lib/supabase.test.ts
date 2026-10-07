import { describe, expect, it } from "vitest";
import { createSupabaseSetup } from "./supabase";

describe("createSupabaseSetup", () => {
  it("thiếu cấu hình thì trả lỗi để hiện màn hình hướng dẫn", () => {
    const result = createSupabaseSetup({});
    expect(result.ok).toBe(false);
  });

  it("từ chối khóa bí mật sb_secret_", () => {
    const result = createSupabaseSetup({
      url: "https://abc.supabase.co",
      anonKey: "sb_secret_abcdef",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/bí mật/);
  });

  it("chấp nhận publishable key", () => {
    const result = createSupabaseSetup({
      url: "https://abc.supabase.co",
      anonKey: "sb_publishable_abcdef",
    });
    expect(result.ok).toBe(true);
  });
});
