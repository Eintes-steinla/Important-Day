import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asAdmin, asAnon, asUser, createDb, createUser } from "./support/db";

const RLS_VIOLATION = /row-level security/i;
const PERMISSION_DENIED = /permission denied/i;

let db: PGlite;
let userA: string;
let userB: string;
let categoryB: string;
let eventA: string;
let eventB: string;

async function insertCategory(userId: string, name: string): Promise<string> {
  await asAdmin(db);
  const result = await db.query<{ id: string }>(
    "insert into public.categories (user_id, name) values ($1, $2) returning id",
    [userId, name],
  );
  return result.rows[0]?.id ?? "";
}

async function insertEvent(userId: string, title: string): Promise<string> {
  await asAdmin(db);
  const result = await db.query<{ id: string }>(
    "insert into public.events (user_id, title, day, month) values ($1, $2, 10, 6) returning id",
    [userId, title],
  );
  return result.rows[0]?.id ?? "";
}

beforeAll(async () => {
  db = await createDb();
  userA = await createUser(db, { email: "a@example.com" });
  userB = await createUser(db, { email: "b@example.com" });
  categoryB = await insertCategory(userB, "Của B");
  eventA = await insertEvent(userA, "Sự kiện của A");
  eventB = await insertEvent(userB, "Sự kiện của B");
});

afterAll(async () => {
  await db.close();
});

describe("RLS được bật trên mọi bảng", () => {
  it("không có bảng nào ở schema public thiếu RLS", async () => {
    await asAdmin(db);
    const result = await db.query<{ relname: string }>(
      `select relname from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`,
    );
    expect(result.rows).toEqual([]);
  });
});

describe("events: user A không đọc/ghi được dữ liệu user B", () => {
  it("A chỉ thấy sự kiện của mình", async () => {
    await asUser(db, userA);
    const result = await db.query<{ id: string }>("select id from public.events");
    expect(result.rows.map((r) => r.id)).toEqual([eventA]);
  });

  it("A không đọc được sự kiện của B kể cả khi lọc đúng id", async () => {
    await asUser(db, userA);
    const result = await db.query("select * from public.events where id = $1", [eventB]);
    expect(result.rows).toHaveLength(0);
  });

  it("A không tạo được sự kiện cho B", async () => {
    await asUser(db, userA);
    await expect(
      db.query("insert into public.events (user_id, title, day, month) values ($1, 'x', 1, 1)", [
        userB,
      ]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("A tạo sự kiện không ghi user_id thì mặc định là chính A", async () => {
    await asUser(db, userA);
    const result = await db.query<{ user_id: string }>(
      "insert into public.events (title, day, month) values ('mặc định', 1, 1) returning user_id",
    );
    expect(result.rows[0]?.user_id).toBe(userA);
  });

  it("A không sửa được sự kiện của B (0 dòng bị ảnh hưởng)", async () => {
    await asUser(db, userA);
    const result = await db.query(
      "update public.events set title = 'hack' where id = $1 returning id",
      [eventB],
    );
    expect(result.rows).toHaveLength(0);
    await asAdmin(db);
    const check = await db.query<{ title: string }>(
      "select title from public.events where id = $1",
      [eventB],
    );
    expect(check.rows[0]?.title).toBe("Sự kiện của B");
  });

  it("A không xóa được sự kiện của B", async () => {
    await asUser(db, userA);
    const result = await db.query("delete from public.events where id = $1 returning id", [eventB]);
    expect(result.rows).toHaveLength(0);
    await asAdmin(db);
    const check = await db.query("select 1 from public.events where id = $1", [eventB]);
    expect(check.rows).toHaveLength(1);
  });

  it("A không chuyển được sự kiện của mình sang user B", async () => {
    await asUser(db, userA);
    await expect(
      db.query("update public.events set user_id = $1 where id = $2", [userB, eventA]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("A không gắn được sự kiện vào danh mục của B (insert)", async () => {
    await asUser(db, userA);
    await expect(
      db.query(
        "insert into public.events (title, day, month, category_id) values ('x', 1, 1, $1)",
        [categoryB],
      ),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("A không gắn được sự kiện của mình vào danh mục của B (update)", async () => {
    await asUser(db, userA);
    await expect(
      db.query("update public.events set category_id = $1 where id = $2", [categoryB, eventA]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("A gắn được sự kiện vào danh mục của chính mình", async () => {
    await asUser(db, userA);
    const own = await db.query<{ id: string }>("select id from public.categories limit 1");
    const categoryId = own.rows[0]?.id;
    const result = await db.query(
      "update public.events set category_id = $1 where id = $2 returning id",
      [categoryId, eventA],
    );
    expect(result.rows).toHaveLength(1);
  });

  it("A sửa và xóa được sự kiện của chính mình", async () => {
    const mine = await insertEvent(userA, "tạm");
    await asUser(db, userA);
    const updated = await db.query(
      "update public.events set title = 'đã sửa' where id = $1 returning id",
      [mine],
    );
    expect(updated.rows).toHaveLength(1);
    const deleted = await db.query("delete from public.events where id = $1 returning id", [mine]);
    expect(deleted.rows).toHaveLength(1);
  });
});

describe("categories: user A không đọc/ghi được dữ liệu user B", () => {
  it("A chỉ thấy danh mục của mình", async () => {
    await asUser(db, userA);
    const result = await db.query<{ user_id: string }>("select user_id from public.categories");
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every((r) => r.user_id === userA)).toBe(true);
  });

  it("A không tạo, sửa, xóa được danh mục của B", async () => {
    await asUser(db, userA);
    await expect(
      db.query("insert into public.categories (user_id, name) values ($1, 'x')", [userB]),
    ).rejects.toThrow(RLS_VIOLATION);
    const updated = await db.query(
      "update public.categories set name = 'hack' where id = $1 returning id",
      [categoryB],
    );
    expect(updated.rows).toHaveLength(0);
    const deleted = await db.query("delete from public.categories where id = $1 returning id", [
      categoryB,
    ]);
    expect(deleted.rows).toHaveLength(0);
  });

  it("A tạo được danh mục riêng với user_id mặc định", async () => {
    await asUser(db, userA);
    const result = await db.query<{ user_id: string }>(
      "insert into public.categories (name, color, icon) values ('Du lịch', 'sky', 'plane') returning user_id",
    );
    expect(result.rows[0]?.user_id).toBe(userA);
  });
});

describe("profiles: user A không đọc/ghi được dữ liệu user B", () => {
  it("A chỉ thấy profile của mình", async () => {
    await asUser(db, userA);
    const result = await db.query<{ id: string }>("select id from public.profiles");
    expect(result.rows.map((r) => r.id)).toEqual([userA]);
  });

  it("A sửa được profile của mình nhưng không sửa được của B", async () => {
    await asUser(db, userA);
    const own = await db.query(
      "update public.profiles set theme = 'dark' where id = $1 returning id",
      [userA],
    );
    expect(own.rows).toHaveLength(1);
    const other = await db.query(
      "update public.profiles set theme = 'dark' where id = $1 returning id",
      [userB],
    );
    expect(other.rows).toHaveLength(0);
  });

  it("A không tạo được profile cho người khác và không đổi được id profile", async () => {
    await asUser(db, userA);
    await expect(
      db.query("insert into public.profiles (id) values (gen_random_uuid())"),
    ).rejects.toThrow(RLS_VIOLATION);
    await expect(
      db.query("update public.profiles set id = $1 where id = $2", [userB, userA]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("từ chối giá trị language và theme ngoài danh sách", async () => {
    await asUser(db, userA);
    await expect(
      db.query("update public.profiles set language = 'fr' where id = $1", [userA]),
    ).rejects.toThrow(/check constraint/i);
    await expect(
      db.query("update public.profiles set theme = 'blue' where id = $1", [userA]),
    ).rejects.toThrow(/check constraint/i);
  });
});

describe("chưa đăng nhập (anon)", () => {
  it("không đọc hay ghi được bảng nào", async () => {
    await asAnon(db);
    await expect(db.query("select * from public.events")).rejects.toThrow(PERMISSION_DENIED);
    await expect(db.query("select * from public.categories")).rejects.toThrow(PERMISSION_DENIED);
    await expect(db.query("select * from public.profiles")).rejects.toThrow(PERMISSION_DENIED);
    await expect(
      db.query("insert into public.events (user_id, title, day, month) values ($1, 'x', 1, 1)", [
        userA,
      ]),
    ).rejects.toThrow(PERMISSION_DENIED);
  });
});

describe("hàm SECURITY DEFINER không gọi được từ client", () => {
  it("user đăng nhập không seed được danh mục cho người khác", async () => {
    await asUser(db, userA);
    await expect(db.query("select public.seed_default_categories($1)", [userB])).rejects.toThrow(
      PERMISSION_DENIED,
    );
    await asAnon(db);
    await expect(db.query("select public.seed_default_categories($1)", [userB])).rejects.toThrow(
      PERMISSION_DENIED,
    );
  });
});

describe("storage: bucket attachments (private, theo thư mục uid)", () => {
  let objectB: string;

  beforeAll(async () => {
    await asAdmin(db);
    await db.exec("insert into storage.buckets (id, name) values ('other', 'other')");
    const result = await db.query<{ id: string }>(
      "insert into storage.objects (bucket_id, name, owner) values ('attachments', $1, $2) returning id",
      [`${userB}/secret.png`, userB],
    );
    objectB = result.rows[0]?.id ?? "";
  });

  it("bucket được tạo ở chế độ private", async () => {
    await asAdmin(db);
    const result = await db.query<{ public: boolean }>(
      "select public from storage.buckets where id = 'attachments'",
    );
    expect(result.rows[0]?.public).toBe(false);
  });

  it("A tải lên được file trong thư mục của mình", async () => {
    await asUser(db, userA);
    const result = await db.query(
      "insert into storage.objects (bucket_id, name) values ('attachments', $1) returning id",
      [`${userA}/photo.png`],
    );
    expect(result.rows).toHaveLength(1);
  });

  it("A không tải lên được vào thư mục của B hoặc ngoài thư mục uid", async () => {
    await asUser(db, userA);
    await expect(
      db.query("insert into storage.objects (bucket_id, name) values ('attachments', $1)", [
        `${userB}/x.png`,
      ]),
    ).rejects.toThrow(RLS_VIOLATION);
    await expect(
      db.query("insert into storage.objects (bucket_id, name) values ('attachments', 'root.png')"),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("policy chỉ áp dụng cho bucket attachments", async () => {
    await asUser(db, userA);
    await expect(
      db.query("insert into storage.objects (bucket_id, name) values ('other', $1)", [
        `${userA}/x.png`,
      ]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("A không thấy, không sửa, không xóa file của B", async () => {
    await asUser(db, userA);
    const visible = await db.query<{ name: string }>("select name from storage.objects");
    expect(visible.rows.every((r) => r.name.startsWith(`${userA}/`))).toBe(true);
    const updated = await db.query(
      "update storage.objects set name = $1 where id = $2 returning id",
      [`${userA}/stolen.png`, objectB],
    );
    expect(updated.rows).toHaveLength(0);
    const deleted = await db.query("delete from storage.objects where id = $1 returning id", [
      objectB,
    ]);
    expect(deleted.rows).toHaveLength(0);
  });

  it("A không đổi được file của mình sang thư mục của B", async () => {
    await asUser(db, userA);
    await expect(
      db.query("update storage.objects set name = $1 where name = $2", [
        `${userB}/moved.png`,
        `${userA}/photo.png`,
      ]),
    ).rejects.toThrow(RLS_VIOLATION);
  });

  it("anon không có quyền với file nào", async () => {
    await asAnon(db);
    const result = await db.query("select * from storage.objects");
    expect(result.rows).toHaveLength(0);
  });
});
