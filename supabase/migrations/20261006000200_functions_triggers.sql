-- Phase 1 / 2: hàm và trigger.

-- ---------------------------------------------------------------------------
-- Tính ngày xuất hiện của sự kiện dương lịch
-- ---------------------------------------------------------------------------

-- Ngày (day, month) trong một năm cụ thể. Ngày vượt quá số ngày của tháng thì dời về
-- ngày cuối tháng: 29/2 ở năm không nhuận -> 28/2.
create or replace function public.occurrence_in_year(p_day integer, p_month integer, p_year integer)
returns date
language sql
immutable
parallel safe
set search_path = ''
as $$
  select make_date(
    p_year,
    p_month,
    least(
      p_day,
      extract(day from (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day'))::integer
    )
  );
$$;

-- Lần xuất hiện kế tiếp (tính cả hôm nay) của sự kiện lặp hằng năm.
-- - Không có năm, hoặc năm đã qua: lặp mỗi năm, lấy lần gần nhất >= p_today.
-- - Năm ở tương lai: chính ngày đó là lần kế tiếp (vd cưới vào năm sau).
-- Logic này phải khớp với getNextOccurrence trong packages/core (Phase 2).
create or replace function public.compute_next_occurrence(
  p_day integer,
  p_month integer,
  p_year integer,
  p_today date
)
returns date
language sql
immutable
parallel safe
set search_path = ''
as $$
  with base as (
    select greatest(
      extract(year from p_today)::integer,
      coalesce(p_year, extract(year from p_today)::integer)
    ) as y
  ),
  candidate as (
    select y, public.occurrence_in_year(p_day, p_month, y) as d from base
  )
  select case
    when d >= p_today then d
    else public.occurrence_in_year(p_day, p_month, y + 1)
  end
  from candidate;
$$;

-- ---------------------------------------------------------------------------
-- events: cập nhật updated_at và next_occurrence trước khi ghi
-- ---------------------------------------------------------------------------
create or replace function public.events_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timezone text;
  v_today date;
begin
  new.updated_at := now();

  -- Âm lịch: giữ nguyên giá trị client/job cung cấp (quy đổi thật làm ở Phase 5).
  -- Trigger BEFORE chạy trước CHECK constraint, nên chỉ tính khi ngày/tháng/năm nằm trong
  -- khoảng hợp lệ; nếu không thì để constraint báo lỗi rõ ràng thay vì lỗi make_date.
  if new.calendar_type = 'solar'
    and new.month between 1 and 12
    and new.day between 1 and 31
    and (new.year is null or new.year between 1 and 9999)
  then
    select p.timezone into v_timezone from public.profiles p where p.id = new.user_id;
    begin
      v_today := (now() at time zone coalesce(v_timezone, 'UTC'))::date;
    exception when others then
      -- Múi giờ không hợp lệ thì dùng UTC thay vì làm hỏng thao tác ghi
      v_today := (now() at time zone 'UTC')::date;
    end;
    new.next_occurrence := public.compute_next_occurrence(new.day, new.month, new.year, v_today);
  end if;

  return new;
end;
$$;

create trigger events_before_write
before insert or update on public.events
for each row execute function public.events_before_write();

-- ---------------------------------------------------------------------------
-- Danh mục mặc định
-- ---------------------------------------------------------------------------
-- name = null, default_key dùng để dịch ở client (categories.default.<key> trong locales).
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, default_key, color, icon)
  values
    (p_user_id, 'birthday', 'rose', 'cake'),
    (p_user_id, 'anniversary', 'purple', 'heart'),
    (p_user_id, 'memorial', 'indigo', 'flower-2'),
    (p_user_id, 'deadline', 'orange', 'alarm-clock')
  on conflict (user_id, default_key) where default_key is not null do nothing;
$$;

-- ---------------------------------------------------------------------------
-- Đăng ký user mới: tạo profile + danh mục mặc định
-- ---------------------------------------------------------------------------
-- Client có thể truyền options.data = { display_name, language } khi signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_language text;
  v_display_name text;
begin
  v_language := case
    when new.raw_user_meta_data ->> 'language' in ('vi', 'en') then new.raw_user_meta_data ->> 'language'
    else 'en'
  end;

  v_display_name := nullif(
    left(
      btrim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')),
      100
    ),
    ''
  );

  insert into public.profiles (id, display_name, language)
  values (new.id, v_display_name, v_language)
  on conflict (id) do nothing;

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Quyền thực thi: các hàm SECURITY DEFINER không được gọi trực tiếp từ client,
-- nếu không user có thể seed danh mục cho người khác.
-- ---------------------------------------------------------------------------
revoke execute on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.events_before_write() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Backfill cho user đã tồn tại trước migration này (không làm gì với project mới)
-- ---------------------------------------------------------------------------
insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

select public.seed_default_categories(u.id)
from auth.users u
where not exists (select 1 from public.categories c where c.user_id = u.id);
