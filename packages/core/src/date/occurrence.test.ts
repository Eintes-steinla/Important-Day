import { afterEach, describe, expect, it } from "vitest";
import { setLunarConverter, type LunarDate } from "./lunar";
import {
  daysUntil,
  getNextOccurrence,
  getReminderDate,
  getYearsSince,
  listOccurrencesInRange,
  occurrenceInYear,
  solarDateInYear,
  type EventDate,
} from "./occurrence";
import type { PlainDate } from "./plain-date";

const d = (year: number, month: number, day: number): PlainDate => ({ year, month, day });

const solar = (day: number, month: number, year: number | null = null): EventDate => ({
  calendarType: "solar",
  day,
  month,
  year,
  isLeapMonth: false,
});

const lunar = (
  day: number,
  month: number,
  year: number | null = null,
  isLeapMonth = false,
): EventDate => ({ calendarType: "lunar", day, month, year, isLeapMonth });

const TODAY = d(2026, 10, 6);

afterEach(() => setLunarConverter(null));

describe("solarDateInYear (29/2)", () => {
  it("giữ nguyên 29/2 ở năm nhuận", () => {
    expect(solarDateInYear(29, 2, 2028)).toEqual(d(2028, 2, 29));
  });

  it("mặc định dời 29/2 về 28/2 ở năm không nhuận", () => {
    expect(solarDateInYear(29, 2, 2027)).toEqual(d(2027, 2, 28));
  });

  it("đổi được sang 1/3 bằng feb29Policy", () => {
    expect(solarDateInYear(29, 2, 2027, { feb29Policy: "mar1" })).toEqual(d(2027, 3, 1));
    expect(solarDateInYear(29, 2, 2028, { feb29Policy: "mar1" })).toEqual(d(2028, 2, 29));
  });
});

describe("getNextOccurrence: sự kiện dương lịch không có năm", () => {
  it("sự kiện chưa tới trong năm", () => {
    expect(getNextOccurrence(solar(25, 12), TODAY)).toEqual(d(2026, 12, 25));
  });

  it("sự kiện đã qua trong năm thì sang năm sau", () => {
    expect(getNextOccurrence(solar(15, 3), TODAY)).toEqual(d(2027, 3, 15));
  });

  it("đúng hôm nay thì tính là lần kế tiếp", () => {
    expect(getNextOccurrence(solar(6, 10), TODAY)).toEqual(TODAY);
  });

  it("hôm qua thì sang năm sau", () => {
    expect(getNextOccurrence(solar(5, 10), TODAY)).toEqual(d(2027, 10, 5));
  });

  it("chuyển năm 31/12 -> 1/1", () => {
    expect(getNextOccurrence(solar(1, 1), d(2026, 12, 31))).toEqual(d(2027, 1, 1));
    expect(getNextOccurrence(solar(31, 12), d(2026, 12, 31))).toEqual(d(2026, 12, 31));
    expect(getNextOccurrence(solar(31, 12), d(2027, 1, 1))).toEqual(d(2027, 12, 31));
  });
});

describe("getNextOccurrence: 29/2", () => {
  it("năm sau không nhuận thì dời về 28/2", () => {
    expect(getNextOccurrence(solar(29, 2), TODAY)).toEqual(d(2027, 2, 28));
  });

  it("gặp năm nhuận thì giữ 29/2", () => {
    expect(getNextOccurrence(solar(29, 2), d(2027, 10, 6))).toEqual(d(2028, 2, 29));
    expect(getNextOccurrence(solar(29, 2), d(2028, 1, 10))).toEqual(d(2028, 2, 29));
  });

  it("đã qua 29/2 của năm nhuận thì sang năm sau (28/2)", () => {
    expect(getNextOccurrence(solar(29, 2), d(2028, 3, 1))).toEqual(d(2029, 2, 28));
  });

  it("đã qua 28/2 ở năm không nhuận thì sang năm sau", () => {
    expect(getNextOccurrence(solar(29, 2), d(2025, 3, 1))).toEqual(d(2026, 2, 28));
  });

  it("policy mar1 dời sang 1/3", () => {
    expect(getNextOccurrence(solar(29, 2), TODAY, { feb29Policy: "mar1" })).toEqual(d(2027, 3, 1));
  });
});

describe("getNextOccurrence: sự kiện có năm", () => {
  it("năm đã qua vẫn lặp hằng năm", () => {
    expect(getNextOccurrence(solar(1, 6, 1990), TODAY)).toEqual(d(2027, 6, 1));
    expect(getNextOccurrence(solar(25, 12, 1990), TODAY)).toEqual(d(2026, 12, 25));
  });

  it("năm ở tương lai thì chính là ngày đó", () => {
    expect(getNextOccurrence(solar(1, 6, 2030), TODAY)).toEqual(d(2030, 6, 1));
  });

  it("năm hiện tại, ngày chưa tới hoặc đã qua", () => {
    expect(getNextOccurrence(solar(25, 12, 2026), TODAY)).toEqual(d(2026, 12, 25));
    expect(getNextOccurrence(solar(1, 3, 2026), TODAY)).toEqual(d(2027, 3, 1));
  });

  it("29/2 của năm nhuận ở tương lai", () => {
    expect(getNextOccurrence(solar(29, 2, 2028), TODAY)).toEqual(d(2028, 2, 29));
  });
});

describe("occurrenceInYear", () => {
  it("không có lần xuất hiện trước năm gốc", () => {
    expect(occurrenceInYear(solar(1, 6, 2000), 1999)).toBeNull();
    expect(occurrenceInYear(solar(1, 6, 2000), 2000)).toEqual(d(2000, 6, 1));
  });

  it("không có năm gốc thì năm nào cũng có", () => {
    expect(occurrenceInYear(solar(1, 6), 1900)).toEqual(d(1900, 6, 1));
  });
});

describe("listOccurrencesInRange (lịch tháng)", () => {
  it("lấy sự kiện nằm trong tháng đang xem", () => {
    const from = d(2026, 10, 1);
    const to = d(2026, 10, 31);
    expect(listOccurrencesInRange(solar(6, 10), from, to)).toEqual([d(2026, 10, 6)]);
    expect(listOccurrencesInRange(solar(1, 11), from, to)).toEqual([]);
  });

  it("bao gồm cả hai đầu của khoảng", () => {
    const from = d(2026, 10, 1);
    const to = d(2026, 10, 31);
    expect(listOccurrencesInRange(solar(1, 10), from, to)).toEqual([d(2026, 10, 1)]);
    expect(listOccurrencesInRange(solar(31, 10), from, to)).toEqual([d(2026, 10, 31)]);
  });

  it("29/2 hiện ở 28/2 trong năm không nhuận và 29/2 trong năm nhuận", () => {
    expect(listOccurrencesInRange(solar(29, 2), d(2027, 2, 1), d(2027, 2, 28))).toEqual([
      d(2027, 2, 28),
    ]);
    expect(listOccurrencesInRange(solar(29, 2), d(2028, 2, 1), d(2028, 2, 29))).toEqual([
      d(2028, 2, 29),
    ]);
  });

  it("không hiện trước năm gốc của sự kiện", () => {
    expect(listOccurrencesInRange(solar(1, 6, 2030), d(2026, 6, 1), d(2026, 6, 30))).toEqual([]);
    expect(listOccurrencesInRange(solar(1, 6, 2026), d(2025, 6, 1), d(2025, 6, 30))).toEqual([]);
  });

  it("khoảng nhiều năm trả về từng năm theo thứ tự", () => {
    const from = d(2024, 1, 1);
    const to = d(2026, 12, 31);
    expect(listOccurrencesInRange(solar(1, 6), from, to)).toEqual([
      d(2024, 6, 1),
      d(2025, 6, 1),
      d(2026, 6, 1),
    ]);
    expect(listOccurrencesInRange(solar(1, 6, 2025), from, to)).toEqual([
      d(2025, 6, 1),
      d(2026, 6, 1),
    ]);
  });

  it("khoảng đảo ngược trả về rỗng", () => {
    expect(listOccurrencesInRange(solar(1, 1), d(2026, 12, 31), d(2026, 1, 1))).toEqual([]);
  });
});

describe("daysUntil", () => {
  it("hôm nay là 0, tương lai dương, quá khứ âm", () => {
    expect(daysUntil(TODAY, TODAY)).toBe(0);
    expect(daysUntil(d(2026, 10, 7), TODAY)).toBe(1);
    expect(daysUntil(d(2026, 12, 25), TODAY)).toBe(80);
    expect(daysUntil(d(2026, 10, 1), TODAY)).toBe(-5);
  });

  it("qua 29/2", () => {
    expect(daysUntil(d(2028, 3, 1), d(2028, 2, 28))).toBe(2);
  });
});

describe("getYearsSince (tuổi / số năm kỷ niệm)", () => {
  it("không có năm gốc thì không tính số năm", () => {
    expect(getYearsSince({ year: null }, d(2027, 6, 1))).toBeNull();
  });

  it("có năm gốc thì lấy hiệu số năm", () => {
    expect(getYearsSince({ year: 1990 }, d(2027, 6, 1))).toBe(37);
    expect(getYearsSince({ year: 2030 }, d(2030, 6, 1))).toBe(0);
  });

  it("lần xuất hiện trước năm gốc thì null", () => {
    expect(getYearsSince({ year: 2030 }, d(2026, 6, 1))).toBeNull();
  });

  it("âm lịch dùng năm âm lịch nếu được truyền", () => {
    expect(getYearsSince({ year: 1990 }, d(2027, 1, 20), 2026)).toBe(36);
  });
});

describe("getReminderDate", () => {
  it("lùi theo số ngày nhắc trước", () => {
    expect(getReminderDate(d(2026, 3, 1), 0)).toEqual(d(2026, 3, 1));
    expect(getReminderDate(d(2026, 3, 1), 7)).toEqual(d(2026, 2, 22));
    expect(getReminderDate(d(2027, 1, 1), 1)).toEqual(d(2026, 12, 31));
  });
});

describe("âm lịch (chỗ cắm lunarToSolar)", () => {
  // Bộ quy đổi giả: tháng 1 âm -> mùng như ngày ở tháng 2 dương cùng năm; tháng nhuận không có
  const fakeConverter = {
    lunarToSolar: (value: LunarDate): PlainDate | null =>
      value.month === 1 && !value.isLeapMonth
        ? { year: value.year, month: 2, day: value.day }
        : null,
  };

  it("chưa có bộ quy đổi thì không đoán ngày", () => {
    expect(getNextOccurrence(lunar(1, 1), TODAY)).toBeNull();
    expect(occurrenceInYear(lunar(1, 1), 2026)).toBeNull();
    expect(listOccurrencesInRange(lunar(1, 1), d(2026, 1, 1), d(2026, 12, 31))).toEqual([]);
  });

  it("có bộ quy đổi thì tìm lần kế tiếp, kể cả khi sang năm sau", () => {
    setLunarConverter(fakeConverter);
    expect(getNextOccurrence(lunar(1, 1), TODAY)).toEqual(d(2027, 2, 1));
    expect(getNextOccurrence(lunar(1, 1), d(2026, 1, 5))).toEqual(d(2026, 2, 1));
  });

  it("ngày âm lịch không tồn tại (tháng nhuận) thì null", () => {
    setLunarConverter(fakeConverter);
    expect(getNextOccurrence(lunar(1, 1, null, true), TODAY)).toBeNull();
  });

  it("tôn trọng năm gốc của sự kiện âm lịch", () => {
    setLunarConverter(fakeConverter);
    expect(occurrenceInYear(lunar(1, 1, 2030), 2029)).toBeNull();
    expect(occurrenceInYear(lunar(1, 1, 2030), 2030)).toEqual(d(2030, 2, 1));
  });

  it("năm gốc ở tương lai xa thì lần kế tiếp là chính năm gốc (giống dương lịch)", () => {
    setLunarConverter(fakeConverter);
    expect(getNextOccurrence(lunar(5, 1, 2030), TODAY)).toEqual(d(2030, 2, 5));
    expect(getNextOccurrence(lunar(5, 1, 2027), TODAY)).toEqual(d(2027, 2, 5));
  });

  it("năm gốc đã qua vẫn lặp hằng năm", () => {
    setLunarConverter(fakeConverter);
    expect(getNextOccurrence(lunar(5, 1, 1990), TODAY)).toEqual(d(2027, 2, 5));
  });

  it("listOccurrencesInRange dùng bộ quy đổi", () => {
    setLunarConverter(fakeConverter);
    expect(listOccurrencesInRange(lunar(10, 1), d(2026, 2, 1), d(2026, 2, 28))).toEqual([
      d(2026, 2, 10),
    ]);
  });
});
