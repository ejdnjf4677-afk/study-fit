create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text,
  accent_color text,
  selected_badge_id text,
  settings jsonb not null default '{}'::jsonb,
  subjects text[] not null default array[]::text[],
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  studied_on date not null,
  subject text not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  focus_score integer check (focus_score between 0 and 100),
  pause_count integer not null default 0 check (pause_count >= 0),
  pause_minutes integer not null default 0 check (pause_minutes >= 0),
  started_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  todo_date date not null,
  content text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_date date not null,
  title text not null,
  schedule_time time,
  memo text,
  all_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_all_day_time_check check (
    (all_day = true and schedule_time is null)
    or (all_day = false)
  )
);

create table if not exists public.point_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_points integer not null default 0 check (current_points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  transaction_type text not null check (transaction_type in ('earn', 'spend', 'adjust')),
  reason text,
  related_type text,
  related_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  purchased_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_study_records_updated_at on public.study_records;
create trigger set_study_records_updated_at
before update on public.study_records
for each row execute function public.set_updated_at();

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row execute function public.set_updated_at();

drop trigger if exists set_schedules_updated_at on public.schedules;
create trigger set_schedules_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_point_balances_updated_at on public.point_balances;
create trigger set_point_balances_updated_at
before update on public.point_balances
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.study_records enable row level security;
alter table public.todos enable row level security;
alter table public.schedules enable row level security;
alter table public.point_balances enable row level security;
alter table public.point_transactions enable row level security;
alter table public.user_badges enable row level security;

create policy "Users can select own settings"
on public.user_settings for select
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own settings"
on public.user_settings for delete
using (auth.uid() = user_id);

create policy "Users can select own study records"
on public.study_records for select
using (auth.uid() = user_id);

create policy "Users can insert own study records"
on public.study_records for insert
with check (auth.uid() = user_id);

create policy "Users can update own study records"
on public.study_records for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own study records"
on public.study_records for delete
using (auth.uid() = user_id);

create policy "Users can select own todos"
on public.todos for select
using (auth.uid() = user_id);

create policy "Users can insert own todos"
on public.todos for insert
with check (auth.uid() = user_id);

create policy "Users can update own todos"
on public.todos for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own todos"
on public.todos for delete
using (auth.uid() = user_id);

create policy "Users can select own schedules"
on public.schedules for select
using (auth.uid() = user_id);

create policy "Users can insert own schedules"
on public.schedules for insert
with check (auth.uid() = user_id);

create policy "Users can update own schedules"
on public.schedules for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own schedules"
on public.schedules for delete
using (auth.uid() = user_id);

create policy "Users can select own point balance"
on public.point_balances for select
using (auth.uid() = user_id);

create policy "Users can insert own point balance"
on public.point_balances for insert
with check (auth.uid() = user_id);

create policy "Users can update own point balance"
on public.point_balances for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own point balance"
on public.point_balances for delete
using (auth.uid() = user_id);

create policy "Users can select own point transactions"
on public.point_transactions for select
using (auth.uid() = user_id);

create policy "Users can insert own point transactions"
on public.point_transactions for insert
with check (auth.uid() = user_id);

create policy "Users can update own point transactions"
on public.point_transactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own point transactions"
on public.point_transactions for delete
using (auth.uid() = user_id);

create policy "Users can select own badges"
on public.user_badges for select
using (auth.uid() = user_id);

create policy "Users can insert own badges"
on public.user_badges for insert
with check (auth.uid() = user_id);

create policy "Users can update own badges"
on public.user_badges for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own badges"
on public.user_badges for delete
using (auth.uid() = user_id);

create index if not exists study_records_user_date_idx on public.study_records(user_id, studied_on);
create index if not exists todos_user_date_idx on public.todos(user_id, todo_date);
create index if not exists schedules_user_date_idx on public.schedules(user_id, schedule_date);
create index if not exists point_transactions_user_created_idx on public.point_transactions(user_id, created_at desc);
