import { describe, expect, it } from "vitest";
import type { CalendarType } from "./occurrence";
import { validateEventDate } from "./validate";

const check = (
  calendarType: CalendarType,
  day: number,
  month: number,
  year: number | null = null,
) => validateEventDate({ calendarType, day, month, year });

describe("validateEventDate (cùng quy tắc với ràng buộc DB)", () => {
  it("chấp nhận ngày hợp lệ và 29/2 khi không có năm", () => {
    expect(check("solar", 31, 1)).toBeNull();
    expect(check("solar", 30, 4)).toBeNull();
    expect(check("solar", 29, 2)).toBeNull();
  });

  it("từ chối ngày không tồn tại trong tháng", () => {
    expect(check("solar", 31, 4)).toBe("invalid");
    expect(check("solar", 30, 2)).toBe("invalid");
    expect(check("solar", 31, 11)).toBe("invalid");
  });

  it("từ chối ngày hoặc tháng ngoài khoảng và số không nguyên", () => {
    expect(check("solar", 0, 1)).toBe("invalid");
    expect(check("solar", 32, 1)).toBe("invalid");
    expect(check("solar", 1, 0)).toBe("invalid");
    expect(check("solar", 1, 13)).toBe("invalid");
    expect(check("solar", 1.5, 1)).toBe("invalid");
  });

  it("29/2 có năm cụ thể chỉ hợp lệ ở năm nhuận", () => {
    expect(check("solar", 29, 2, 2024)).toBeNull();
    expect(check("solar", 29, 2, 2000)).toBeNull();
    expect(check("solar", 29, 2, 2023)).toBe("feb29NotLeap");
    expect(check("solar", 29, 2, 1900)).toBe("feb29NotLeap");
  });

  it("âm lịch cho phép ngày 30 ở mọi tháng, không quá 30", () => {
    expect(check("lunar", 30, 2)).toBeNull();
    expect(check("lunar", 29, 2, 2023)).toBeNull();
    expect(check("lunar", 31, 1)).toBe("invalid");
  });
});
