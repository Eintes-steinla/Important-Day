import type { PlainDate } from "./plain-date";

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Múi giờ IANA của thiết bị/trình duyệt (vd "Asia/Ho_Chi_Minh"). Lỗi thì dùng "UTC". */
export function detectTimeZone(): string {
  try {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * "Hôm nay" theo một múi giờ. Phải dùng múi giờ trong profiles.timezone để khớp với cách
 * trigger ở DB tính next_occurrence. Múi giờ không hợp lệ thì dùng UTC (giống DB).
 */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): PlainDate {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}
