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


-- Progress: one row per (user, level)
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id int not null check (level_id between 1 and 100),
  score int not null check (score >= 0),
  total int not null check (total > 0),
  passed boolean not null default false,
  stars int not null default 0 check (stars between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

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
