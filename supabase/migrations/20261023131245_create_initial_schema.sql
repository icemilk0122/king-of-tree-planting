
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  avatar_url text,
  total_points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quests table (general + special)
create table public.quests (
  id uuid primary key default uuid_generate_v4(),
  tree_id text not null,
  quest_type text not null check (quest_type in ('general', 'special')),
  title text not null,
  description text,
  points int not null default 10,
  deadline timestamptz,
  max_participants int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Participations (user takes a quest, uploads photo)
create table public.participations (
  id uuid primary key default uuid_generate_v4(),
  quest_id uuid not null references public.quests(id),
  user_id uuid not null references public.users(id),
  photo_url text,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'verified', 'rejected')),
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Points ledger (immutable log)
create table public.ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  quest_id uuid references public.quests(id),
  participation_id uuid references public.participations(id),
  points int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Tree photos (standalone photo uploads for trees without quest)
create table public.tree_photos (
  id uuid primary key default uuid_generate_v4(),
  tree_id text not null,
  user_id uuid not null references public.users(id),
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_quests_tree_id on public.quests(tree_id);
create index idx_quests_active on public.quests(is_active) where is_active = true;
create index idx_participations_user on public.participations(user_id);
create index idx_participations_quest on public.participations(quest_id);
create index idx_ledger_user on public.ledger(user_id);
create index idx_tree_photos_tree on public.tree_photos(tree_id);

-- RLS policies
alter table public.users enable row level security;
alter table public.quests enable row level security;
alter table public.participations enable row level security;
alter table public.ledger enable row level security;
alter table public.tree_photos enable row level security;

-- Public read for quests
create policy "quests_public_read" on public.quests for select using (true);

-- Users can read their own data
create policy "users_read_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Participations: users can read own, insert own
create policy "participations_read_own" on public.participations for select using (auth.uid() = user_id);
create policy "participations_insert_own" on public.participations for insert with check (auth.uid() = user_id);

-- Ledger: read own
create policy "ledger_read_own" on public.ledger for select using (auth.uid() = user_id);

-- Tree photos: public read, insert own
create policy "tree_photos_public_read" on public.tree_photos for select using (true);
create policy "tree_photos_insert_own" on public.tree_photos for insert with check (auth.uid() = user_id);
;
