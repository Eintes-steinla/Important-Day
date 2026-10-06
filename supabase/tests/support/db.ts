import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../../migrations");

/** Tạo DB trống, nạp shim Supabase rồi chạy toàn bộ migration theo thứ tự tên file. */
export async function createDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(here, "supabase-shim.sql"), "utf8"));
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }
  return db;
}

interface CreateUserOptions {
  email?: string;
  metadata?: Record<string, unknown>;
}

/** Tạo user (chạy với quyền admin) và trả về id. Trigger sẽ tạo profile + danh mục mặc định. */
export async function createUser(db: PGlite, options: CreateUserOptions = {}): Promise<string> {
  await asAdmin(db);
  const result = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id",
    [options.email ?? null, JSON.stringify(options.metadata ?? {})],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Không tạo được user");
  return row.id;
}

/** Chạy các câu lệnh tiếp theo với vai trò `authenticated` và JWT của user này. */
export async function asUser(db: PGlite, userId: string): Promise<void> {
  await db.exec("reset role");
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
}

/** Chưa đăng nhập: role `anon`, không có sub. */
export async function asAnon(db: PGlite): Promise<void> {
  await db.exec("reset role");
  await db.exec("set role anon");
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ role: "anon" }),
  ]);
}

/** Quyền superuser (bỏ qua RLS), dùng để dựng dữ liệu và kiểm tra trạng thái thật. */
export async function asAdmin(db: PGlite): Promise<void> {
  await db.exec("reset role");
}
