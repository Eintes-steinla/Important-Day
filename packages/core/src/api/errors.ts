/** Lỗi thống nhất của lớp truy cập dữ liệu. UI hiển thị `t(error.messageKey)`. */
export type ApiErrorKind = "auth" | "database" | "network" | "validation" | "unknown";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Mã gốc từ Supabase/PostgREST/Auth (vd "23505", "invalid_credentials"), nếu có. */
  readonly code: string | null;
  /** Key i18n (trong locales) mô tả lỗi cho người dùng. */
  readonly messageKey: string;

  constructor(
    kind: ApiErrorKind,
    messageKey: string,
    options: { code?: string | null; message?: string; cause?: unknown } = {},
  ) {
    super(options.message ?? messageKey, { cause: options.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.code = options.code ?? null;
    this.messageKey = messageKey;
  }
}

/** Dạng tối thiểu của lỗi PostgREST và Auth (tránh phụ thuộc vào kiểu cụ thể của thư viện). */
interface SupabaseErrorLike {
  message?: string;
  code?: string | null;
  status?: number;
}

const NETWORK_PATTERN = /fetch|network|failed to connect|timeout/i;

const AUTH_CODE_MESSAGES: Record<string, string> = {
  invalid_credentials: "errors.auth.invalidCredentials",
  email_not_confirmed: "errors.auth.emailNotConfirmed",
  user_already_exists: "errors.auth.userExists",
  email_exists: "errors.auth.userExists",
  weak_password: "errors.auth.weakPassword",
  over_request_rate_limit: "errors.auth.rateLimited",
  over_email_send_rate_limit: "errors.auth.rateLimited",
};

/** Lỗi từ truy vấn bảng (PostgREST). */
export function toDatabaseError(error: SupabaseErrorLike): ApiError {
  const code = error.code ?? null;
  const options = { code, message: error.message, cause: error };

  // Mất mạng: supabase-js trả lỗi không có mã, thông báo kiểu "TypeError: Failed to fetch"
  if (!code && error.message && NETWORK_PATTERN.test(error.message)) {
    return new ApiError("network", "errors.network", options);
  }
  switch (code) {
    case "PGRST116": // .single() không có dòng nào
      return new ApiError("database", "errors.notFound", options);
    case "42501": // vi phạm RLS hoặc thiếu quyền
      return new ApiError("database", "errors.permissionDenied", options);
    case "23505": // trùng khóa duy nhất
      return new ApiError("database", "errors.duplicate", options);
    case "23514": // vi phạm CHECK
    case "23502": // NOT NULL
    case "23503": // khóa ngoại
    case "22P02": // sai định dạng (vd uuid)
    case "22008": // ngày giờ ngoài khoảng
      return new ApiError("database", "errors.invalidData", options);
    default:
      return new ApiError("database", "errors.generic", options);
  }
}

/** Lỗi từ Supabase Auth. */
export function toAuthError(error: SupabaseErrorLike): ApiError {
  const code = error.code ?? null;
  const options = { code, message: error.message, cause: error };

  if (code && AUTH_CODE_MESSAGES[code]) {
    return new ApiError("auth", AUTH_CODE_MESSAGES[code], options);
  }
  if (!code && error.message && NETWORK_PATTERN.test(error.message)) {
    return new ApiError("network", "errors.network", options);
  }
  if (error.status === 429) return new ApiError("auth", "errors.auth.rateLimited", options);
  return new ApiError("auth", "errors.generic", options);
}

/** Key i18n để hiển thị cho mọi loại lỗi (kể cả lỗi không phải ApiError). */
export function getErrorMessageKey(error: unknown): string {
  return error instanceof ApiError ? error.messageKey : "errors.generic";
}
