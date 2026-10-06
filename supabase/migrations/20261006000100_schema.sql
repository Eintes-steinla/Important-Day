-- Phase 1 / 1: bảng, ràng buộc, index.
-- Ngày sự kiện lưu dạng day/month/year (không dùng timestamp) để tránh lỗi múi giờ.

-- ---------------------------------------------------------------------------
-- profiles: 1 dòng cho mỗi user (id = auth.users.id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or length(display_name) <= 100),
  language text not null default 'en' check (language in ('vi', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  timezone text not null default 'UTC'
);

comment on table public.profiles is 'Thiết lập cá nhân của người dùng, tạo tự động khi đăng ký.';

-- ---------------------------------------------------------------------------
-- categories: danh mục của từng user
-- ---------------------------------------------------------------------------
-- Danh mục mặc định có default_key (vd "birthday") và name = null: client dịch theo
-- locale bằng khóa categories.default.<default_key>. Khi người dùng đổi tên thì name được ghi.
-- color lưu KHÓA màu trong bảng eventColors của packages/core (vd "rose"), không lưu hex,
-- để mỗi theme tự chọn cặp nền/chữ đủ tương phản.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid () references auth.users (id) on delete cascade,
  name text,
  default_key text,
  color text not null default 'indigo' check (length(color) between 1 and 32),
  icon text not null default 'tag' check (length(icon) between 1 and 64),
  created_at timestamptz not null default now(),
  constraint categories_name_or_default_key check (name is not null or default_key is not null),
  constraint categories_name_length check (name is null or length(btrim(name)) between 1 and 60)
);

comment on column public.categories.icon is 'Tên icon Lucide dạng chuỗi (vd "cake", "heart").';

create index categories_user_id_idx on public.categories (user_id);
-- Mỗi user chỉ có một danh mục mặc định cho mỗi default_key (seed idempotent)
create unique index categories_user_default_key_key
  on public.categories (user_id, default_key)
  where default_key is not null;

-- ---------------------------------------------------------------------------
-- events: sự kiện / ngày quan trọng
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid () references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 200),
  note text check (note is null or length(note) <= 5000),
  calendar_type text not null default 'solar' check (calendar_type in ('solar', 'lunar')),
  day smallint not null,
  month smallint not null,
  year integer check (year is null or year between 1 and 9999),
  is_leap_month boolean not null default false,
  color text check (color is null or length(color) between 1 and 32),
  icon text check (icon is null or length(icon) between 1 and 64),
  remind_days_before integer[] not null default '{0}',
  next_occurrence date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Dương lịch: ngày không vượt quá số ngày tối đa của tháng (tháng 2 cho phép 29).
  -- Âm lịch: tháng có 29 hoặc 30 ngày nên chỉ giới hạn <= 30.
  constraint events_date_valid check (
    month between 1 and 12
    and day between 1 and 31
    and case calendar_type
      when 'lunar' then day <= 30
      else day <= case month
        when 2 then 29
        when 4 then 30
        when 6 then 30
        when 9 then 30
        when 11 then 30
        else 31
      end
    end
  ),
  -- Dương lịch có năm cụ thể thì 29/2 chỉ hợp lệ ở năm nhuận
  constraint events_feb29_leap_year check (
    not (
      calendar_type = 'solar'
      and year is not null
      and month = 2
      and day = 29
      and not (year % 4 = 0 and (year % 100 <> 0 or year % 400 = 0))
    )
  ),
  -- Tháng nhuận chỉ có ý nghĩa với âm lịch
  constraint events_leap_month_lunar_only check (not is_leap_month or calendar_type = 'lunar'),
  -- Nhắc trước 0..365 ngày, tối đa 10 mốc
  constraint events_remind_days_valid check (
    cardinality(remind_days_before) <= 10
    and 0 <= all (remind_days_before)
    and 365 >= all (remind_days_before)
  )
);

comment on column public.events.next_occurrence is
  'Lần xuất hiện kế tiếp (dương lịch). Dương lịch: trigger tự tính. Âm lịch: client/job ghi sau khi quy đổi (Phase 5).';
comment on column public.events.icon is 'Tên icon Lucide dạng chuỗi (vd "cake", "heart", "gift").';

create index events_user_id_next_occurrence_idx on public.events (user_id, next_occurrence);
create index events_user_id_month_day_idx on public.events (user_id, month, day);
create index events_category_id_idx on public.events (category_id);
