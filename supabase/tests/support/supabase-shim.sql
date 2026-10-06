-- Giả lập phần tối thiểu của Supabase (role, schema auth, schema storage) để chạy migration
-- trên Postgres thuần (PGlite) khi test. Không dùng cho môi trường thật.
-- Hành vi bám theo Supabase: auth.uid() đọc claim từ cài đặt request.jwt.claims,
-- storage.foldername() trả về các thư mục (không gồm tên file).

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema storage;

grant usage on schema public, auth, storage to anon, authenticated, service_role;

-- Supabase cấp sẵn quyền mặc định cho các role này trên bảng mới ở schema public
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid default auth.uid ()
);

alter table storage.objects enable row level security;

create function storage.foldername(name text)
returns text[]
language plpgsql
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end;
$$;

grant select on storage.buckets to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
