# Ngày quan trọng (Important Dates)

Ứng dụng lưu và nhắc các ngày quan trọng (sinh nhật, kỷ niệm, ngày giỗ, hạn chót...). Web và mobile dùng chung dữ liệu qua Supabase.

> Trạng thái: **Phase 4** (web và mobile đều hoàn chỉnh theo MVP). Nhắc nhở, âm lịch thật, chia sẻ (Phase 5) chưa làm.

## Cấu trúc

```
apps/
  web/        Vite + React + TypeScript + Tailwind + lucide-react
  mobile/     Expo (SDK 57, Expo Router) + NativeWind + lucide-react-native
packages/
  core/       logic ngày/lặp, schema Zod, hàm gọi Supabase, locales vi/en, design tokens màu, theme
supabase/     migrations (schema, trigger, RLS, storage), test RLS bằng PGlite; Phase 5: edge functions
```

Web và mobile là hai app riêng (không dùng Expo universal). Logic không phụ thuộc giao diện đặt trong `packages/core`.

## Yêu cầu

- Node.js >= 22 (`@supabase/supabase-js` mới yêu cầu từ Node 22)
- pnpm 9 (`npm i -g pnpm@9.12.0`)
- Mobile: app **Expo Go** trên điện thoại, hoặc Android Studio / Xcode để chạy emulator

## Cài đặt và chạy

```bash
pnpm install

# Web
pnpm dev:web          # http://localhost:5173

# Mobile
pnpm dev:mobile       # quét QR bằng Expo Go
```

Biến môi trường: sao chép `.env.example` thành `apps/web/.env` và `apps/mobile/.env`, điền Supabase URL và khóa công khai (**publishable key** `sb_publishable_...` hoặc anon key cũ, dán vào `...ANON_KEY`). Không bao giờ đưa `service_role` key vào client. Cách dựng database và lấy URL, anon key: xem `supabase/README.md`.

## Lệnh hữu ích

| Lệnh             | Tác dụng                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm typecheck` | Kiểm tra TypeScript cho cả 3 package                              |
| `pnpm lint`      | ESLint toàn repo                                                  |
| `pnpm format`    | Prettier ghi đè; `pnpm format:check` để kiểm tra                  |
| `pnpm test`      | Chạy Vitest (logic ngày, schema, API, locales, RLS/DB)            |
| `pnpm build:web` | Build bản production cho web                                      |
| `pnpm gen:types` | Sinh type từ Supabase local vào `packages/core` (dùng từ Phase 1) |

## packages/core

Mọi logic không phụ thuộc giao diện nằm ở đây, web và mobile dùng chung (`import { ... } from "@important-dates/core"`).

| Thư mục         | Nội dung                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/date/`     | `PlainDate` (ngày không múi giờ), `getNextOccurrence`, `listOccurrencesInRange` (lịch tháng), `daysUntil`, `getYearsSince`, 29/2, chỗ cắm âm lịch `lunarToSolar`, múi giờ, format theo locale |
| `src/schemas/`  | Schema Zod: sự kiện, danh mục, profile, đăng nhập/đăng ký. Quy tắc khớp ràng buộc ở DB                                                                                                        |
| `src/api/`      | Hàm gọi Supabase (CRUD sự kiện/danh mục, profile, auth), mapper, lỗi thống nhất, query keys                                                                                                   |
| `locales/`      | `vi.json`, `en.json`                                                                                                                                                                          |
| `src/tokens.ts` | Design tokens màu, bảng màu sự kiện (đã kiểm tra tương phản WCAG AA ở cả light và dark)                                                                                                       |

Quy ước cần nhớ:

- **Ngày** luôn là `PlainDate` `{ year, month, day }` hoặc chuỗi `YYYY-MM-DD`, không dùng `Date`/timestamp để tránh lệch múi giờ. "Hôm nay" lấy bằng `todayInTimeZone(profile.timezone)` để khớp cách DB tính `next_occurrence`.
- **Lỗi validation** của Zod là key i18n: hiển thị bằng `t(issue.message)`. **Lỗi API** là `ApiError`: hiển thị bằng `t(getErrorMessageKey(error))`.
- **Client Supabase** do từng app tạo bằng `createAppSupabaseClient` rồi truyền vào các hàm `listEvents(client)`, `createEvent(client, input)`... (mobile truyền thêm `storage` cho phiên đăng nhập). `parseSupabaseEnv` kiểm tra biến môi trường và từ chối khóa `service_role`.
- **Logic ngày ở hai nơi** (hàm SQL `compute_next_occurrence` và `getNextOccurrence`) phải khớp nhau: `supabase/tests/parity.test.ts` đối chiếu hơn 48 nghìn tổ hợp. Sửa một bên thì chạy `pnpm test`.
- **Âm lịch:** chưa có bộ quy đổi thật. Khi có, gọi `setLunarConverter(...)` một lần lúc khởi động app (Phase 5).
- **Múi giờ:** `profiles.timezone` mặc định là `UTC` vì lúc đăng ký DB chưa biết múi giờ của người dùng. Web (`AppShell`) và mobile (`app/(app)/_layout.tsx`) đã tự làm việc này ở lần đăng nhập đầu, bằng `updateProfile(client, userId, { timezone: detectTimeZone() })`, nếu không `next_occurrence` do DB tính sẽ lệch ngày với giờ địa phương (giao diện vẫn đúng vì tính bằng `todayInTimeZone`).

```ts
import {
  createAppSupabaseClient,
  parseSupabaseEnv,
  listEvents,
  getNextOccurrence,
  daysUntil,
  todayInTimeZone,
  getCountdownLabel,
} from "@important-dates/core";

const client = createAppSupabaseClient(parseSupabaseEnv({ url, anonKey }));
const today = todayInTimeZone(profile.timezone);
for (const event of await listEvents(client)) {
  const next = getNextOccurrence(event, today); // null với âm lịch chưa quy đổi được
  if (next) console.log(event.title, getCountdownLabel(daysUntil(next, today), t));
}
```

## apps/web

Chạy: `pnpm dev:web` (cần `apps/web/.env`, thiếu thì app hiện màn hình hướng dẫn thay vì trang trắng).

| Thư mục           | Nội dung                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `src/providers/`  | Supabase, phiên đăng nhập, theme/ngôn ngữ, thông báo (toast), React Query                      |
| `src/hooks/`      | Truy vấn và mutation dùng hàm của `packages/core`, `useToday` (theo múi giờ của profile)       |
| `src/components/` | Lịch tháng, danh sách "Sắp tới", form sự kiện/danh mục, hộp thoại, bộ chọn màu/icon, khung app |
| `src/pages/`      | Đăng nhập/đăng ký, Trang chủ, Danh mục, Cài đặt, 404, hướng dẫn cấu hình                       |

Lưu ý khi triển khai: web dùng `BrowserRouter` nên host phải trả `index.html` cho mọi đường dẫn (SPA fallback), ví dụ Netlify `/* /index.html 200`, Vercel `rewrites`.

## apps/mobile

Chạy: `pnpm dev:mobile`, quét QR bằng Expo Go (cần `apps/mobile/.env`, thiếu thì app hiện màn hình hướng dẫn). Cấu trúc giống web: Expo Router với nhóm `(auth)` (đăng nhập, đăng ký) và `(app)` (3 tab Trang chủ, Danh mục, Cài đặt cùng hai màn hình modal form sự kiện/danh mục). Route được bảo vệ bằng `Stack.Protected` theo phiên đăng nhập.

| Thư mục           | Nội dung                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `app/`            | Route của Expo Router (mỏng, chỉ trỏ tới `src/screens`)                                              |
| `src/screens/`    | Màn hình: đăng nhập/đăng ký, Trang chủ, Danh mục, Cài đặt, form sự kiện/danh mục, hướng dẫn cấu hình |
| `src/components/` | Lịch tháng, "Sắp tới", tờ lịch (`EventLeaf`), bộ chọn màu/icon, ô nhập, nút                          |
| `src/providers/`  | Supabase, phiên đăng nhập (lưu bằng AsyncStorage), theme/ngôn ngữ, thông báo                         |

Ghi chú: phiên đăng nhập lưu bằng AsyncStorage (khuyến nghị của Supabase, vì phiên vượt giới hạn 2KB của SecureStore). Font nạp bằng `expo-font`, mỗi độ đậm là một family riêng (xem `tailwind.config.js`). `src/hooks/queries.ts` có cùng cấu trúc với bản web và dùng chung `queryKeys` của core.

## Đa ngôn ngữ

- File dịch: `packages/core/locales/{vi,en}.json`, key phân cấp (`settings.theme.dark`...).
- Mọi chuỗi hiển thị đi qua `t()`, không hard-code trong component.
- Ngôn ngữ mặc định theo trình duyệt/thiết bị (vi hoặc en, còn lại fallback `en`).
- Số nhiều dùng hậu tố `_one` / `_other` của i18next (tiếng Việt để hai bản giống nhau).

## Dark / Light

- Ba lựa chọn: Light, Dark, System (mặc định System).
- Design tokens màu định nghĩa một lần ở `packages/core/src/tokens.ts`.
- Web: Tailwind `darkMode: 'class'`, token đổ vào CSS variables; `index.html` có script áp theme trước khi render để không bị nháy sáng.
- Mobile: NativeWind `darkMode: 'class'`, token áp qua `vars()` trong `ThemeProvider`.
- Bảng `eventColors` có sẵn cặp `bg`/`fg` riêng cho light và dark.

## Ghi chú kỹ thuật

- `.npmrc` đặt `node-linker=hoisted` vì Metro (React Native) không resolve tốt với cấu trúc symlink mặc định của pnpm.
- Phiên bản các package native của mobile bám theo bảng chính thức của Expo SDK 57 (`node_modules/expo/bundledNativeModules.json`). Khi nâng SDK, chạy `npx expo install --fix` trong `apps/mobile`.
- Web đã dùng React 19.2.3, cùng phiên bản với mobile để tránh hai bản React trong một repo.

## Lộ trình

- [x] Phase 0: khung monorepo, TS/ESLint/Prettier, Tailwind, NativeWind, i18n, theme
- [x] Phase 1: migration SQL, RLS, trigger, seed danh mục, kịch bản kiểm tra RLS
- [x] Phase 2: logic ngày/lặp + test, schema Zod, hàm gọi Supabase
- [x] Phase 3: web app hoàn chỉnh theo MVP
- [x] Phase 4: mobile app
- [ ] Phase 5: nhắc nhở, âm lịch thật, chia sẻ lịch, ảnh đính kèm
