-- ============================================================
-- Multiply — schema
-- Run this in the Supabase SQL editor once.
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
-- ============================================================

-- Profiles: one row per auth user, stores username
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  created_at timestamptz not null default now()
);

-- Added later: which mascot the user has selected for their home screen.
-- Defaults to 1 (the base green Multi).
alter table public.profiles
  add column if not exists selected_mascot_id int not null default 1
  check (selected_mascot_id between 1 and 100);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- Progress: one row per (user, level, track, theme).
-- "track"  separates subjects (math vs language).
-- "theme"  separates content sub-sections within a subject (e.g. for math:
--          'tables' today; potentially 'geometry', 'fractions' tomorrow).
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id int not null check (level_id between 1 and 100),
  track text not null default 'math' check (track in ('math', 'language')),
  theme text not null default 'tables',
  score int not null check (score >= 0),
  total int not null check (total > 0),
  passed boolean not null default false,
  stars int not null default 0 check (stars between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id, track, theme)
);

-- Migrations for older schemas (idempotent).
--
-- 1) Add `track` column if missing.
alter table public.progress
  add column if not exists track text not null default 'math'
  check (track in ('math', 'language'));

-- 2) Add `theme` column if missing. Backfill existing rows by track:
--    math → 'tables', language → 'nouns-verbs'.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'progress'
      and column_name = 'theme'
  ) then
    alter table public.progress add column theme text;
    update public.progress
      set theme = case track
        when 'language' then 'nouns-verbs'
        else 'tables'
      end
      where theme is null;
    alter table public.progress alter column theme set not null;
    alter table public.progress alter column theme set default 'tables';
  end if;
end $$;

-- 3) Make sure the primary key includes (track, theme).
do $$
declare
  has_track boolean;
  has_theme boolean;
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'progress_pkey'
      and conrelid = 'public.progress'::regclass
  ) then
    select exists (
      select 1
      from information_schema.key_column_usage
      where table_schema = 'public'
        and table_name = 'progress'
        and constraint_name = 'progress_pkey'
        and column_name = 'track'
    ) into has_track;
    select exists (
      select 1
      from information_schema.key_column_usage
      where table_schema = 'public'
        and table_name = 'progress'
        and constraint_name = 'progress_pkey'
        and column_name = 'theme'
    ) into has_theme;
    if not (has_track and has_theme) then
      alter table public.progress drop constraint progress_pkey;
      alter table public.progress add primary key (user_id, level_id, track, theme);
    end if;
  end if;
end $$;

alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "progress_delete_own" on public.progress;
create policy "progress_delete_own"
  on public.progress for delete
  using (auth.uid() = user_id);
