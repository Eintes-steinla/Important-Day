import {
  createAppSupabaseClient,
  parseSupabaseEnv,
  type AppSupabaseClient,
} from "@important-dates/core";

export type SupabaseSetup =
  { ok: true; client: AppSupabaseClient } | { ok: false; message: string };

/** Tạo client từ biến môi trường; thiếu cấu hình hoặc nhầm khóa bí mật thì trả lỗi để hiện màn hình hướng dẫn. */
export function createSupabaseSetup(env: { url?: string; anonKey?: string }): SupabaseSetup {
  try {
    const config = parseSupabaseEnv(env);
    return { ok: true, client: createAppSupabaseClient(config) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
