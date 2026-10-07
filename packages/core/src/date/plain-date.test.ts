import { describe, expect, it } from "vitest";
import {
  addDays,
  comparePlainDates,
  daysInMonth,
  diffInDays,
  isLeapYear,
  maxDayInMonthIgnoringYear,
  parseIsoDate,
  toIsoDate,
  type PlainDate,
} from "./plain-date";

const d = (year: number, month: number, day: number): PlainDate => ({ year, month, day });

describe("isLeapYear", () => {
  it.each([
    [2024, true],
    [2028, true],
    [2000, true],
    [2023, false],
    [2026, false],
    [1900, false],
    [2100, false],
  ])("năm %i nhuận = %s", (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });
});

describe("daysInMonth", () => {
  it("tháng 2 theo năm nhuận", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it("tháng 30 và 31 ngày", () => {
    for (const month of [4, 6, 9, 11]) expect(daysInMonth(2026, month)).toBe(30);
    for (const month of [1, 3, 5, 7, 8, 10, 12]) expect(daysInMonth(2026, month)).toBe(31);
  });

  it("maxDayInMonthIgnoringYear cho tháng 2 là 29", () => {
    expect(maxDayInMonthIgnoringYear(2)).toBe(29);
    expect(maxDayInMonthIgnoringYear(4)).toBe(30);
    expect(maxDayInMonthIgnoringYear(12)).toBe(31);
  });
});

describe("comparePlainDates", () => {
  it("so sánh theo năm, tháng, ngày", () => {
    expect(comparePlainDates(d(2026, 1, 1), d(2026, 1, 2))).toBeLessThan(0);
    expect(comparePlainDates(d(2026, 2, 1), d(2026, 1, 31))).toBeGreaterThan(0);
    expect(comparePlainDates(d(2027, 1, 1), d(2026, 12, 31))).toBeGreaterThan(0);
    expect(comparePlainDates(d(2026, 5, 5), d(2026, 5, 5))).toBe(0);
  });
});

describe("diffInDays và addDays", () => {
  it("qua tháng 2 năm nhuận và không nhuận", () => {
    expect(diffInDays(d(2024, 2, 28), d(2024, 3, 1))).toBe(2);
    expect(diffInDays(d(2023, 2, 28), d(2023, 3, 1))).toBe(1);
  });

  it("chuyển năm 31/12 -> 1/1", () => {
    expect(diffInDays(d(2026, 12, 31), d(2027, 1, 1))).toBe(1);
  });

  it("trả về số âm khi đích ở trước", () => {
    expect(diffInDays(d(2026, 10, 6), d(2026, 10, 1))).toBe(-5);
    expect(diffInDays(d(2026, 10, 6), d(2026, 10, 6))).toBe(0);
  });

  it("nguyên một năm: 365 và 366 ngày", () => {
    expect(diffInDays(d(2026, 1, 1), d(2027, 1, 1))).toBe(365);
    expect(diffInDays(d(2028, 1, 1), d(2029, 1, 1))).toBe(366);
  });

  it("addDays qua 29/2 và qua năm", () => {
    expect(addDays(d(2024, 2, 28), 1)).toEqual(d(2024, 2, 29));
    expect(addDays(d(2023, 2, 28), 1)).toEqual(d(2023, 3, 1));
    expect(addDays(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
    expect(addDays(d(2027, 1, 1), -1)).toEqual(d(2026, 12, 31));
    expect(addDays(d(2026, 10, 6), 0)).toEqual(d(2026, 10, 6));
  });
});

describe("parseIsoDate và toIsoDate", () => {
  it("chuyển qua lại không đổi", () => {
    expect(parseIsoDate("2026-10-06")).toEqual(d(2026, 10, 6));
    expect(toIsoDate(d(2026, 10, 6))).toBe("2026-10-06");
    expect(toIsoDate(d(2026, 2, 9))).toBe("2026-02-09");
  });

  it("chấp nhận 29/2 năm nhuận, từ chối năm không nhuận", () => {
    expect(parseIsoDate("2024-02-29")).toEqual(d(2024, 2, 29));
    expect(parseIsoDate("2023-02-29")).toBeNull();
  });

  it("từ chối chuỗi sai định dạng hoặc ngày không tồn tại", () => {
    expect(parseIsoDate("abc")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("2026-04-31")).toBeNull();
    expect(parseIsoDate("2026-1-1")).toBeNull();
    expect(parseIsoDate("2026-10-06T00:00:00Z")).toBeNull();
  });

  it("đệm số 0 cho năm nhỏ", () => {
    expect(toIsoDate(d(5, 1, 2))).toBe("0005-01-02");
  });
});
