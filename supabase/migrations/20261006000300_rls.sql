-- Phase 1 / 3: Row Level Security.
-- Bật RLS trên TẤT CẢ bảng; mỗi policy chỉ cho thao tác trên dòng của chính user (auth.uid()).
-- Dùng (select auth.uid()) để Postgres cache kết quả, không gọi lại cho từng dòng.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;

-- Phòng thủ thêm: role anon (chưa đăng nhập) không có quyền gì trên các bảng này
revoke all on public.profiles, public.categories, public.events from anon;

-- ---------------------------------------------------------------------------
-- profiles (khóa là id; không có policy delete: profile bị xóa theo auth.users)
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create policy "categories_select_own" on public.categories
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "categories_insert_own" on public.categories
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories_update_own" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories_delete_own" on public.categories
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- events
-- Ngoài user_id, category_id (nếu có) phải thuộc về chính user, nếu không user A
-- có thể gắn sự kiện của mình vào danh mục của user B (rò rỉ id, tên khi join).
-- ---------------------------------------------------------------------------
create policy "events_select_own" on public.events
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "events_insert_own" on public.events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy "events_update_own" on public.events
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy "events_delete_own" on public.events
  for delete to authenticated
  using (user_id = (select auth.uid()));
