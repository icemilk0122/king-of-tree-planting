-- V2 story/domain integration contract.
-- Review the existing RLS policies before applying this migration in production.

alter table public.planting_proposals
  add column if not exists location_source text,
  add column if not exists evidence_kind text,
  add column if not exists client_request_id text;

alter table public.community_events
  add column if not exists event_id text,
  add column if not exists points integer;

create unique index if not exists participations_user_quest_unique
  on public.participations (user_id, quest_id);

create unique index if not exists planting_proposals_user_request_unique
  on public.planting_proposals (user_id, client_request_id)
  where client_request_id is not null;

create unique index if not exists community_events_event_id_unique
  on public.community_events (event_id)
  where event_id is not null;

create or replace function public.complete_quest_submission(
  p_user_id text,
  p_quest_id text,
  p_photo_url text,
  p_comment text default null,
  p_is_demo boolean default false
)
returns table (
  quest_id text,
  tree_id text,
  area_id text,
  participation_id text,
  ledger_id text,
  quest_kind text,
  points integer,
  total_points integer,
  event_id text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_quest public.quests%rowtype;
  v_participation public.participations%rowtype;
  v_ledger public.ledger%rowtype;
  v_event_id text;
begin
  if nullif(trim(p_photo_url), '') is null then
    raise exception 'A submitted photo URL is required';
  end if;

  select * into v_user
  from public.users
  where id::text = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  select * into v_quest
  from public.quests
  where id::text = p_quest_id
  for update;

  if not found then
    raise exception 'Quest not found';
  end if;

  select * into v_participation
  from public.participations
  where user_id::text = p_user_id
    and quest_id::text = p_quest_id
  for update;

  if not found then
    raise exception 'Participation not found';
  end if;

  if v_participation.status <> 'pending' then
    raise exception 'Quest participation is no longer pending';
  end if;

  update public.participations
  set status = 'submitted',
      photo_url = p_photo_url,
      comment = nullif(trim(p_comment), ''),
      is_demo = p_is_demo,
      submitted_at = now()
  where id = v_participation.id
  returning * into v_participation;

  insert into public.ledger (
    user_id,
    quest_id,
    participation_id,
    points,
    reason,
    created_at
  ) values (
    v_user.id,
    v_quest.id,
    v_participation.id,
    coalesce(v_quest.points, 0),
    case when p_is_demo then 'demo_submit' else 'photo_submitted' end,
    now()
  )
  returning * into v_ledger;

  update public.users
  set total_points = coalesce(total_points, 0) + coalesce(v_quest.points, 0)
  where id = v_user.id
  returning * into v_user;

  update public.quests
  set satisfied = true
  where id = v_quest.id;

  v_event_id := 'quest.local_reward_committed:' || v_ledger.id::text;

  insert into public.community_events (
    event_id,
    event_type,
    user_id,
    quest_id,
    tree_id,
    area_id,
    points,
    created_at
  ) values (
    v_event_id,
    'quest_completed',
    v_user.id,
    v_quest.id,
    v_quest.tree_id,
    v_quest.area_id,
    coalesce(v_quest.points, 0),
    now()
  );

  return query select
    v_quest.id::text,
    v_quest.tree_id::text,
    v_quest.area_id::text,
    v_participation.id::text,
    v_ledger.id::text,
    v_quest.quest_type::text,
    coalesce(v_quest.points, 0)::integer,
    v_user.total_points::integer,
    v_event_id;
end;
$$;

comment on function public.complete_quest_submission(text, text, text, text, boolean)
  is 'Atomically records a quest submission, points ledger entry, user total, quest state, and durable story event.';
