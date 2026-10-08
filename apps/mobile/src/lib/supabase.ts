import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAppSupabaseClient,
  parseSupabaseEnv,
  type AppSupabaseClient,
} from "@important-dates/core";

export type SupabaseSetup =
  { ok: true; client: AppSupabaseClient } | { ok: false; message: string };

/** Tạo client; thiếu cấu hình hoặc nhầm khóa bí mật thì trả lỗi để hiện màn hình hướng dẫn. */
export function createSupabaseSetup(env: { url?: string; anonKey?: string }): SupabaseSetup {
  try {
    const config = parseSupabaseEnv(env);
    const client = createAppSupabaseClient(config, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Mobile không có URL callback như trình duyệt
        detectSessionInUrl: false,
      },
    });
    return { ok: true, client };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
