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

-- User-editable profile fields (Settings screen).
alter table public.profiles
  add column if not exists display_name text
  check (display_name is null or char_length(display_name) between 1 and 50);
alter table public.profiles
  add column if not exists birth_date date;
alter table public.profiles
  add column if not exists locale text
  check (locale is null or locale in ('es', 'en'));

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


-- ============================================================
-- Platform: subjects → topics → topic_levels (Phase 2/3)
-- ============================================================

-- Materias (Math, English, etc).
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  emoji text,
  name_es text not null,
  name_en text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;

drop policy if exists "subjects_select_authed" on public.subjects;
create policy "subjects_select_authed"
  on public.subjects for select
  using (auth.role() = 'authenticated');


-- Temas dentro de una materia (Multiplication tables, Animal vocab, ...).
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  slug text not null,
  emoji text,
  name_es text not null,
  name_en text not null,
  age_min int,
  age_max int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, slug)
);

alter table public.topics enable row level security;

drop policy if exists "topics_select_authed" on public.topics;
create policy "topics_select_authed"
  on public.topics for select
  using (auth.role() = 'authenticated');


-- Niveles dentro de un tema. Cada nivel declara su mecánica + config.
create table if not exists public.topic_levels (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  position int not null,
  emoji text,
  title_key text,
  title_vars jsonb,
  subtitle_key text,
  subtitle_vars jsonb,
  mechanic text not null,
  config jsonb not null,
  unlock_rule jsonb,
  unlocks_mascot_id int,
  coin_reward jsonb,
  replayable boolean not null default false,
  created_at timestamptz not null default now(),
  unique (topic_id, position)
);

alter table public.topic_levels enable row level security;

drop policy if exists "topic_levels_select_authed" on public.topic_levels;
create policy "topic_levels_select_authed"
  on public.topic_levels for select
  using (auth.role() = 'authenticated');


-- Racha por (user, topic). Reemplaza el localStorage global.
create table if not exists public.streaks (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  current int not null default 0,
  best int not null default 0,
  last_exam_correct int,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.streaks enable row level security;

drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
  on public.streaks for select using (auth.uid() = user_id);

drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own"
  on public.streaks for insert with check (auth.uid() = user_id);

drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own"
  on public.streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Catálogo de mascotas que un usuario tiene desbloqueadas.
create table if not exists public.user_mascots (
  user_id uuid not null references auth.users(id) on delete cascade,
  mascot_id int not null,
  source text not null check (source in ('level', 'purchase', 'gift')),
  acquired_at timestamptz not null default now(),
  primary key (user_id, mascot_id)
);

alter table public.user_mascots enable row level security;

drop policy if exists "user_mascots_select_own" on public.user_mascots;
create policy "user_mascots_select_own"
  on public.user_mascots for select using (auth.uid() = user_id);

drop policy if exists "user_mascots_insert_own" on public.user_mascots;
create policy "user_mascots_insert_own"
  on public.user_mascots for insert with check (auth.uid() = user_id);


-- Desafío del día. Una fila por (user, fecha).
create table if not exists public.daily_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'claimed')),
  coins_awarded int not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, claim_date)
);

alter table public.daily_challenges enable row level security;

drop policy if exists "daily_challenges_select_own" on public.daily_challenges;
create policy "daily_challenges_select_own"
  on public.daily_challenges for select using (auth.uid() = user_id);

drop policy if exists "daily_challenges_insert_own" on public.daily_challenges;
create policy "daily_challenges_insert_own"
  on public.daily_challenges for insert with check (auth.uid() = user_id);

drop policy if exists "daily_challenges_update_own" on public.daily_challenges;
create policy "daily_challenges_update_own"
  on public.daily_challenges for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Economía en profiles (monedas + streak de días).
alter table public.profiles
  add column if not exists coins int not null default 0;
alter table public.profiles
  add column if not exists daily_streak int not null default 0;
alter table public.profiles
  add column if not exists last_daily_claim_date date;


-- Migración aditiva en progress: PK pasa de (user_id, level_id) a una
-- surrogate uuid `id`, para poder relajar level_id (nullable durante
-- la transición) y permitir filas nuevas que solo referencien
-- topic_level_id. Reemplazamos la unicidad con índices parciales —
-- existentes (legacy) usan (user_id, level_id), nuevos usan
-- (user_id, topic_level_id).
alter table public.progress
  add column if not exists topic_level_id uuid references public.topic_levels(id) on delete cascade;

alter table public.progress
  add column if not exists id uuid default gen_random_uuid();

update public.progress set id = gen_random_uuid() where id is null;

do $$
begin
  -- Drop el PK viejo SOLO si está sobre (user_id, level_id).
  if exists (
    select 1
    from information_schema.table_constraints tc
    where tc.table_schema = 'public'
      and tc.table_name = 'progress'
      and tc.constraint_type = 'PRIMARY KEY'
      and tc.constraint_name = 'progress_pkey'
  ) then
    if (
      select string_agg(column_name, ',' order by ordinal_position)
      from information_schema.key_column_usage
      where constraint_name = 'progress_pkey'
        and table_schema = 'public'
    ) = 'user_id,level_id' then
      alter table public.progress drop constraint progress_pkey;
    end if;
  end if;
end$$;

alter table public.progress alter column id set not null;
alter table public.progress alter column id set default gen_random_uuid();

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_type = 'PRIMARY KEY'
      and table_name = 'progress'
      and table_schema = 'public'
  ) then
    alter table public.progress add primary key (id);
  end if;
end$$;

alter table public.progress alter column level_id drop not null;

create unique index if not exists progress_user_level_unique
  on public.progress (user_id, level_id) where level_id is not null;

create unique index if not exists progress_user_topic_level_unique
  on public.progress (user_id, topic_level_id) where topic_level_id is not null;

create index if not exists idx_progress_topic_level
  on public.progress(user_id, topic_level_id);
