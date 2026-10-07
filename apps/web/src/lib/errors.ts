import { ApiError } from "@important-dates/core";

type T = (key: string) => string;

/** Thông báo lỗi thân thiện cho người dùng, luôn qua i18n. */
export function errorMessage(t: T, error: unknown): string {
  return t(error instanceof ApiError ? error.messageKey : "errors.generic");
}
