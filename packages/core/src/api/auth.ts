import { signInSchema, signUpSchema, type SignInInput, type SignUpFormInput } from "../schemas";
import type { AppSupabaseClient } from "./client";
import { ApiError, toAuthError } from "./errors";
import { parseOrThrow } from "./validation";

export interface SignUpResult {
  userId: string;
  /** true nếu dự án bật xác nhận email: chưa có phiên đăng nhập cho đến khi bấm link trong email. */
  needsEmailConfirmation: boolean;
}

/**
 * Đăng ký bằng email + mật khẩu. display_name và language được gửi qua metadata để trigger ở DB
 * tạo profile đúng ngôn ngữ ngay từ đầu. Chừa chỗ thêm Google sau (signInWithOAuth).
 */
export async function signUpWithEmail(
  client: AppSupabaseClient,
  input: SignUpFormInput,
): Promise<SignUpResult> {
  const parsed = parseOrThrow(signUpSchema, input);
  const metadata: Record<string, string> = {};
  if (parsed.displayName) metadata.display_name = parsed.displayName;
  if (parsed.language) metadata.language = parsed.language;

  const { data, error } = await client.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: { data: metadata },
  });
  if (error) throw toAuthError(error);
  if (!data.user) throw new ApiError("auth", "errors.generic");

  // Khi bật xác nhận email, Supabase chống dò email bằng cách trả "thành công" giả cho email đã tồn
  // tại: user có mảng identities rỗng. Báo lỗi rõ ràng thay vì để người dùng chờ email không đến.
  if (data.user.identities?.length === 0) {
    throw new ApiError("auth", "errors.auth.userExists", { code: "user_already_exists" });
  }
  return { userId: data.user.id, needsEmailConfirmation: data.session === null };
}

export async function signInWithEmail(
  client: AppSupabaseClient,
  input: SignInInput,
): Promise<{ userId: string }> {
  const parsed = parseOrThrow(signInSchema, input);
  const { data, error } = await client.auth.signInWithPassword(parsed);
  if (error) throw toAuthError(error);
  return { userId: data.user.id };
}

export async function signOut(client: AppSupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw toAuthError(error);
}

/** id của user đang đăng nhập đọc từ phiên lưu local (không gọi mạng). null nếu chưa đăng nhập. */
export async function getCurrentUserId(client: AppSupabaseClient): Promise<string | null> {
  const { data, error } = await client.auth.getSession();
  if (error) throw toAuthError(error);
  return data.session?.user.id ?? null;
}
