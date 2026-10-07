import { lunarToSolar } from "./lunar";
import { addDays, comparePlainDates, daysInMonth, diffInDays, type PlainDate } from "./plain-date";

export type CalendarType = "solar" | "lunar";

/** Phần của sự kiện cần để tính ngày xuất hiện (không phụ thuộc cách lưu ở DB hay UI). */
export interface EventDate {
  calendarType: CalendarType;
  day: number;
  month: number;
  /** Năm gốc (vd năm sinh). null = không rõ năm: lặp mỗi năm, không tính tuổi/số năm. */
  year: number | null;
  /** Chỉ có ý nghĩa với âm lịch. */
  isLeapMonth: boolean;
}

/**
 * Ngày 29/2 ở năm không nhuận:
 * - "feb28": dời về 28/2 (mặc định, khớp hàm SQL occurrence_in_year)
 * - "mar1": dời sang 1/3
 * Ngày vượt quá số ngày của tháng nói chung thì dời về cuối tháng.
 */
export type Feb29Policy = "feb28" | "mar1";

export interface OccurrenceOptions {
  feb29Policy?: Feb29Policy;
}

/** Ngày dương lịch (day, month) rơi vào một năm cụ thể, xử lý 29/2 ở năm không nhuận. */
export function solarDateInYear(
  day: number,
  month: number,
  year: number,
  options: OccurrenceOptions = {},
): PlainDate {
  const last = daysInMonth(year, month);
  if (day <= last) return { year, month, day };
  if (options.feb29Policy === "mar1" && month === 2) return { year, month: 3, day: 1 };
  return { year, month, day: last };
}

/**
 * Lần xuất hiện của sự kiện trong năm `year`. Trả về null nếu:
 * - năm này nằm trước năm gốc của sự kiện (chưa xảy ra lần đầu), hoặc
 * - sự kiện âm lịch mà chưa có bộ quy đổi / ngày âm lịch không tồn tại.
 * Với âm lịch, `year` là năm âm lịch.
 */
export function occurrenceInYear(
  event: EventDate,
  year: number,
  options: OccurrenceOptions = {},
): PlainDate | null {
  if (event.year !== null && year < event.year) return null;
  if (event.calendarType === "solar") {
    return solarDateInYear(event.day, event.month, year, options);
  }
  return lunarToSolar({
    year,
    month: event.month,
    day: event.day,
    isLeapMonth: event.isLeapMonth,
  });
}

/**
 * Lần xuất hiện kế tiếp (tính cả hôm nay). Phải khớp hàm SQL compute_next_occurrence:
 * - không có năm, hoặc năm đã qua: lặp mỗi năm, lấy lần gần nhất >= today
 * - năm ở tương lai: chính ngày đó là lần kế tiếp
 * Trả về null với sự kiện âm lịch khi chưa quy đổi được.
 */
export function getNextOccurrence(
  event: EventDate,
  today: PlainDate,
  options: OccurrenceOptions = {},
): PlainDate | null {
  if (event.calendarType === "lunar") return nextLunarOccurrence(event, today, options);

  const startYear = Math.max(today.year, event.year ?? today.year);
  const candidate = solarDateInYear(event.day, event.month, startYear, options);
  if (comparePlainDates(candidate, today) >= 0) return candidate;
  return solarDateInYear(event.day, event.month, startYear + 1, options);
}

function nextLunarOccurrence(
  event: EventDate,
  today: PlainDate,
  options: OccurrenceOptions,
): PlainDate | null {
  // Tết âm có thể rơi sang năm dương kế tiếp, nên xét 3 năm âm lịch liên tiếp, bắt đầu từ năm
  // trước. Nếu năm gốc nằm ở tương lai thì bắt đầu từ năm gốc (giống dương lịch: lần kế tiếp
  // chính là năm gốc), nếu không cả 3 năm đều nằm trước năm gốc và kết quả sai thành null.
  const firstYear = Math.max(today.year - 1, event.year ?? today.year - 1);
  let best: PlainDate | null = null;
  for (let year = firstYear; year <= firstYear + 2; year++) {
    const date = occurrenceInYear(event, year, options);
    if (!date || comparePlainDates(date, today) < 0) continue;
    if (!best || comparePlainDates(date, best) < 0) best = date;
  }
  return best;
}

/**
 * Các lần xuất hiện nằm trong [from, to] (gồm cả hai đầu), theo thứ tự thời gian.
 * Dùng cho lịch tháng: truyền ngày đầu và ngày cuối của tháng đang xem.
 */
export function listOccurrencesInRange(
  event: EventDate,
  from: PlainDate,
  to: PlainDate,
  options: OccurrenceOptions = {},
): PlainDate[] {
  if (comparePlainDates(from, to) > 0) return [];
  const results: PlainDate[] = [];
  // Mở rộng 1 năm mỗi phía cho âm lịch (Tết âm lệch năm dương)
  const margin = event.calendarType === "lunar" ? 1 : 0;
  for (let year = from.year - margin; year <= to.year + margin; year++) {
    const date = occurrenceInYear(event, year, options);
    if (!date) continue;
    if (comparePlainDates(date, from) >= 0 && comparePlainDates(date, to) <= 0) {
      results.push(date);
    }
  }
  return results.sort(comparePlainDates);
}

/** Số ngày còn lại từ hôm nay đến `date` (0 = hôm nay, âm = đã qua). */
export function daysUntil(date: PlainDate, today: PlainDate): number {
  return diffInDays(today, date);
}

/**
 * Số năm (tuổi / năm kỷ niệm) tại một lần xuất hiện. null nếu sự kiện không có năm gốc
 * hoặc lần xuất hiện nằm trước năm gốc. Với âm lịch, `occurrence` là ngày dương đã quy đổi
 * nên số năm lấy theo `lunarYear` nếu có.
 */
export function getYearsSince(
  event: Pick<EventDate, "year">,
  occurrence: PlainDate,
  lunarYear?: number,
): number | null {
  if (event.year === null) return null;
  const years = (lunarYear ?? occurrence.year) - event.year;
  return years >= 0 ? years : null;
}

/** Ngày nhắc: `daysBefore` ngày trước lần xuất hiện. Dùng cho Phase 5 (Edge Function nhắc nhở). */
export function getReminderDate(occurrence: PlainDate, daysBefore: number): PlainDate {
  return addDays(occurrence, -daysBefore);
}
