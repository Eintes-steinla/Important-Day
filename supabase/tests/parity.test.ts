import type { PGlite } from "@electric-sql/pglite";
import {
  DEFAULT_CATEGORIES,
  getNextOccurrence,
  maxDayInMonthIgnoringYear,
  parseIsoDate,
  toIsoDate,
  type PlainDate,
} from "@important-dates/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asAdmin, createDb, createUser } from "./support/db";

/**
 * Đối chiếu logic ở hai nơi phải luôn khớp nhau:
 * - hàm SQL compute_next_occurrence (trigger tính next_occurrence) và getNextOccurrence ở core
 * - hàm SQL seed_default_categories và hằng số DEFAULT_CATEGORIES ở core
 */

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
});

afterAll(async () => {
  await db.close();
});

// Các ngày "hôm nay" quanh biên năm nhuận, chuyển năm, đầu/cuối tháng 2
const TODAYS = [
  "2023-02-28",
  "2023-03-01",
  "2024-01-01",
  "2024-02-28",
  "2024-02-29",
  "2024-03-01",
  "2024-12-31",
  "2025-01-01",
  "2025-03-01",
  "2026-01-01",
  "2026-06-15",
  "2026-10-06",
  "2026-12-31",
  "2027-01-01",
  "2027-02-28",
  "2027-03-01",
  "2028-01-10",
  "2028-02-28",
  "2028-02-29",
  "2028-03-01",
  "2100-02-28",
  "2100-03-01",
];

// null = không rõ năm; còn lại gồm năm quá khứ, năm nhuận, năm hiện tại và tương lai
const YEARS: Array<number | null> = [null, 1990, 2024, 2026, 2028, 2030];

describe("compute_next_occurrence (SQL) khớp getNextOccurrence (TypeScript)", () => {
  it("giống nhau trên toàn bộ lưới (ngày, tháng) x năm gốc x hôm nay", async () => {
    await asAdmin(db);
    const yearValues = YEARS.map((y) => (y === null ? "(null::int)" : `(${y})`)).join(", ");
    const todayValues = TODAYS.map((t) => `'${t}'::date`).join(", ");

    const result = await db.query<{
      day: number;
      month: number;
      year: number | null;
      today: string;
      next: string;
    }>(`
      select d.day, d.month, y.year, t.today::text as today,
             public.compute_next_occurrence(d.day, d.month, y.year, t.today)::text as next
      from (
        select m.month::int as month, dd.day::int as day
        from generate_series(1, 12) m(month), generate_series(1, 31) dd(day)
        where dd.day <= case m.month when 2 then 29 when 4 then 30 when 6 then 30
                                      when 9 then 30 when 11 then 30 else 31 end
      ) d
      cross join (values ${yearValues}) y(year)
      cross join unnest(array[${todayValues}]) t(today)
    `);

    // 366 cặp (ngày, tháng) x 6 năm gốc x 22 ngày hôm nay
    expect(result.rows).toHaveLength(366 * YEARS.length * TODAYS.length);

    const mismatches: string[] = [];
    for (const row of result.rows) {
      const today = parseIsoDate(row.today);
      if (!today) throw new Error(`Ngày không hợp lệ: ${row.today}`);
      const expected = getNextOccurrence(
        {
          calendarType: "solar",
          day: row.day,
          month: row.month,
          year: row.year,
          isLeapMonth: false,
        },
        today,
      );
      const actual = expected ? toIsoDate(expected) : null;
      if (actual !== row.next) {
        mismatches.push(
          `day=${row.day} month=${row.month} year=${row.year} today=${row.today}: SQL=${row.next} TS=${actual}`,
        );
      }
    }
    expect(mismatches.slice(0, 10)).toEqual([]);
  });

  it("lưới kiểm tra có đủ các ca biên cần thiết", () => {
    const feb29 = maxDayInMonthIgnoringYear(2);
    expect(feb29).toBe(29);
    const sample: PlainDate = { year: 2028, month: 2, day: 29 };
    expect(TODAYS).toContain(toIsoDate(sample));
  });
});

describe("danh mục mặc định: SQL khớp hằng số ở core", () => {
  it("seed_default_categories tạo đúng khóa, màu, icon như DEFAULT_CATEGORIES", async () => {
    const userId = await createUser(db);
    await asAdmin(db);
    const result = await db.query<{
      default_key: string;
      color: string;
      icon: string;
      name: string | null;
    }>(
      "select default_key, color, icon, name from public.categories where user_id = $1 order by default_key",
      [userId],
    );
    const expected = [...DEFAULT_CATEGORIES]
      .map((c) => ({ default_key: c.key, color: c.color, icon: c.icon, name: null }))
      .sort((a, b) => a.default_key.localeCompare(b.default_key));
    expect(result.rows).toEqual(expected);
  });
});
