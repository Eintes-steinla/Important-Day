import type { ZodError } from "zod";

/** Gom lỗi Zod theo tên trường (lấy lỗi đầu tiên của mỗi trường). Message là key i18n. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!(field in result)) result[field] = issue.message;
  }
  return result;
}

/** Chuỗi trong ô nhập số -> số; rỗng thành NaN để Zod báo "ngày không hợp lệ". */
export function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}
