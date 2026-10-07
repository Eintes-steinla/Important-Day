import { describe, expect, it } from "vitest";
import { detectTimeZone, isValidTimeZone, todayInTimeZone } from "./timezone";

describe("todayInTimeZone", () => {
  it("cùng một thời điểm, mỗi múi giờ có thể là ngày khác nhau", () => {
    const instant = new Date("2026-10-06T12:00:00Z");
    expect(todayInTimeZone("UTC", instant)).toEqual({ year: 2026, month: 10, day: 6 });
    // UTC+14 đã sang ngày hôm sau
    expect(todayInTimeZone("Pacific/Kiritimati", instant)).toEqual({
      year: 2026,
      month: 10,
      day: 7,
    });
    // UTC-11 vẫn ở ngày 6
    expect(todayInTimeZone("Pacific/Pago_Pago", instant)).toEqual({
      year: 2026,
      month: 10,
      day: 6,
    });
  });

  it("Việt Nam (UTC+7) sang năm mới sớm hơn UTC", () => {
    const instant = new Date("2026-12-31T23:30:00Z");
    expect(todayInTimeZone("Asia/Ho_Chi_Minh", instant)).toEqual({ year: 2027, month: 1, day: 1 });
    expect(todayInTimeZone("UTC", instant)).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it("múi giờ không hợp lệ thì dùng UTC", () => {
    const instant = new Date("2026-10-06T23:30:00Z");
    expect(todayInTimeZone("Khong/Ton_Tai", instant)).toEqual({ year: 2026, month: 10, day: 6 });
  });
});

describe("isValidTimeZone và detectTimeZone", () => {
  it("nhận diện múi giờ IANA hợp lệ", () => {
    expect(isValidTimeZone("Asia/Ho_Chi_Minh")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Khong/Ton_Tai")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("detectTimeZone luôn trả về múi giờ hợp lệ", () => {
    expect(isValidTimeZone(detectTimeZone())).toBe(true);
  });
});
