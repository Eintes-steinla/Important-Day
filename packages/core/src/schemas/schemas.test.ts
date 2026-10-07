import type { ZodType } from "zod";
import { describe, expect, it } from "vitest";
import { createI18n } from "../i18n";
import {
  categoryInputSchema,
  eventInputSchema,
  profileUpdateSchema,
  signInSchema,
  signUpSchema,
} from "./index";

const UUID = "3f2b8a1e-5c4d-4e6f-9a0b-1c2d3e4f5a6b";

const i18nEn = createI18n("en");
const i18nVi = createI18n("vi");

/** Trả về danh sách thông báo lỗi (key i18n) khi parse thất bại. */
function messages(schema: ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.message);
}

function expectError(schema: ZodType, input: unknown, key: string) {
  const found = messages(schema, input);
  expect(found).toContain(key);
  // Mọi thông báo lỗi phải là key có thật ở cả hai ngôn ngữ
  for (const message of found) {
    expect(i18nEn.exists(message), `thiếu key en: ${message}`).toBe(true);
    expect(i18nVi.exists(message), `thiếu key vi: ${message}`).toBe(true);
  }
}

const validEvent = { title: "Sinh nhật mẹ", day: 15, month: 3 };

describe("eventInputSchema", () => {
  it("chấp nhận dữ liệu tối thiểu và điền giá trị mặc định", () => {
    expect(eventInputSchema.parse(validEvent)).toEqual({
      title: "Sinh nhật mẹ",
      note: null,
      calendarType: "solar",
      day: 15,
      month: 3,
      year: null,
      isLeapMonth: false,
      categoryId: null,
      color: null,
      icon: null,
      remindDaysBefore: [0],
    });
  });

  it("cắt khoảng trắng, chuỗi rỗng thành null", () => {
    const parsed = eventInputSchema.parse({
      ...validEvent,
      title: "  Cưới  ",
      note: "   ",
      color: "",
      icon: " cake ",
      categoryId: "",
    });
    expect(parsed.title).toBe("Cưới");
    expect(parsed.note).toBeNull();
    expect(parsed.color).toBeNull();
    expect(parsed.icon).toBe("cake");
    expect(parsed.categoryId).toBeNull();
  });

  it("nhận categoryId là uuid", () => {
    expect(eventInputSchema.parse({ ...validEvent, categoryId: UUID }).categoryId).toBe(UUID);
    expectError(eventInputSchema, { ...validEvent, categoryId: "abc" }, "errors.invalidData");
  });

  it("tiêu đề bắt buộc và tối đa 200 ký tự", () => {
    expectError(eventInputSchema, { ...validEvent, title: "   " }, "validation.title.required");
    expectError(eventInputSchema, { ...validEvent, title: undefined }, "validation.title.required");
    expectError(
      eventInputSchema,
      { ...validEvent, title: "a".repeat(201) },
      "validation.title.tooLong",
    );
    expect(eventInputSchema.safeParse({ ...validEvent, title: "a".repeat(200) }).success).toBe(
      true,
    );
  });

  it("ghi chú tối đa 5000 ký tự", () => {
    expectError(
      eventInputSchema,
      { ...validEvent, note: "a".repeat(5001) },
      "validation.note.tooLong",
    );
  });

  it("từ chối ngày không tồn tại trong tháng", () => {
    expectError(eventInputSchema, { ...validEvent, day: 31, month: 4 }, "validation.date.invalid");
    expectError(eventInputSchema, { ...validEvent, day: 30, month: 2 }, "validation.date.invalid");
    expectError(eventInputSchema, { ...validEvent, day: 0 }, "validation.date.invalid");
    expectError(eventInputSchema, { ...validEvent, month: 13 }, "validation.date.invalid");
    expectError(eventInputSchema, { ...validEvent, day: 1.5 }, "validation.date.invalid");
  });

  it("29/2 hợp lệ khi không có năm và ở năm nhuận, không hợp lệ ở năm không nhuận", () => {
    const feb29 = { ...validEvent, day: 29, month: 2 };
    expect(eventInputSchema.safeParse(feb29).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...feb29, year: 2024 }).success).toBe(true);
    expectError(eventInputSchema, { ...feb29, year: 2023 }, "validation.date.feb29NotLeap");
  });

  it("năm không rõ (null) hoặc trong 1..9999", () => {
    expect(eventInputSchema.parse({ ...validEvent, year: null }).year).toBeNull();
    expect(eventInputSchema.parse({ ...validEvent, year: 1990 }).year).toBe(1990);
    expectError(eventInputSchema, { ...validEvent, year: 0 }, "validation.year.invalid");
    expectError(eventInputSchema, { ...validEvent, year: 10000 }, "validation.year.invalid");
    expectError(eventInputSchema, { ...validEvent, year: 1990.5 }, "validation.year.invalid");
  });

  it("âm lịch cho phép ngày 30 và tháng nhuận; tháng nhuận bị từ chối ở dương lịch", () => {
    expect(
      eventInputSchema.safeParse({ ...validEvent, calendarType: "lunar", day: 30, month: 2 })
        .success,
    ).toBe(true);
    expect(
      eventInputSchema.safeParse({ ...validEvent, calendarType: "lunar", isLeapMonth: true })
        .success,
    ).toBe(true);
    expectError(
      eventInputSchema,
      { ...validEvent, isLeapMonth: true },
      "validation.leapMonth.lunarOnly",
    );
  });

  it("nhắc trước: bỏ trùng, sắp xếp, giới hạn 0..365 và tối đa 10 mốc", () => {
    expect(
      eventInputSchema.parse({ ...validEvent, remindDaysBefore: [7, 0, 7, 1] }).remindDaysBefore,
    ).toEqual([0, 1, 7]);
    expect(
      eventInputSchema.parse({ ...validEvent, remindDaysBefore: [] }).remindDaysBefore,
    ).toEqual([]);
    expectError(
      eventInputSchema,
      { ...validEvent, remindDaysBefore: [-1] },
      "validation.remind.invalid",
    );
    expectError(
      eventInputSchema,
      { ...validEvent, remindDaysBefore: [366] },
      "validation.remind.invalid",
    );
    expectError(
      eventInputSchema,
      { ...validEvent, remindDaysBefore: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      "validation.remind.tooMany",
    );
  });

  it("từ chối calendarType ngoài danh sách", () => {
    expect(eventInputSchema.safeParse({ ...validEvent, calendarType: "julian" }).success).toBe(
      false,
    );
  });
});

describe("categoryInputSchema", () => {
  it("điền màu và icon mặc định", () => {
    expect(categoryInputSchema.parse({ name: "  Du lịch " })).toEqual({
      name: "Du lịch",
      color: "indigo",
      icon: "tag",
    });
  });

  it("tên bắt buộc và tối đa 60 ký tự", () => {
    expectError(categoryInputSchema, { name: "  " }, "validation.category.nameRequired");
    expectError(categoryInputSchema, {}, "validation.category.nameRequired");
    expectError(categoryInputSchema, { name: "a".repeat(61) }, "validation.category.nameTooLong");
  });
});

describe("profileUpdateSchema", () => {
  it("cho phép cập nhật một phần", () => {
    expect(profileUpdateSchema.parse({})).toEqual({});
    expect(profileUpdateSchema.parse({ theme: "dark" })).toEqual({ theme: "dark" });
    expect(profileUpdateSchema.parse({ language: "vi", timezone: "Asia/Ho_Chi_Minh" })).toEqual({
      language: "vi",
      timezone: "Asia/Ho_Chi_Minh",
    });
  });

  it("từ chối ngôn ngữ, giao diện và múi giờ không hợp lệ", () => {
    expect(profileUpdateSchema.safeParse({ language: "fr" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ theme: "blue" }).success).toBe(false);
    expectError(profileUpdateSchema, { timezone: "Khong/Ton_Tai" }, "validation.timezone.invalid");
  });

  it("tên hiển thị rỗng thành null và tối đa 100 ký tự", () => {
    expect(profileUpdateSchema.parse({ displayName: "  " })).toEqual({ displayName: null });
    expectError(
      profileUpdateSchema,
      { displayName: "a".repeat(101) },
      "validation.displayName.tooLong",
    );
  });
});

describe("signInSchema và signUpSchema", () => {
  it("chuẩn hóa email: cắt khoảng trắng và chữ thường", () => {
    expect(signInSchema.parse({ email: "  Minh@Example.COM ", password: "x" }).email).toBe(
      "minh@example.com",
    );
  });

  it("từ chối email sai định dạng", () => {
    expectError(
      signInSchema,
      { email: "khong-phai-email", password: "x" },
      "validation.email.invalid",
    );
    expectError(signUpSchema, { email: "", password: "matkhau123" }, "validation.email.invalid");
  });

  it("đăng nhập chỉ yêu cầu có mật khẩu", () => {
    expectError(signInSchema, { email: "a@b.co", password: "" }, "validation.password.required");
    expect(signInSchema.safeParse({ email: "a@b.co", password: "123" }).success).toBe(true);
  });

  it("đăng ký yêu cầu mật khẩu 8..72 ký tự", () => {
    expectError(
      signUpSchema,
      { email: "a@b.co", password: "1234567" },
      "validation.password.tooShort",
    );
    expectError(
      signUpSchema,
      { email: "a@b.co", password: "a".repeat(73) },
      "validation.password.tooLong",
    );
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "12345678" }).success).toBe(true);
  });

  it("đăng ký nhận tên hiển thị và ngôn ngữ tùy chọn", () => {
    const parsed = signUpSchema.parse({
      email: "a@b.co",
      password: "12345678",
      displayName: " Minh ",
      language: "vi",
    });
    expect(parsed.displayName).toBe("Minh");
    expect(parsed.language).toBe("vi");
    expect(
      signUpSchema.safeParse({ email: "a@b.co", password: "12345678", language: "fr" }).success,
    ).toBe(false);
  });
});
