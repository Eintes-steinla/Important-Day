/**
 * Ngày thuần (không giờ, không múi giờ). Toàn bộ logic ngày dùng kiểu này thay vì `Date`
 * để tránh lỗi lệch ngày do múi giờ. Phép tính ngày đều qua Date.UTC nên không phụ thuộc
 * múi giờ của máy.
 */
export interface PlainDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Số ngày của tháng (month 1-12) trong một năm dương lịch cụ thể. */
export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

/** Ngày tối đa của tháng khi không biết năm: tháng 2 cho phép 29. Khớp ràng buộc ở DB. */
export function maxDayInMonthIgnoringYear(month: number): number {
  return month === 2 ? 29 : daysInMonth(2001, month);
}

/** So sánh hai ngày: số âm nếu a < b, 0 nếu bằng nhau, số dương nếu a > b. */
export function comparePlainDates(a: PlainDate, b: PlainDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function isSamePlainDate(a: PlainDate, b: PlainDate): boolean {
  return comparePlainDates(a, b) === 0;
}

const MS_PER_DAY = 86_400_000;

/** Date tại 00:00 UTC của ngày đó (dùng để format với timeZone "UTC", không lệch ngày). */
export function plainDateToUtcDate(date: PlainDate): Date {
  // Date.UTC coi năm 0-99 là 1900-1999, nên dùng setUTCFullYear để giữ đúng năm
  const d = new Date(0);
  d.setUTCFullYear(date.year, date.month - 1, date.day);
  return d;
}

function toUtcMs(date: PlainDate): number {
  return plainDateToUtcDate(date).getTime();
}

/** Số ngày từ `from` đến `to` (âm nếu `to` ở trước). */
export function diffInDays(from: PlainDate, to: PlainDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function addDays(date: PlainDate, days: number): PlainDate {
  const d = new Date(toUtcMs(date) + days * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-02-09" -> PlainDate. Trả về null nếu sai định dạng hoặc ngày không tồn tại. */
export function parseIsoDate(value: string): PlainDate | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function toIsoDate(date: PlainDate): string {
  const yyyy = String(date.year).padStart(4, "0");
  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
