import type { CalendarType } from "./date/occurrence";
import type { Language } from "./i18n";
import type { ThemePreference } from "./theme";

/**
 * Kiểu dữ liệu dùng trong UI (camelCase). Lớp truy cập dữ liệu chuyển đổi từ dòng DB (snake_case)
 * sang các kiểu này nên component không phải biết tên cột.
 */

export interface Category {
  id: string;
  /** null với danh mục mặc định chưa đổi tên: hiển thị bằng getCategoryName(). */
  name: string | null;
  /** Khóa danh mục mặc định ("birthday", ...), null với danh mục tự tạo. */
  defaultKey: string | null;
  /** Khóa trong bảng màu eventColors, vd "rose". */
  color: string;
  /** Tên icon Lucide, vd "cake". */
  icon: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  categoryId: string | null;
  title: string;
  note: string | null;
  calendarType: CalendarType;
  day: number;
  month: number;
  /** null = không rõ năm. */
  year: number | null;
  isLeapMonth: boolean;
  /** null = dùng màu của danh mục (xem resolveEventAppearance). */
  color: string | null;
  icon: string | null;
  remindDaysBefore: number[];
  /** Ngày dạng "YYYY-MM-DD" do DB tính cho dương lịch; có thể null với âm lịch. */
  nextOccurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  displayName: string | null;
  language: Language;
  theme: ThemePreference;
  timezone: string;
}
