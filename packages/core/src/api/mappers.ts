import type { Tables, TablesInsert, TablesUpdate } from "../database.types";
import type { CalendarType } from "../date/occurrence";
import { toIsoDate, type PlainDate } from "../date/plain-date";
import { resolveLanguage } from "../i18n";
import type { Category, EventItem, Profile } from "../models";
import type { CategoryInput, EventInput, ProfileUpdateInput } from "../schemas";
import { isThemePreference } from "../theme";

function toCalendarType(value: string): CalendarType {
  return value === "lunar" ? "lunar" : "solar";
}

export function mapEventRow(row: Tables<"events">): EventItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    note: row.note,
    calendarType: toCalendarType(row.calendar_type),
    day: row.day,
    month: row.month,
    year: row.year,
    isLeapMonth: row.is_leap_month,
    color: row.color,
    icon: row.icon,
    remindDaysBefore: row.remind_days_before,
    nextOccurrence: row.next_occurrence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategoryRow(row: Tables<"categories">): Category {
  return {
    id: row.id,
    name: row.name,
    defaultKey: row.default_key,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

export function mapProfileRow(row: Tables<"profiles">): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    language: resolveLanguage(row.language),
    theme: isThemePreference(row.theme) ? row.theme : "system",
    timezone: row.timezone,
  };
}

/** Thông tin bổ sung khi ghi sự kiện. */
export interface EventWriteExtras {
  /**
   * Lần xuất hiện kế tiếp của sự kiện ÂM LỊCH đã quy đổi sang dương lịch (Phase 5).
   * Sự kiện dương lịch bỏ qua giá trị này vì trigger ở DB tự tính. Không truyền thì
   * sự kiện âm lịch được đặt next_occurrence = null (chưa biết) thay vì giữ giá trị cũ.
   */
  lunarNextOccurrence?: PlainDate | null;
}

/** Dữ liệu ghi xuống DB. Không có user_id: DB tự điền auth.uid(). */
export function eventInputToRow(
  input: EventInput,
  extras: EventWriteExtras = {},
): Omit<TablesInsert<"events">, "user_id"> {
  const row: Omit<TablesInsert<"events">, "user_id"> = {
    title: input.title,
    note: input.note,
    calendar_type: input.calendarType,
    day: input.day,
    month: input.month,
    year: input.year,
    is_leap_month: input.isLeapMonth,
    category_id: input.categoryId,
    color: input.color,
    icon: input.icon,
    remind_days_before: input.remindDaysBefore,
  };
  if (input.calendarType === "lunar") {
    row.next_occurrence = extras.lunarNextOccurrence ? toIsoDate(extras.lunarNextOccurrence) : null;
  }
  return row;
}

export function categoryInputToRow(
  input: CategoryInput,
): Pick<TablesInsert<"categories">, "name" | "color" | "icon"> {
  return { name: input.name, color: input.color, icon: input.icon };
}

/** Chỉ đưa vào các trường có trong patch để không ghi đè trường khác. */
export function profilePatchToRow(patch: ProfileUpdateInput): TablesUpdate<"profiles"> {
  const row: TablesUpdate<"profiles"> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.language !== undefined) row.language = patch.language;
  if (patch.theme !== undefined) row.theme = patch.theme;
  if (patch.timezone !== undefined) row.timezone = patch.timezone;
  return row;
}
