import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asAdmin, createDb, createUser } from "./support/db";

const CHECK_VIOLATION = /check constraint/i;

let db: PGlite;
let userId: string;

interface EventFields {
  title?: string;
  day: number;
  month: number;
  year?: number | null;
  calendarType?: "solar" | "lunar";
  isLeapMonth?: boolean;
  remindDaysBefore?: number[];
  nextOccurrence?: string | null;
}

async function insertEvent(fields: EventFields) {
  await asAdmin(db);
  return db.query<{ id: string; next_occurrence: string | null }>(
    `insert into public.events
       (user_id, title, day, month, year, calendar_type, is_leap_month, remind_days_before, next_occurrence)
     values ($1, $2, $3, $4, $5, $6, $7, $8::integer[], $9)
     returning id, next_occurrence::text as next_occurrence`,
    [
      userId,
      fields.title ?? "Sự kiện",
      fields.day,
      fields.month,
      fields.year ?? null,
      fields.calendarType ?? "solar",
      fields.isLeapMonth ?? false,
      fields.remindDaysBefore ?? [0],
      fields.nextOccurrence ?? null,
    ],
  );
}

async function nextOccurrence(
  day: number,
  month: number,
  year: number | null,
  today: string,
): Promise<string | undefined> {
  await asAdmin(db);
  const result = await db.query<{ value: string }>(
    "select public.compute_next_occurrence($1, $2, $3, $4::date)::text as value",
    [day, month, year, today],
  );
  return result.rows[0]?.value;
}

beforeAll(async () => {
  db = await createDb();
  userId = await createUser(db);
});

afterAll(async () => {
  await db.close();
});

describe("đăng ký user mới", () => {
  it("tạo profile mặc định và 4 danh mục mặc định chưa đặt tên (để dịch ở client)", async () => {
    await asAdmin(db);
    const profile = await db.query<{
      language: string;
      theme: string;
      timezone: string;
      display_name: string | null;
    }>("select language, theme, timezone, display_name from public.profiles where id = $1", [
      userId,
    ]);
    expect(profile.rows[0]).toEqual({
      language: "en",
      theme: "system",
      timezone: "UTC",
      display_name: null,
    });

    const categories = await db.query<{ default_key: string; name: string | null; icon: string }>(
      "select default_key, name, icon from public.categories where user_id = $1 order by default_key",
      [userId],
    );
    expect(categories.rows.map((r) => r.default_key)).toEqual([
      "anniversary",
      "birthday",
      "deadline",
      "memorial",
    ]);
    expect(categories.rows.every((r) => r.name === null)).toBe(true);
  });

  it("lấy language và display_name từ metadata đăng ký", async () => {
    const id = await createUser(db, {
      metadata: { language: "vi", display_name: "  Minh  " },
    });
    await asAdmin(db);
    const result = await db.query<{ language: string; display_name: string }>(
      "select language, display_name from public.profiles where id = $1",
      [id],
    );
    expect(result.rows[0]).toEqual({ language: "vi", display_name: "Minh" });
  });

  it("language không hợp lệ trong metadata thì dùng en", async () => {
    const id = await createUser(db, { metadata: { language: "fr" } });
    await asAdmin(db);
    const result = await db.query<{ language: string }>(
      "select language from public.profiles where id = $1",
      [id],
    );
    expect(result.rows[0]?.language).toBe("en");
  });

  it("seed idempotent: gọi lại không tạo trùng", async () => {
    await asAdmin(db);
    await db.query("select public.seed_default_categories($1)", [userId]);
    const result = await db.query<{ count: number }>(
      "select count(*)::int as count from public.categories where user_id = $1 and default_key is not null",
      [userId],
    );
    expect(result.rows[0]?.count).toBe(4);
  });

  it("xóa user thì xóa luôn profile, danh mục và sự kiện", async () => {
    const id = await createUser(db);
    await db.query(
      "insert into public.events (user_id, title, day, month) values ($1, 'x', 1, 1)",
      [id],
    );
    await db.query("delete from auth.users where id = $1", [id]);
    for (const table of ["profiles", "categories", "events"]) {
      const column = table === "profiles" ? "id" : "user_id";
      const result = await db.query(`select 1 from public.${table} where ${column} = $1`, [id]);
      expect(result.rows).toHaveLength(0);
    }
  });
});

describe("ràng buộc ngày", () => {
  it("chấp nhận ngày hợp lệ và 29/2 khi không có năm", async () => {
    await expect(insertEvent({ day: 31, month: 1 })).resolves.toBeDefined();
    await expect(insertEvent({ day: 29, month: 2 })).resolves.toBeDefined();
    await expect(insertEvent({ day: 30, month: 4 })).resolves.toBeDefined();
  });

  it("từ chối ngày không tồn tại trong tháng dương lịch", async () => {
    await expect(insertEvent({ day: 31, month: 4 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 30, month: 2 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 31, month: 11 })).rejects.toThrow(CHECK_VIOLATION);
  });

  it("từ chối ngày/tháng ngoài khoảng", async () => {
    await expect(insertEvent({ day: 0, month: 1 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 32, month: 1 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 1, month: 0 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 1, month: 13 })).rejects.toThrow(CHECK_VIOLATION);
  });

  it("29/2 có năm cụ thể chỉ hợp lệ ở năm nhuận", async () => {
    await expect(insertEvent({ day: 29, month: 2, year: 2024 })).resolves.toBeDefined();
    await expect(insertEvent({ day: 29, month: 2, year: 2000 })).resolves.toBeDefined();
    await expect(insertEvent({ day: 29, month: 2, year: 2023 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 29, month: 2, year: 1900 })).rejects.toThrow(CHECK_VIOLATION);
  });

  it("năm phải trong 1..9999", async () => {
    await expect(insertEvent({ day: 1, month: 1, year: 0 })).rejects.toThrow(CHECK_VIOLATION);
    await expect(insertEvent({ day: 1, month: 1, year: 10000 })).rejects.toThrow(CHECK_VIOLATION);
  });

  it("âm lịch cho phép ngày 30 ở mọi tháng và tháng nhuận", async () => {
    await expect(
      insertEvent({ day: 30, month: 2, calendarType: "lunar", nextOccurrence: "2027-03-08" }),
    ).resolves.toBeDefined();
    await expect(
      insertEvent({ day: 15, month: 4, calendarType: "lunar", isLeapMonth: true }),
    ).resolves.toBeDefined();
  });

  it("từ chối tháng nhuận ở dương lịch", async () => {
    await expect(insertEvent({ day: 1, month: 1, isLeapMonth: true })).rejects.toThrow(
      CHECK_VIOLATION,
    );
  });
});

describe("ràng buộc khác của events", () => {
  it("remind_days_before: chấp nhận 0..365 và tối đa 10 mốc", async () => {
    await expect(
      insertEvent({ day: 1, month: 1, remindDaysBefore: [0, 1, 7, 30, 365] }),
    ).resolves.toBeDefined();
    await expect(insertEvent({ day: 1, month: 1, remindDaysBefore: [] })).resolves.toBeDefined();
  });

  it("remind_days_before: từ chối số âm, quá 365 hoặc quá 10 mốc", async () => {
    await expect(insertEvent({ day: 1, month: 1, remindDaysBefore: [-1] })).rejects.toThrow(
      CHECK_VIOLATION,
    );
    await expect(insertEvent({ day: 1, month: 1, remindDaysBefore: [0, 366] })).rejects.toThrow(
      CHECK_VIOLATION,
    );
    await expect(
      insertEvent({ day: 1, month: 1, remindDaysBefore: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
    ).rejects.toThrow(CHECK_VIOLATION);
  });

  it("từ chối tiêu đề rỗng", async () => {
    await expect(insertEvent({ day: 1, month: 1, title: "   " })).rejects.toThrow(CHECK_VIOLATION);
  });

  it("remind_days_before mặc định là {0}", async () => {
    await asAdmin(db);
    const result = await db.query<{ remind_days_before: number[] }>(
      "insert into public.events (user_id, title, day, month) values ($1, 'x', 1, 1) returning remind_days_before",
      [userId],
    );
    expect(result.rows[0]?.remind_days_before).toEqual([0]);
  });
});

describe("categories", () => {
  it("cần name hoặc default_key", async () => {
    await asAdmin(db);
    await expect(
      db.query("insert into public.categories (user_id) values ($1)", [userId]),
    ).rejects.toThrow(CHECK_VIOLATION);
    await expect(
      db.query("insert into public.categories (user_id, name) values ($1, '   ')", [userId]),
    ).rejects.toThrow(CHECK_VIOLATION);
  });

  it("không trùng default_key trong cùng một user", async () => {
    await asAdmin(db);
    await expect(
      db.query("insert into public.categories (user_id, default_key) values ($1, 'birthday')", [
        userId,
      ]),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it("xóa danh mục thì sự kiện giữ lại và category_id về null", async () => {
    await asAdmin(db);
    const category = await db.query<{ id: string }>(
      "insert into public.categories (user_id, name) values ($1, 'Tạm') returning id",
      [userId],
    );
    const categoryId = category.rows[0]?.id;
    const event = await db.query<{ id: string }>(
      "insert into public.events (user_id, title, day, month, category_id) values ($1, 'x', 1, 1, $2) returning id",
      [userId, categoryId],
    );
    const eventId = event.rows[0]?.id;
    await db.query("delete from public.categories where id = $1", [categoryId]);
    const result = await db.query<{ category_id: string | null }>(
      "select category_id from public.events where id = $1",
      [eventId],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.category_id).toBeNull();
  });
});

describe("compute_next_occurrence", () => {
  const cases: Array<{
    name: string;
    args: [number, number, number | null, string];
    expected: string;
  }> = [
    {
      name: "sự kiện chưa tới trong năm",
      args: [25, 12, null, "2026-10-06"],
      expected: "2026-12-25",
    },
    {
      name: "sự kiện đã qua trong năm thì sang năm sau",
      args: [15, 3, null, "2026-10-06"],
      expected: "2027-03-15",
    },
    {
      name: "hôm nay tính là lần xuất hiện",
      args: [6, 10, null, "2026-10-06"],
      expected: "2026-10-06",
    },
    { name: "chuyển năm: 31/12 -> 1/1", args: [1, 1, null, "2026-12-31"], expected: "2027-01-01" },
    {
      name: "chuyển năm: 31/12 vào đúng ngày 31/12",
      args: [31, 12, null, "2026-12-31"],
      expected: "2026-12-31",
    },
    {
      name: "chuyển năm: 31/12 vào ngày 1/1",
      args: [31, 12, null, "2027-01-01"],
      expected: "2027-12-31",
    },
    {
      name: "29/2 dời về 28/2 ở năm không nhuận",
      args: [29, 2, null, "2026-10-06"],
      expected: "2027-02-28",
    },
    {
      name: "29/2 giữ nguyên ở năm nhuận",
      args: [29, 2, null, "2027-10-06"],
      expected: "2028-02-29",
    },
    {
      name: "29/2 trong năm nhuận khi hôm nay trước ngày đó",
      args: [29, 2, null, "2028-01-10"],
      expected: "2028-02-29",
    },
    {
      name: "29/2 sau ngày 28/2 ở năm không nhuận thì sang năm sau",
      args: [29, 2, null, "2025-03-01"],
      expected: "2026-02-28",
    },
    {
      name: "có năm trong quá khứ vẫn lặp hằng năm",
      args: [1, 6, 1990, "2026-10-06"],
      expected: "2027-06-01",
    },
    {
      name: "có năm ở tương lai thì chính là ngày đó",
      args: [1, 6, 2030, "2026-10-06"],
      expected: "2030-06-01",
    },
    {
      name: "29/2 của năm nhuận ở tương lai",
      args: [29, 2, 2028, "2026-10-06"],
      expected: "2028-02-29",
    },
  ];

  for (const { name, args, expected } of cases) {
    it(name, async () => {
      await expect(nextOccurrence(...args)).resolves.toBe(expected);
    });
  }
});

describe("trigger events_before_write", () => {
  it("tính next_occurrence cho sự kiện dương lịch, bỏ qua giá trị client gửi", async () => {
    const result = await insertEvent({ day: 1, month: 1, nextOccurrence: "1999-01-01" });
    const value = result.rows[0]?.next_occurrence;
    expect(value).toMatch(/^\d{4}-01-01$/);
    expect(value).not.toBe("1999-01-01");
  });

  it("dùng múi giờ trong profile để xác định 'hôm nay'", async () => {
    const id = await createUser(db);
    await asAdmin(db);
    await db.query("update public.profiles set timezone = 'Pacific/Kiritimati' where id = $1", [
      id,
    ]);
    const today = await db.query<{ iso: string; day: number; month: number }>(
      `select (now() at time zone 'Pacific/Kiritimati')::date::text as iso,
              extract(day from (now() at time zone 'Pacific/Kiritimati'))::int as day,
              extract(month from (now() at time zone 'Pacific/Kiritimati'))::int as month`,
    );
    const row = today.rows[0];
    if (!row) throw new Error("Không đọc được ngày hiện tại");
    const result = await db.query<{ next_occurrence: string }>(
      "insert into public.events (user_id, title, day, month) values ($1, 'x', $2, $3) returning next_occurrence::text as next_occurrence",
      [id, row.day, row.month],
    );
    // Đúng ngày địa phương hôm nay thì lần kế tiếp chính là hôm nay (không bị lệch múi giờ)
    expect(result.rows[0]?.next_occurrence).toBe(row.iso);
  });

  it("múi giờ không hợp lệ thì dùng UTC thay vì báo lỗi", async () => {
    const id = await createUser(db);
    await asAdmin(db);
    await db.query("update public.profiles set timezone = 'Khong/Ton_Tai' where id = $1", [id]);
    const today = await db.query<{ iso: string; day: number; month: number }>(
      `select (now() at time zone 'UTC')::date::text as iso,
              extract(day from (now() at time zone 'UTC'))::int as day,
              extract(month from (now() at time zone 'UTC'))::int as month`,
    );
    const row = today.rows[0];
    if (!row) throw new Error("Không đọc được ngày hiện tại");
    const result = await db.query<{ next_occurrence: string }>(
      "insert into public.events (user_id, title, day, month) values ($1, 'x', $2, $3) returning next_occurrence::text as next_occurrence",
      [id, row.day, row.month],
    );
    expect(result.rows[0]?.next_occurrence).toBe(row.iso);
  });

  it("sự kiện âm lịch giữ nguyên next_occurrence được cung cấp", async () => {
    const result = await insertEvent({
      day: 1,
      month: 1,
      calendarType: "lunar",
      nextOccurrence: "2027-02-06",
    });
    expect(result.rows[0]?.next_occurrence).toBe("2027-02-06");
  });

  it("cập nhật ngày thì tính lại next_occurrence và làm mới updated_at", async () => {
    const created = await insertEvent({ day: 1, month: 1 });
    const id = created.rows[0]?.id;
    await asAdmin(db);
    const updated = await db.query<{ next_occurrence: string; touched: boolean }>(
      `update public.events set month = 12, day = 25 where id = $1
       returning next_occurrence::text as next_occurrence, updated_at > created_at as touched`,
      [id],
    );
    expect(updated.rows[0]?.next_occurrence).toMatch(/^\d{4}-12-25$/);
    expect(updated.rows[0]?.touched).toBe(true);
  });
});
