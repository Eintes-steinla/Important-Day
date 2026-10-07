import type { PlainDate } from "./plain-date";

/** Ngày âm lịch. `year` là năm âm lịch (cùng số với năm dương lịch chứa Tết). */
export interface LunarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-30
  isLeapMonth: boolean;
}

/**
 * Chỗ cắm cho việc quy đổi âm lịch. MVP chưa có bộ quy đổi thật (làm ở Phase 5): app chỉ lưu
 * `calendar_type`. Khi có thư viện/bảng quy đổi, gọi `setLunarConverter` một lần lúc khởi động.
 */
export interface LunarConverter {
  /** Trả về null nếu ngày âm lịch đó không tồn tại (vd tháng nhuận không có ở năm đó). */
  lunarToSolar(lunar: LunarDate): PlainDate | null;
}

let converter: LunarConverter | null = null;

export function setLunarConverter(next: LunarConverter | null): void {
  converter = next;
}

export function hasLunarConverter(): boolean {
  return converter !== null;
}

/** Quy đổi âm -> dương. Chưa có bộ quy đổi thì trả về null (không đoán ngày). */
export function lunarToSolar(lunar: LunarDate): PlainDate | null {
  return converter ? converter.lunarToSolar(lunar) : null;
}
