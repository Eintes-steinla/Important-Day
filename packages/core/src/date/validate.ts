import type { CalendarType } from "./occurrence";
import { isLeapYear, maxDayInMonthIgnoringYear } from "./plain-date";

/** Mã lỗi, ứng với key dịch `validation.date.<mã>`. */
export type EventDateError = "invalid" | "feb29NotLeap";

/**
 * Kiểm tra ngày của sự kiện, cùng quy tắc với ràng buộc ở DB (events_date_valid và
 * events_feb29_leap_year). Trả về null nếu hợp lệ.
 * - Dương lịch: ngày không vượt số ngày tối đa của tháng (tháng 2 cho phép 29); có năm cụ thể
 *   thì 29/2 chỉ hợp lệ ở năm nhuận.
 * - Âm lịch: tháng có 29 hoặc 30 ngày nên chỉ giới hạn <= 30.
 */
export function validateEventDate(date: {
  calendarType: CalendarType;
  day: number;
  month: number;
  year: number | null;
}): EventDateError | null {
  const { calendarType, day, month, year } = date;
  if (!Number.isInteger(day) || !Number.isInteger(month)) return "invalid";
  if (month < 1 || month > 12 || day < 1 || day > 31) return "invalid";

  if (calendarType === "lunar") return day <= 30 ? null : "invalid";

  if (day > maxDayInMonthIgnoringYear(month)) return "invalid";
  if (year !== null && month === 2 && day === 29 && !isLeapYear(year)) return "feb29NotLeap";
  return null;
}
