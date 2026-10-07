import { z } from "zod";
import { DEFAULT_REMIND_DAYS_BEFORE, LIMITS } from "../constants";
import { validateEventDate } from "../date/validate";
import { calendarTypeSchema, optionalText } from "./common";

const remindDaysSchema = z
  .array(
    z
      .number("validation.remind.invalid")
      .int("validation.remind.invalid")
      .min(0, "validation.remind.invalid")
      .max(LIMITS.remindDaysMax, "validation.remind.invalid"),
  )
  .max(LIMITS.remindCountMax, "validation.remind.tooMany")
  // Bỏ trùng và sắp xếp tăng dần để dữ liệu lưu ổn định
  .transform((days) => [...new Set(days)].sort((a, b) => a - b));

/**
 * Dữ liệu form tạo/sửa sự kiện. Quy tắc khớp ràng buộc ở DB (xem supabase/migrations).
 * - Đầu vào (`EventFormInput`): các trường tùy chọn có thể thiếu hoặc rỗng.
 * - Đầu ra (`EventInput`): đã chuẩn hóa (cắt khoảng trắng, rỗng -> null, nhắc trước sắp xếp).
 */
export const eventInputSchema = z
  .object({
    title: z
      .string("validation.title.required")
      .trim()
      .min(1, "validation.title.required")
      .max(LIMITS.titleMax, "validation.title.tooLong"),
    note: optionalText(LIMITS.noteMax, "validation.note.tooLong"),
    calendarType: calendarTypeSchema.default("solar"),
    day: z
      .number("validation.date.invalid")
      .int("validation.date.invalid")
      .min(1, "validation.date.invalid")
      .max(31, "validation.date.invalid"),
    month: z
      .number("validation.date.invalid")
      .int("validation.date.invalid")
      .min(1, "validation.date.invalid")
      .max(12, "validation.date.invalid"),
    // null/thiếu = không rõ năm: lặp mỗi năm, không tính tuổi/số năm
    year: z
      .number("validation.year.invalid")
      .int("validation.year.invalid")
      .min(LIMITS.yearMin, "validation.year.invalid")
      .max(LIMITS.yearMax, "validation.year.invalid")
      .nullish()
      .transform((value) => value ?? null),
    isLeapMonth: z.boolean().default(false),
    // "" (chọn "Không có danh mục" trong form) cũng được hiểu là null
    categoryId: z
      .union([z.literal(""), z.uuid("errors.invalidData")])
      .nullish()
      .transform((value) => value || null),
    color: optionalText(LIMITS.tokenMax, "errors.invalidData"),
    icon: optionalText(LIMITS.iconMax, "errors.invalidData"),
    remindDaysBefore: remindDaysSchema.default([...DEFAULT_REMIND_DAYS_BEFORE]),
  })
  .superRefine((value, ctx) => {
    const dateError = validateEventDate(value);
    if (dateError) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: `validation.date.${dateError}`,
      });
    }
    if (value.isLeapMonth && value.calendarType !== "lunar") {
      ctx.addIssue({
        code: "custom",
        path: ["isLeapMonth"],
        message: "validation.leapMonth.lunarOnly",
      });
    }
  });

export type EventFormInput = z.input<typeof eventInputSchema>;
export type EventInput = z.output<typeof eventInputSchema>;
