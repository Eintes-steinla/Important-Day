import {
  getNextOccurrence,
  getYearsSince,
  listOccurrencesInRange,
  type EventDate,
  type OccurrenceOptions,
} from "./occurrence";
import {
  addDays,
  comparePlainDates,
  daysInMonth,
  diffInDays,
  plainDateToUtcDate,
  toIsoDate,
  type PlainDate,
} from "./plain-date";

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

/** Cộng/trừ tháng, tự xử lý chuyển năm (12 -> 1). */
export function addMonths(value: YearMonth, delta: number): YearMonth {
  const index = value.year * 12 + (value.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

/**
 * Lưới lịch tháng: mỗi phần tử là một tuần gồm 7 ngày, gồm cả các ngày của tháng trước/sau để
 * lấp đầy tuần đầu và tuần cuối (UI so sánh `date.month` với tháng đang xem để làm mờ).
 * Số tuần là 4 đến 6 tùy tháng.
 * @param weekStartsOn 0 = Chủ nhật, 1 = Thứ hai
 */
export function getMonthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): PlainDate[][] {
  const first: PlainDate = { year, month, day: 1 };
  const weekday = plainDateToUtcDate(first).getUTCDay(); // 0 = Chủ nhật
  const leading = (weekday - weekStartsOn + 7) % 7;
  const weekCount = Math.ceil((leading + daysInMonth(year, month)) / 7);
  const start = addDays(first, -leading);
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

/** Một lần xuất hiện của sự kiện tại một ngày cụ thể. */
export interface DatedOccurrence<T extends EventDate = EventDate> {
  event: T;
  date: PlainDate;
  /** Số năm (tuổi / năm kỷ niệm) tại lần xuất hiện này; null nếu sự kiện không có năm gốc. */
  years: number | null;
}

export interface UpcomingOccurrence<T extends EventDate = EventDate> extends DatedOccurrence<T> {
  /** 0 = hôm nay. */
  daysUntil: number;
}

export interface UpcomingOptions extends OccurrenceOptions {
  /** Số lần xuất hiện tối đa trả về. */
  limit?: number;
  /** Chỉ lấy các lần xuất hiện trong vòng N ngày kể từ hôm nay (gồm cả ngày thứ N). */
  withinDays?: number;
}

/**
 * Các sự kiện sắp tới theo thứ tự thời gian, mỗi sự kiện một lần (lần kế tiếp, tính cả hôm nay).
 * Tính từ ngày/tháng/năm của sự kiện chứ không đọc cột `next_occurrence` ở DB, nên luôn đúng
 * dù cột đó đã cũ. `unresolved` là các sự kiện chưa tính được ngày (âm lịch chưa có bộ quy đổi).
 */
export function getUpcomingOccurrences<T extends EventDate>(
  events: readonly T[],
  today: PlainDate,
  options: UpcomingOptions = {},
): { items: UpcomingOccurrence<T>[]; unresolved: T[] } {
  const items: UpcomingOccurrence<T>[] = [];
  const unresolved: T[] = [];

  for (const event of events) {
    const date = getNextOccurrence(event, today, options);
    if (!date) {
      unresolved.push(event);
      continue;
    }
    const daysUntil = diffInDays(today, date);
    if (options.withinDays !== undefined && daysUntil > options.withinDays) continue;
    items.push({ event, date, daysUntil, years: getYearsSince(event, date) });
  }

  // Array.prototype.sort ổn định: cùng ngày thì giữ thứ tự ban đầu của danh sách sự kiện
  items.sort((a, b) => comparePlainDates(a.date, b.date));
  return {
    items: options.limit === undefined ? items : items.slice(0, options.limit),
    unresolved,
  };
}

/**
 * Gom các lần xuất hiện trong [from, to] theo ngày (khóa "YYYY-MM-DD") cho lịch tháng.
 * Ngày không có sự kiện thì không có khóa.
 */
export function groupOccurrencesByDate<T extends EventDate>(
  events: readonly T[],
  from: PlainDate,
  to: PlainDate,
  options: OccurrenceOptions = {},
): Map<string, DatedOccurrence<T>[]> {
  const groups = new Map<string, DatedOccurrence<T>[]>();
  for (const event of events) {
    for (const date of listOccurrencesInRange(event, from, to, options)) {
      const key = toIsoDate(date);
      const list = groups.get(key) ?? [];
      list.push({ event, date, years: getYearsSince(event, date) });
      groups.set(key, list);
    }
  }
  return groups;
}
