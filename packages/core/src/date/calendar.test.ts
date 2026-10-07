import { describe, expect, it } from "vitest";
import {
  addMonths,
  getMonthGrid,
  getUpcomingOccurrences,
  groupOccurrencesByDate,
} from "./calendar";
import type { EventDate } from "./occurrence";
import { daysInMonth, plainDateToUtcDate, toIsoDate, type PlainDate } from "./plain-date";

const d = (year: number, month: number, day: number): PlainDate => ({ year, month, day });

const solar = (day: number, month: number, year: number | null = null): EventDate => ({
  calendarType: "solar",
  day,
  month,
  year,
  isLeapMonth: false,
});

const TODAY = d(2026, 10, 6);

describe("addMonths", () => {
  it("cộng và trừ tháng trong cùng năm", () => {
    expect(addMonths({ year: 2026, month: 10 }, 1)).toEqual({ year: 2026, month: 11 });
    expect(addMonths({ year: 2026, month: 10 }, -3)).toEqual({ year: 2026, month: 7 });
  });

  it("chuyển năm ở cả hai chiều", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("nhiều năm một lúc và delta 0", () => {
    expect(addMonths({ year: 2026, month: 10 }, 25)).toEqual({ year: 2028, month: 11 });
    expect(addMonths({ year: 2026, month: 10 }, -13)).toEqual({ year: 2025, month: 9 });
    expect(addMonths({ year: 2026, month: 10 }, 0)).toEqual({ year: 2026, month: 10 });
  });
});

describe("getMonthGrid", () => {
  it("tháng 10/2026 bắt đầu thứ Hai: 5 tuần từ 28/9 đến 1/11", () => {
    const grid = getMonthGrid(2026, 10, 1);
    expect(grid).toHaveLength(5);
    expect(grid[0]?.[0]).toEqual(d(2026, 9, 28));
    expect(grid[4]?.[6]).toEqual(d(2026, 11, 1));
  });

  it("tháng 10/2026 bắt đầu Chủ nhật: 5 tuần từ 27/9 đến 31/10", () => {
    const grid = getMonthGrid(2026, 10, 0);
    expect(grid).toHaveLength(5);
    expect(grid[0]?.[0]).toEqual(d(2026, 9, 27));
    expect(grid[4]?.[6]).toEqual(d(2026, 10, 31));
  });

  it("tháng 2/2026 vừa đủ 4 tuần khi bắt đầu Chủ nhật", () => {
    const grid = getMonthGrid(2026, 2, 0);
    expect(grid).toHaveLength(4);
    expect(grid[0]?.[0]).toEqual(d(2026, 2, 1));
    expect(grid[3]?.[6]).toEqual(d(2026, 2, 28));
  });

  it("tháng 3/2026 cần 6 tuần khi bắt đầu thứ Hai", () => {
    const grid = getMonthGrid(2026, 3, 1);
    expect(grid).toHaveLength(6);
    expect(grid[0]?.[0]).toEqual(d(2026, 2, 23));
    expect(grid[5]?.[6]).toEqual(d(2026, 4, 5));
  });

  it("tháng 2/2028 (nhuận) có ô 29/2", () => {
    const flat = getMonthGrid(2028, 2, 1).flat();
    expect(flat).toContainEqual(d(2028, 2, 29));
  });

  it("mọi tháng 2024-2030: tuần đủ 7 ngày, liên tiếp, đúng cột đầu, mỗi ngày của tháng đúng một lần", () => {
    for (let year = 2024; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        for (const weekStartsOn of [0, 1] as const) {
          const grid = getMonthGrid(year, month, weekStartsOn);
          const label = `${year}-${month} (tuần bắt đầu ${weekStartsOn})`;
          expect(grid.length, label).toBeGreaterThanOrEqual(4);
          expect(grid.length, label).toBeLessThanOrEqual(6);
          for (const week of grid) expect(week, label).toHaveLength(7);

          const flat = grid.flat();
          const first = flat[0];
          if (!first) throw new Error("lưới rỗng");
          expect(plainDateToUtcDate(first).getUTCDay(), label).toBe(weekStartsOn);

          // Các ô liên tiếp nhau đúng 1 ngày
          for (let i = 1; i < flat.length; i++) {
            const prev = flat[i - 1];
            const cur = flat[i];
            if (!prev || !cur) throw new Error("ô rỗng");
            const gap =
              (plainDateToUtcDate(cur).getTime() - plainDateToUtcDate(prev).getTime()) / 86_400_000;
            expect(gap, label).toBe(1);
          }

          const inMonth = flat.filter((cell) => cell.month === month && cell.year === year);
          expect(inMonth, label).toHaveLength(daysInMonth(year, month));
        }
      }
    }
  });
});

describe("getUpcomingOccurrences", () => {
  const events = [
    { ...solar(1, 3), title: "đã qua trong năm" },
    { ...solar(12, 10, 1990), title: "sinh nhật" },
    { ...solar(6, 10), title: "hôm nay" },
    { ...solar(15, 10, 2030), title: "năm gốc ở tương lai" },
    { ...solar(12, 10), title: "cùng ngày, đứng sau" },
  ];

  it("sắp theo thời gian, cùng ngày giữ thứ tự ban đầu, tính cả hôm nay", () => {
    const { items } = getUpcomingOccurrences(events, TODAY);
    expect(items.map((item) => item.event.title)).toEqual([
      "hôm nay",
      "sinh nhật",
      "cùng ngày, đứng sau",
      "đã qua trong năm",
      "năm gốc ở tương lai",
    ]);
  });

  it("tính đúng ngày, số ngày còn lại và số năm", () => {
    const { items } = getUpcomingOccurrences(events, TODAY);
    const byTitle = new Map(items.map((item) => [item.event.title, item]));

    expect(byTitle.get("hôm nay")).toMatchObject({
      date: d(2026, 10, 6),
      daysUntil: 0,
      years: null,
    });
    expect(byTitle.get("sinh nhật")).toMatchObject({
      date: d(2026, 10, 12),
      daysUntil: 6,
      years: 36,
    });
    expect(byTitle.get("đã qua trong năm")).toMatchObject({ date: d(2027, 3, 1), daysUntil: 146 });
    // Năm gốc ở tương lai: lần đầu tiên chính là năm gốc, số năm = 0
    expect(byTitle.get("năm gốc ở tương lai")).toMatchObject({ date: d(2030, 10, 15), years: 0 });
  });

  it("limit cắt bớt danh sách, withinDays chỉ lấy trong N ngày", () => {
    expect(getUpcomingOccurrences(events, TODAY, { limit: 2 }).items).toHaveLength(2);
    const within = getUpcomingOccurrences(events, TODAY, { withinDays: 6 });
    expect(within.items.map((item) => item.event.title)).toEqual([
      "hôm nay",
      "sinh nhật",
      "cùng ngày, đứng sau",
    ]);
    // Ngày thứ N được tính
    expect(getUpcomingOccurrences(events, TODAY, { withinDays: 5 }).items).toHaveLength(1);
  });

  it("sự kiện âm lịch chưa quy đổi được nằm ở unresolved, không làm mất sự kiện khác", () => {
    const lunar: EventDate = {
      calendarType: "lunar",
      day: 15,
      month: 8,
      year: null,
      isLeapMonth: false,
    };
    const result = getUpcomingOccurrences([solar(7, 10), lunar], TODAY);
    expect(result.items).toHaveLength(1);
    expect(result.unresolved).toEqual([lunar]);
  });

  it("29/2 dời về 28/2 ở năm không nhuận (theo policy)", () => {
    const { items } = getUpcomingOccurrences([solar(29, 2)], TODAY);
    expect(items[0]?.date).toEqual(d(2027, 2, 28));
    const mar1 = getUpcomingOccurrences([solar(29, 2)], TODAY, { feb29Policy: "mar1" });
    expect(mar1.items[0]?.date).toEqual(d(2027, 3, 1));
  });

  it("danh sách rỗng", () => {
    expect(getUpcomingOccurrences([], TODAY)).toEqual({ items: [], unresolved: [] });
  });
});

describe("groupOccurrencesByDate", () => {
  const a = { ...solar(10, 10, 2000), title: "A" };
  const b = { ...solar(10, 10), title: "B" };
  const c = { ...solar(31, 10), title: "C" };
  const outside = { ...solar(1, 11), title: "ngoài tháng" };

  it("gom theo ngày, kèm số năm, bỏ sự kiện ngoài khoảng", () => {
    const groups = groupOccurrencesByDate([a, b, c, outside], d(2026, 10, 1), d(2026, 10, 31));
    expect([...groups.keys()].sort()).toEqual(["2026-10-10", "2026-10-31"]);

    const tenth = groups.get("2026-10-10") ?? [];
    expect(tenth.map((o) => [o.event.title, o.years])).toEqual([
      ["A", 26],
      ["B", null],
    ]);
  });

  it("ngày không có sự kiện thì không có khóa", () => {
    const groups = groupOccurrencesByDate([a], d(2026, 10, 1), d(2026, 10, 31));
    expect(groups.has("2026-10-11")).toBe(false);
  });

  it("29/2 hiện ở 28/2 trong năm không nhuận và 29/2 trong năm nhuận", () => {
    const leapDay = solar(29, 2);
    expect([...groupOccurrencesByDate([leapDay], d(2027, 2, 1), d(2027, 2, 28)).keys()]).toEqual([
      "2027-02-28",
    ]);
    expect([...groupOccurrencesByDate([leapDay], d(2028, 2, 1), d(2028, 2, 29)).keys()]).toEqual([
      "2028-02-29",
    ]);
  });

  it("khóa là YYYY-MM-DD khớp toIsoDate", () => {
    const groups = groupOccurrencesByDate([c], d(2026, 10, 1), d(2026, 10, 31));
    expect(groups.get(toIsoDate(d(2026, 10, 31)))).toHaveLength(1);
  });
});
