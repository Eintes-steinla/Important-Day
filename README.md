# Ngày quan trọng (Important Dates)

Ứng dụng lưu và nhắc các ngày quan trọng (sinh nhật, kỷ niệm, ngày giỗ, hạn chót...). Web và mobile dùng chung dữ liệu qua Supabase.

> Trạng thái: **Phase 1** (database + RLS đã xong và có test). Chưa có logic ngày trong `core` hay giao diện thật.

## Cấu trúc

```
apps/
  web/        Vite + React + TypeScript + Tailwind + lucide-react
  mobile/     Expo (SDK 57, Expo Router) + NativeWind + lucide-react-native
packages/
  core/       i18n (locales vi/en), design tokens màu, logic theme, về sau: schema Zod, logic ngày
supabase/     migrations (schema, trigger, RLS, storage), test RLS bằng PGlite; Phase 5: edge functions
```

Web và mobile là hai app riêng (không dùng Expo universal). Logic không phụ thuộc giao diện đặt trong `packages/core`.

## Yêu cầu

- Node.js >= 20
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

Biến môi trường: sao chép `.env.example` thành `apps/web/.env` và `apps/mobile/.env`, điền Supabase URL và **anon key**. Không bao giờ đưa `service_role` key vào client. Cách dựng database và lấy URL, anon key: xem `supabase/README.md`.

## Lệnh hữu ích

| Lệnh             | Tác dụng                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm typecheck` | Kiểm tra TypeScript cho cả 3 package                              |
| `pnpm lint`      | ESLint toàn repo                                                  |
| `pnpm format`    | Prettier ghi đè; `pnpm format:check` để kiểm tra                  |
| `pnpm test`      | Chạy Vitest (test RLS/DB; Phase 2 thêm test logic ngày)           |
| `pnpm build:web` | Build bản production cho web                                      |
| `pnpm gen:types` | Sinh type từ Supabase local vào `packages/core` (dùng từ Phase 1) |

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
- [ ] Phase 2: logic ngày/lặp + test, schema Zod, hàm gọi Supabase
- [ ] Phase 3: web app hoàn chỉnh theo MVP
- [ ] Phase 4: mobile app
- [ ] Phase 5: nhắc nhở, âm lịch thật, chia sẻ lịch, ảnh đính kèm
