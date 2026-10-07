import { describe, expect, it } from "vitest";
import type { Tables } from "../database.types";
import { assertClientSafeKey, parseSupabaseEnv, type AppSupabaseClient } from "./client";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  updateCategoryAppearance,
} from "./categories";
import { ApiError, getErrorMessageKey, toAuthError, toDatabaseError } from "./errors";
import { createEvent, deleteEvent, getEvent, listEvents, updateEvent } from "./events";
import { getCurrentUserId, signInWithEmail, signOut, signUpWithEmail } from "./auth";
import { mapCategoryRow, mapEventRow, mapProfileRow, profilePatchToRow } from "./mappers";
import { getProfile, updateProfile } from "./profile";
import { queryKeys } from "./query-keys";

interface Call {
  method: string;
  args: unknown[];
}

interface FakeAuth {
  signUp?: (args: unknown) => Promise<unknown>;
  signInWithPassword?: (args: unknown) => Promise<unknown>;
  signOut?: () => Promise<unknown>;
  getSession?: () => Promise<unknown>;
}

/**
 * Client giả: mọi lời gọi trên query builder được ghi lại, và `await` builder trả về `result`.
 * Dùng để kiểm tra đúng bảng, đúng payload, đúng ánh xạ kết quả mà không cần Supabase thật.
 */
function fakeClient(result: { data?: unknown; error?: unknown } = {}, auth: FakeAuth = {}) {
  const calls: Call[] = [];
  const settled = { data: result.data ?? null, error: result.error ?? null };
  const builder: object = new Proxy(
    {},
    {
      get(_target, property: string) {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(settled);
        }
        return (...args: unknown[]) => {
          calls.push({ method: property, args });
          return builder;
        };
      },
    },
  );
  const client = {
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return builder;
    },
    auth,
  };
  return { client: client as unknown as AppSupabaseClient, calls };
}

const callOf = (calls: Call[], method: string) => calls.find((call) => call.method === method);

const UUID = "3f2b8a1e-5c4d-4e6f-9a0b-1c2d3e4f5a6b";

const eventRow: Tables<"events"> = {
  id: "e1",
  user_id: "u1",
  category_id: UUID,
  title: "Sinh nhật mẹ",
  note: null,
  calendar_type: "solar",
  day: 15,
  month: 3,
  year: 1965,
  is_leap_month: false,
  color: null,
  icon: null,
  remind_days_before: [0, 7],
  next_occurrence: "2027-03-15",
  created_at: "2026-10-06T00:00:00Z",
  updated_at: "2026-10-06T00:00:00Z",
};

const categoryRow: Tables<"categories"> = {
  id: "c1",
  user_id: "u1",
  name: null,
  default_key: "birthday",
  color: "rose",
  icon: "cake",
  created_at: "2026-10-06T00:00:00Z",
};

const profileRow: Tables<"profiles"> = {
  id: "u1",
  display_name: "Minh",
  language: "vi",
  theme: "dark",
  timezone: "Asia/Ho_Chi_Minh",
};

describe("ánh xạ dòng DB sang kiểu UI", () => {
  it("mapEventRow đổi snake_case sang camelCase", () => {
    expect(mapEventRow(eventRow)).toEqual({
      id: "e1",
      categoryId: UUID,
      title: "Sinh nhật mẹ",
      note: null,
      calendarType: "solar",
      day: 15,
      month: 3,
      year: 1965,
      isLeapMonth: false,
      color: null,
      icon: null,
      remindDaysBefore: [0, 7],
      nextOccurrence: "2027-03-15",
      createdAt: "2026-10-06T00:00:00Z",
      updatedAt: "2026-10-06T00:00:00Z",
    });
  });

  it("calendar_type lạ thì coi là dương lịch", () => {
    expect(mapEventRow({ ...eventRow, calendar_type: "julian" }).calendarType).toBe("solar");
    expect(mapEventRow({ ...eventRow, calendar_type: "lunar" }).calendarType).toBe("lunar");
  });

  it("mapCategoryRow giữ default_key để dịch ở client", () => {
    expect(mapCategoryRow(categoryRow)).toMatchObject({ name: null, defaultKey: "birthday" });
  });

  it("mapProfileRow chuẩn hóa giá trị lạ về mặc định", () => {
    expect(mapProfileRow(profileRow)).toEqual({
      id: "u1",
      displayName: "Minh",
      language: "vi",
      theme: "dark",
      timezone: "Asia/Ho_Chi_Minh",
    });
    const odd = mapProfileRow({ ...profileRow, language: "fr", theme: "blue" });
    expect(odd.language).toBe("en");
    expect(odd.theme).toBe("system");
  });

  it("profilePatchToRow chỉ đưa vào trường có trong patch", () => {
    expect(profilePatchToRow({})).toEqual({});
    expect(profilePatchToRow({ theme: "dark" })).toEqual({ theme: "dark" });
    expect(profilePatchToRow({ displayName: null, language: "vi" })).toEqual({
      display_name: null,
      language: "vi",
    });
  });
});

describe("events", () => {
  it("listEvents đọc bảng events, sắp theo ngày kế tiếp và map kết quả", async () => {
    const { client, calls } = fakeClient({ data: [eventRow] });
    const events = await listEvents(client);
    expect(callOf(calls, "from")?.args).toEqual(["events"]);
    expect(calls.filter((call) => call.method === "order")).toHaveLength(2);
    expect(events[0]?.title).toBe("Sinh nhật mẹ");
    expect(events[0]?.categoryId).toBe(UUID);
  });

  it("listEvents ném ApiError khi DB trả lỗi", async () => {
    const { client } = fakeClient({ error: { code: "42501", message: "denied" } });
    await expect(listEvents(client)).rejects.toMatchObject({
      name: "ApiError",
      kind: "database",
      messageKey: "errors.permissionDenied",
    });
  });

  it("getEvent không thấy dòng thì báo notFound", async () => {
    const { client, calls } = fakeClient({ error: { code: "PGRST116", message: "no rows" } });
    await expect(getEvent(client, "e1")).rejects.toMatchObject({ messageKey: "errors.notFound" });
    expect(callOf(calls, "eq")?.args).toEqual(["id", "e1"]);
  });

  it("createEvent gửi payload snake_case đã chuẩn hóa, không có user_id và next_occurrence", async () => {
    const { client, calls } = fakeClient({ data: eventRow });
    const created = await createEvent(client, {
      title: "  Sinh nhật mẹ ",
      day: 15,
      month: 3,
      year: 1965,
      categoryId: UUID,
      remindDaysBefore: [7, 0, 7],
    });
    const payload = callOf(calls, "insert")?.args[0] as Record<string, unknown>;
    expect(payload).toEqual({
      title: "Sinh nhật mẹ",
      note: null,
      calendar_type: "solar",
      day: 15,
      month: 3,
      year: 1965,
      is_leap_month: false,
      category_id: UUID,
      color: null,
      icon: null,
      remind_days_before: [0, 7],
    });
    expect(payload).not.toHaveProperty("user_id");
    expect(payload).not.toHaveProperty("next_occurrence");
    expect(created.id).toBe("e1");
  });

  it("createEvent từ chối dữ liệu sai trước khi gọi DB", async () => {
    const { client, calls } = fakeClient({ data: eventRow });
    const attempt = createEvent(client, { title: "   ", day: 31, month: 4 });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({
      kind: "validation",
      messageKey: "errors.invalidData",
    });
    expect(calls).toHaveLength(0);
  });

  it("sự kiện âm lịch: next_occurrence là null nếu chưa quy đổi, hoặc giá trị được truyền vào", async () => {
    const lunarInput = { title: "Giỗ ông", day: 10, month: 3, calendarType: "lunar" as const };

    const first = fakeClient({ data: { ...eventRow, calendar_type: "lunar" } });
    await createEvent(first.client, lunarInput);
    expect(callOf(first.calls, "insert")?.args[0]).toMatchObject({
      calendar_type: "lunar",
      next_occurrence: null,
    });

    const second = fakeClient({ data: { ...eventRow, calendar_type: "lunar" } });
    await createEvent(second.client, lunarInput, {
      lunarNextOccurrence: { year: 2027, month: 4, day: 17 },
    });
    expect(callOf(second.calls, "insert")?.args[0]).toMatchObject({
      next_occurrence: "2027-04-17",
    });
  });

  it("updateEvent cập nhật theo id", async () => {
    const { client, calls } = fakeClient({ data: eventRow });
    await updateEvent(client, "e1", { title: "Mới", day: 1, month: 1 });
    expect(callOf(calls, "update")?.args[0]).toMatchObject({ title: "Mới", day: 1, month: 1 });
    expect(callOf(calls, "eq")?.args).toEqual(["id", "e1"]);
  });

  it("deleteEvent xóa theo id và báo lỗi nếu DB lỗi", async () => {
    const ok = fakeClient();
    await deleteEvent(ok.client, "e1");
    expect(callOf(ok.calls, "delete")).toBeDefined();
    expect(callOf(ok.calls, "eq")?.args).toEqual(["id", "e1"]);

    const bad = fakeClient({ error: { code: "42501", message: "denied" } });
    await expect(deleteEvent(bad.client, "e1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("categories", () => {
  it("listCategories map kết quả", async () => {
    const { client, calls } = fakeClient({ data: [categoryRow] });
    const categories = await listCategories(client);
    expect(callOf(calls, "from")?.args).toEqual(["categories"]);
    expect(categories[0]).toMatchObject({ defaultKey: "birthday", color: "rose" });
  });

  it("createCategory và updateCategory gửi tên, màu, icon đã chuẩn hóa", async () => {
    const created = fakeClient({ data: { ...categoryRow, name: "Du lịch", default_key: null } });
    await createCategory(created.client, { name: " Du lịch ", color: "sky", icon: "plane" });
    expect(callOf(created.calls, "insert")?.args[0]).toEqual({
      name: "Du lịch",
      color: "sky",
      icon: "plane",
    });

    const updated = fakeClient({ data: categoryRow });
    await updateCategory(updated.client, "c1", { name: "Sinh nhật" });
    expect(callOf(updated.calls, "update")?.args[0]).toEqual({
      name: "Sinh nhật",
      color: "indigo",
      icon: "tag",
    });
    expect(callOf(updated.calls, "eq")?.args).toEqual(["id", "c1"]);
  });

  it("updateCategoryAppearance chỉ gửi màu và icon, không đụng vào tên", async () => {
    const { client, calls } = fakeClient({ data: categoryRow });
    await updateCategoryAppearance(client, "c1", { color: "teal", icon: "gift" });
    expect(callOf(calls, "update")?.args[0]).toEqual({ color: "teal", icon: "gift" });
    expect(callOf(calls, "eq")?.args).toEqual(["id", "c1"]);
  });

  it("createCategory từ chối tên rỗng, trùng khóa duy nhất báo duplicate", async () => {
    const empty = fakeClient();
    await expect(createCategory(empty.client, { name: " " })).rejects.toMatchObject({
      kind: "validation",
    });
    const duplicate = fakeClient({ error: { code: "23505", message: "dup" } });
    await expect(createCategory(duplicate.client, { name: "A" })).rejects.toMatchObject({
      messageKey: "errors.duplicate",
    });
  });

  it("deleteCategory xóa theo id", async () => {
    const { client, calls } = fakeClient();
    await deleteCategory(client, "c1");
    expect(callOf(calls, "eq")?.args).toEqual(["id", "c1"]);
  });
});

describe("profile", () => {
  it("getProfile đọc theo id", async () => {
    const { client, calls } = fakeClient({ data: profileRow });
    const profile = await getProfile(client, "u1");
    expect(callOf(calls, "eq")?.args).toEqual(["id", "u1"]);
    expect(profile.language).toBe("vi");
  });

  it("updateProfile chỉ gửi trường có trong patch", async () => {
    const { client, calls } = fakeClient({ data: profileRow });
    await updateProfile(client, "u1", { theme: "dark" });
    expect(callOf(calls, "update")?.args[0]).toEqual({ theme: "dark" });
    expect(callOf(calls, "eq")?.args).toEqual(["id", "u1"]);
  });

  it("patch rỗng thì chỉ đọc, không ghi", async () => {
    const { client, calls } = fakeClient({ data: profileRow });
    await updateProfile(client, "u1", {});
    expect(callOf(calls, "update")).toBeUndefined();
    expect(callOf(calls, "select")).toBeDefined();
  });

  it("updateProfile từ chối giá trị sai", async () => {
    const { client, calls } = fakeClient({ data: profileRow });
    await expect(
      updateProfile(client, "u1", { language: "fr" } as unknown as { language: "vi" }),
    ).rejects.toMatchObject({ kind: "validation" });
    expect(calls).toHaveLength(0);
  });
});

describe("auth", () => {
  it("signUp gửi display_name và language qua metadata, chuẩn hóa email", async () => {
    let received: unknown;
    const { client } = fakeClient(
      {},
      {
        signUp: async (args) => {
          received = args;
          return { data: { user: { id: "u1", identities: [{}] }, session: null }, error: null };
        },
      },
    );
    const result = await signUpWithEmail(client, {
      email: " Minh@Example.com ",
      password: "matkhau123",
      displayName: "Minh",
      language: "vi",
    });
    expect(received).toEqual({
      email: "minh@example.com",
      password: "matkhau123",
      options: { data: { display_name: "Minh", language: "vi" } },
    });
    expect(result).toEqual({ userId: "u1", needsEmailConfirmation: true });
  });

  it("signUp không gửi metadata thừa và nhận biết đã có phiên đăng nhập", async () => {
    let received: { options: { data: unknown } } | undefined;
    const { client } = fakeClient(
      {},
      {
        signUp: async (args) => {
          received = args as { options: { data: unknown } };
          return {
            data: { user: { id: "u1", identities: [{}] }, session: { access_token: "t" } },
            error: null,
          };
        },
      },
    );
    const result = await signUpWithEmail(client, { email: "a@b.co", password: "matkhau123" });
    expect(received?.options.data).toEqual({});
    expect(result.needsEmailConfirmation).toBe(false);
  });

  it("signUp báo email đã tồn tại khi Supabase trả user giả (identities rỗng)", async () => {
    const { client } = fakeClient(
      {},
      {
        signUp: async () => ({
          data: { user: { id: "fake", identities: [] }, session: null },
          error: null,
        }),
      },
    );
    await expect(
      signUpWithEmail(client, { email: "a@b.co", password: "matkhau123" }),
    ).rejects.toMatchObject({ kind: "auth", messageKey: "errors.auth.userExists" });
  });

  it("signUp từ chối mật khẩu ngắn trước khi gọi mạng", async () => {
    let called = false;
    const { client } = fakeClient(
      {},
      {
        signUp: async () => {
          called = true;
          return { data: {}, error: null };
        },
      },
    );
    await expect(
      signUpWithEmail(client, { email: "a@b.co", password: "123" }),
    ).rejects.toMatchObject({
      kind: "validation",
    });
    expect(called).toBe(false);
  });

  it("signIn map lỗi sai mật khẩu sang key i18n", async () => {
    const { client } = fakeClient(
      {},
      {
        signInWithPassword: async () => ({
          data: { user: null },
          error: { code: "invalid_credentials", message: "Invalid login credentials", status: 400 },
        }),
      },
    );
    await expect(
      signInWithEmail(client, { email: "a@b.co", password: "sai" }),
    ).rejects.toMatchObject({ kind: "auth", messageKey: "errors.auth.invalidCredentials" });
  });

  it("signIn thành công trả về userId", async () => {
    const { client } = fakeClient(
      {},
      { signInWithPassword: async () => ({ data: { user: { id: "u1" } }, error: null }) },
    );
    await expect(signInWithEmail(client, { email: "a@b.co", password: "x" })).resolves.toEqual({
      userId: "u1",
    });
  });

  it("signOut và getCurrentUserId", async () => {
    const out = fakeClient({}, { signOut: async () => ({ error: null }) });
    await expect(signOut(out.client)).resolves.toBeUndefined();

    const withSession = fakeClient(
      {},
      { getSession: async () => ({ data: { session: { user: { id: "u1" } } }, error: null }) },
    );
    await expect(getCurrentUserId(withSession.client)).resolves.toBe("u1");

    const withoutSession = fakeClient(
      {},
      { getSession: async () => ({ data: { session: null }, error: null }) },
    );
    await expect(getCurrentUserId(withoutSession.client)).resolves.toBeNull();
  });
});

describe("ánh xạ lỗi", () => {
  it.each([
    ["PGRST116", "errors.notFound"],
    ["42501", "errors.permissionDenied"],
    ["23505", "errors.duplicate"],
    ["23514", "errors.invalidData"],
    ["23503", "errors.invalidData"],
    ["22P02", "errors.invalidData"],
    ["XX000", "errors.generic"],
  ])("lỗi DB %s -> %s", (code, key) => {
    expect(toDatabaseError({ code, message: "x" }).messageKey).toBe(key);
  });

  it("nhận biết mất mạng", () => {
    const error = toDatabaseError({ code: "", message: "TypeError: Failed to fetch" });
    expect(error.kind).toBe("network");
    expect(error.messageKey).toBe("errors.network");
    expect(toAuthError({ message: "fetch failed" }).messageKey).toBe("errors.network");
  });

  it("lỗi Auth theo mã và theo HTTP 429", () => {
    expect(toAuthError({ code: "email_not_confirmed" }).messageKey).toBe(
      "errors.auth.emailNotConfirmed",
    );
    expect(toAuthError({ code: "weak_password" }).messageKey).toBe("errors.auth.weakPassword");
    expect(toAuthError({ status: 429, message: "slow down" }).messageKey).toBe(
      "errors.auth.rateLimited",
    );
    expect(toAuthError({ code: "unknown_thing", message: "?" }).messageKey).toBe("errors.generic");
  });

  it("getErrorMessageKey xử lý cả lỗi không phải ApiError", () => {
    expect(getErrorMessageKey(new ApiError("unknown", "errors.notFound"))).toBe("errors.notFound");
    expect(getErrorMessageKey(new Error("boom"))).toBe("errors.generic");
    expect(getErrorMessageKey("x")).toBe("errors.generic");
  });
});

function fakeJwt(role: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role })}.signature`;
}

describe("chặn khóa bí mật ở client", () => {
  it("từ chối service_role (JWT) và sb_secret_", () => {
    expect(() => assertClientSafeKey(fakeJwt("service_role"))).toThrow(/khóa bí mật/);
    expect(() => assertClientSafeKey("sb_secret_abc123")).toThrow(/khóa bí mật/);
  });

  it("chấp nhận anon JWT và publishable key", () => {
    expect(() => assertClientSafeKey(fakeJwt("anon"))).not.toThrow();
    expect(() => assertClientSafeKey("sb_publishable_abc123")).not.toThrow();
    expect(() => assertClientSafeKey("khong-phai-jwt")).not.toThrow();
  });

  it("parseSupabaseEnv kiểm tra cấu hình", () => {
    expect(
      parseSupabaseEnv({ url: " https://abc.supabase.co ", anonKey: "sb_publishable_abc" }),
    ).toEqual({ url: "https://abc.supabase.co", anonKey: "sb_publishable_abc" });
    expect(() => parseSupabaseEnv({ anonKey: "sb_publishable_abc" })).toThrow(/SUPABASE_URL/);
    expect(() => parseSupabaseEnv({ url: "https://abc.supabase.co" })).toThrow(/anon/);
    expect(() =>
      parseSupabaseEnv({ url: "https://abc.supabase.co", anonKey: fakeJwt("service_role") }),
    ).toThrow(/khóa bí mật/);
  });
});

describe("queryKeys", () => {
  it("khóa chi tiết nằm dưới khóa gốc để invalidate theo nhóm", () => {
    expect(queryKeys.events.list()[0]).toBe(queryKeys.events.all[0]);
    expect(queryKeys.events.detail("e1")).toEqual(["events", "detail", "e1"]);
    expect(queryKeys.categories.list()[0]).toBe(queryKeys.categories.all[0]);
    expect(queryKeys.profile.detail("u1")).toEqual(["profile", "u1"]);
  });
});
