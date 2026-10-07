import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { THEME_PREFERENCES } from "../theme";

/**
 * Quy ước: thông báo lỗi của mọi schema là KEY i18n (vd "validation.title.required"),
 * UI hiển thị bằng `t(issue.message)`. Key nằm trong packages/core/locales/{vi,en}.json
 * và có test đảm bảo tồn tại ở cả hai ngôn ngữ.
 */

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);
export const themePreferenceSchema = z.enum(THEME_PREFERENCES);
export const calendarTypeSchema = z.enum(["solar", "lunar"]);

/** Chuỗi tùy chọn: cắt khoảng trắng, chuỗi rỗng hoặc thiếu đều thành null. */
export function optionalText(max: number, tooLongMessage: string) {
  return z
    .string()
    .trim()
    .max(max, tooLongMessage)
    .nullish()
    .transform((value) => value || null);
}
