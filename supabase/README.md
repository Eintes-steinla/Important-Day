# Supabase

Database, Auth, Storage và Row Level Security cho "Ngày quan trọng". Không có server Node riêng: web và mobile gọi thẳng Supabase bằng **anon key**; bảo mật dựa vào RLS.

## Migration

| File                                    | Nội dung                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `20261006000100_schema.sql`             | Bảng `profiles`, `categories`, `events`, ràng buộc, index                                   |
| `20261006000200_functions_triggers.sql` | Tạo profile + danh mục mặc định khi đăng ký, tính `next_occurrence`, `updated_at`, backfill |
| `20261006000300_rls.sql`                | Bật RLS mọi bảng, policy theo `auth.uid()`                                                  |
| `20261006000400_storage.sql`            | Bucket `attachments` (private) và policy theo thư mục `{uid}/`                              |

## Chạy với Supabase local

Cần Docker và [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase init          # chỉ lần đầu, sinh supabase/config.toml (không đụng vào migrations)
supabase start         # khởi động Postgres, Auth, Storage local
supabase db reset      # áp dụng toàn bộ migration từ đầu
pnpm gen:types         # sinh lại packages/core/src/database.types.ts từ DB local
```

Lấy `API URL` và `anon key` từ kết quả `supabase start` để điền vào `.env` của web/mobile.

## Đưa lên project Supabase (cloud)

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
# Sinh type từ project cloud (thay cho pnpm gen:types):
supabase gen types typescript --project-id <project-ref> > packages/core/src/database.types.ts
```

Chỉ dùng **anon key** trong web/mobile. `service_role` key bỏ qua RLS, không bao giờ đưa vào client.

## Kiểm tra RLS và logic DB

```bash
pnpm --filter @important-dates/supabase test      # hoặc pnpm test ở thư mục gốc
```

Test chạy Postgres thật bằng [PGlite](https://pglite.dev) (WASM), **không cần Docker**: nạp `tests/support/supabase-shim.sql` (giả lập role `anon`/`authenticated`, `auth.users`, `auth.uid()`, `storage.objects`) rồi chạy toàn bộ migration và các kịch bản:

- `tests/rls.test.ts`: user A không đọc/sửa/xóa/tạo dữ liệu của user B ở `profiles`, `categories`, `events`, storage; không gắn sự kiện vào danh mục của người khác; anon không truy cập được gì; user không gọi được hàm `SECURITY DEFINER`.
- `tests/schema.test.ts`: trigger đăng ký, ràng buộc ngày (29/2, âm lịch, năm nhuận), `remind_days_before`, `next_occurrence` (năm nhuận, 29/2, sự kiện đã qua, chuyển năm 31/12 → 1/1, có/không có năm, múi giờ).

Giới hạn: shim chỉ bám hành vi của Supabase ở mức đủ để kiểm tra policy và trigger của repo này. Sau khi `supabase db reset`, nên thử nhanh một lần trên Supabase thật (đăng ký 2 user ở web, xác nhận không thấy dữ liệu của nhau).

## Quyết định thiết kế

- **Danh mục mặc định dịch được:** cột thêm `categories.default_key` (`birthday`, `anniversary`, `memorial`, `deadline`), `name` để `null`. Client hiển thị `t("categories.default.<default_key>")`; khi người dùng đổi tên thì ghi vào `name`.
- **Màu lưu theo khóa:** `color` là khóa trong bảng `eventColors` của `packages/core` (vd `rose`), không phải hex, để mỗi theme tự chọn cặp nền/chữ đủ tương phản.
- **`next_occurrence`:** dương lịch do trigger tự tính theo múi giờ trong `profiles.timezone` (29/2 ở năm không nhuận dời về 28/2). Âm lịch giữ giá trị được cung cấp, quy đổi thật làm ở Phase 5. Logic SQL (`compute_next_occurrence`) phải khớp `getNextOccurrence` ở `packages/core` (Phase 2); giá trị này sẽ cũ dần theo thời gian nên Phase 5 cần job làm mới định kỳ.
- **Sự kiện có năm ở tương lai** (vd đám cưới năm sau): lần kế tiếp là chính ngày đó; năm đã qua thì lặp hằng năm.
- **Toàn vẹn chéo user:** policy của `events` yêu cầu `category_id` phải thuộc về chính user.
- **Đăng ký:** truyền `options.data = { display_name, language }` khi `supabase.auth.signUp` để profile nhận đúng ngôn ngữ ngay từ đầu (mặc định `en`).
- Ba hàm `SECURITY DEFINER` đã bị thu hồi quyền thực thi của `anon`/`authenticated`.
