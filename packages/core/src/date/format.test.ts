import { beforeAll, describe, expect, it } from "vitest";
import { createI18n, type Language } from "../i18n";
import {
  formatDayMonth,
  formatMonthYear,
  formatPlainDate,
  getCountdownLabel,
  getWeekdayLabels,
  getYearsLabel,
  type Translate,
} from "./format";

function translatorFor(language: Language): Translate {
  const instance = createI18n(language);
  return (key, options) => instance.t(key, options) as string;
}

describe("định dạng ngày theo locale", () => {
  it("formatPlainDate không bị lệch ngày do múi giờ máy", () => {
    const en = formatPlainDate({ year: 2026, month: 10, day: 6 }, "en");
    expect(en).toContain("October");
    expect(en).toContain("6");
    expect(en).toContain("2026");

    const vi = formatPlainDate({ year: 2026, month: 10, day: 6 }, "vi");
    expect(vi).toContain("2026");
    expect(vi).toContain("6");
    expect(vi).toContain("10");
  });

  it("formatDayMonth hỗ trợ 29/2 (không cần năm)", () => {
    const en = formatDayMonth(29, 2, "en");
    expect(en).toContain("February");
    expect(en).toContain("29");
    expect(formatDayMonth(29, 2, "vi")).toContain("29");
  });

  it("formatMonthYear cho tiêu đề lịch", () => {
    expect(formatMonthYear(2026, 10, "en")).toBe("October 2026");
    const vi = formatMonthYear(2026, 10, "vi");
    expect(vi).toContain("2026");
    expect(vi).toContain("10");
  });

  it("getWeekdayLabels trả về 7 nhãn, đổi được ngày bắt đầu tuần", () => {
    const mondayFirst = getWeekdayLabels("en", 1);
    const sundayFirst = getWeekdayLabels("en", 0);
    expect(mondayFirst).toHaveLength(7);
    expect(new Set(mondayFirst).size).toBe(7);
    expect(mondayFirst[0]).toBe("Mon");
    expect(mondayFirst[6]).toBe("Sun");
    expect(sundayFirst[0]).toBe("Sun");
    expect(sundayFirst[6]).toBe("Sat");
    expect(new Set(getWeekdayLabels("vi")).size).toBe(7);
  });
});

describe("nhãn đếm ngược và số năm", () => {
  let tEn: Translate;
  let tVi: Translate;

  beforeAll(() => {
    tEn = translatorFor("en");
    tVi = translatorFor("vi");
  });

  it("tiếng Anh chia số nhiều đúng", () => {
    expect(getCountdownLabel(0, tEn)).toBe("Today");
    expect(getCountdownLabel(1, tEn)).toBe("Tomorrow");
    expect(getCountdownLabel(2, tEn)).toBe("2 days left");
    expect(getCountdownLabel(12, tEn)).toBe("12 days left");
    expect(getCountdownLabel(-1, tEn)).toBe("Passed");
    expect(getYearsLabel(1, tEn)).toBe("1 year");
    expect(getYearsLabel(5, tEn)).toBe("5 years");
  });

  it("tiếng Việt không chia số nhiều", () => {
    expect(getCountdownLabel(0, tVi)).toBe("Hôm nay");
    expect(getCountdownLabel(1, tVi)).toBe("Ngày mai");
    expect(getCountdownLabel(2, tVi)).toBe("còn 2 ngày");
    expect(getCountdownLabel(12, tVi)).toBe("còn 12 ngày");
    expect(getCountdownLabel(-1, tVi)).toBe("Đã qua");
    expect(getYearsLabel(1, tVi)).toBe("1 năm");
    expect(getYearsLabel(5, tVi)).toBe("5 năm");
  });
});
