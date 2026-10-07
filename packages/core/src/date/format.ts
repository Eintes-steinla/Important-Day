import { intlLocale, type Language } from "../i18n";
import { plainDateToUtcDate, type PlainDate } from "./plain-date";

/** Hàm dịch tối thiểu (khớp `t` của i18next) để core không phụ thuộc vào kiểu của i18next. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Ngày đầy đủ theo locale, vd "6 tháng 10, 2026" / "October 6, 2026". */
export function formatPlainDate(
  date: PlainDate,
  language: Language,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
): string {
  return new Intl.DateTimeFormat(intlLocale(language), { ...options, timeZone: "UTC" }).format(
    plainDateToUtcDate(date),
  );
}

/** Ngày và tháng (cho sự kiện không rõ năm), vd "29 tháng 2" / "February 29". */
export function formatDayMonth(day: number, month: number, language: Language): string {
  // Năm 2000 là năm nhuận nên 29/2 format được
  return formatPlainDate({ year: 2000, month, day }, language, { month: "long", day: "numeric" });
}

/** Tiêu đề lịch tháng, vd "Tháng 10 năm 2026" / "October 2026". */
export function formatMonthYear(year: number, month: number, language: Language): string {
  return formatPlainDate({ year, month, day: 1 }, language, { month: "long", year: "numeric" });
}

/**
 * Nhãn các thứ trong tuần cho lưới lịch.
 * @param weekStartsOn 0 = Chủ nhật, 1 = Thứ hai (mặc định)
 */
export function getWeekdayLabels(
  language: Language,
  weekStartsOn: 0 | 1 = 1,
  width: "short" | "narrow" = "short",
): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(language), {
    weekday: width,
    timeZone: "UTC",
  });
  // 2023-01-01 là Chủ nhật
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(
      plainDateToUtcDate({ year: 2023, month: 1, day: 1 + ((index + weekStartsOn) % 7) }),
    ),
  );
}

/**
 * Nhãn đếm ngược: "Hôm nay", "Ngày mai", "còn 12 ngày" / "12 days left".
 * Số nhiều xử lý bởi i18next (tiếng Việt không chia số nhiều).
 */
export function getCountdownLabel(days: number, t: Translate): string {
  if (days < 0) return t("events.passed");
  if (days === 0) return t("events.today");
  if (days === 1) return t("events.tomorrow");
  return t("events.countdown", { count: days });
}

/** Số năm kỷ niệm / tuổi, vd "5 năm" / "5 years". */
export function getYearsLabel(years: number, t: Translate): string {
  return t("events.yearsSince", { count: years });
}
