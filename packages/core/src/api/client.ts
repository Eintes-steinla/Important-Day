import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../database.types";

/** Kiểu client dùng xuyên suốt lớp truy cập dữ liệu. */
export type AppSupabaseClient = SupabaseClient<Database>;

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Giải mã base64/base64url thành chuỗi (mỗi byte là một ký tự). Tự viết thay vì dùng `atob`
 * vì `atob` không có sẵn ở mọi runtime (kiểu của React Native, Hermes cũ), mà việc chặn
 * service_role không được phép âm thầm mất tác dụng.
 */
function decodeBase64(input: string): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of input.replace(/-/g, "+").replace(/_/g, "/")) {
    if (char === "=") break;
    const index = BASE64_ALPHABET.indexOf(char);
    if (index < 0) throw new Error("Ký tự base64 không hợp lệ");
    buffer = ((buffer << 6) | index) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

function decodeJwtRole(token: string): string | null {
  const parts = token.split(".");
  const payload = parts[1];
  if (parts.length !== 3 || !payload) return null;
  try {
    const data: unknown = JSON.parse(decodeBase64(payload));
    if (typeof data === "object" && data !== null && "role" in data) {
      return String((data as { role: unknown }).role);
    }
  } catch {
    // Không phải JWT hợp lệ thì không kết luận gì
  }
  return null;
}

/**
 * Chặn đưa khóa bí mật vào client: `service_role` (JWT cũ) và `sb_secret_...` (khóa mới) bỏ qua
 * RLS nên tuyệt đối không được xuất hiện trong web/mobile.
 */
export function assertClientSafeKey(key: string): void {
  if (key.startsWith("sb_secret_") || decodeJwtRole(key) === "service_role") {
    throw new Error(
      "Khóa Supabase này là khóa bí mật (service_role/secret). Chỉ dùng anon key hoặc publishable key trong ứng dụng client.",
    );
  }
}

const URL_MESSAGE = "Thiếu hoặc sai SUPABASE_URL (dạng https://<project>.supabase.co)";
const KEY_MESSAGE = "Thiếu Supabase anon/publishable key";

const envSchema = z.object({
  // Truyền message cho cả lỗi "thiếu giá trị" (undefined) để không hiện câu báo lỗi chung của Zod
  url: z.string(URL_MESSAGE).pipe(z.url(URL_MESSAGE)),
  key: z.string(KEY_MESSAGE).trim().min(1, KEY_MESSAGE),
});

/** Kiểm tra cấu hình lấy từ biến môi trường, báo lỗi rõ ràng nếu thiếu hoặc nhầm khóa. */
export function parseSupabaseEnv(env: { url?: string; anonKey?: string }): {
  url: string;
  anonKey: string;
} {
  const parsed = envSchema.safeParse({ url: env.url?.trim(), key: env.anonKey });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  assertClientSafeKey(parsed.data.key);
  return { url: parsed.data.url, anonKey: parsed.data.key };
}

/**
 * Tạo Supabase client. Mỗi app truyền cấu hình auth phù hợp, ví dụ mobile truyền `storage`
 * (expo-secure-store/AsyncStorage) và `detectSessionInUrl: false`.
 */
export function createAppSupabaseClient(
  config: { url: string; anonKey: string },
  options?: SupabaseClientOptions<"public">,
): AppSupabaseClient {
  assertClientSafeKey(config.anonKey);
  return createClient<Database>(config.url, config.anonKey, options);
}
