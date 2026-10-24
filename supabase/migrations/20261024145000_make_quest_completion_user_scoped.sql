-- Quest completion belongs to a participation, not to the shared quest row.
-- Keep reusable demo quests active and provide one atomic reset for a device user.

with ranked as (
  select q.id,
         row_number() over (
           partition by q.tree_id, q.content_version
           order by (q.quest_type = 'special') desc, q.created_at asc, q.id asc
         ) as row_number
  from public.quests as q
  where q.content_version = '2.0-review.1'
    and q.is_active = true
)
update public.quests as q
set is_active = false
where q.id in (select r.id from ranked as r where r.row_number > 1);

update public.quests
set satisfied = false
where content_version = '2.0-review.1'
  and is_active = true;

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

  select u.* into v_user
  from public.users as u
  where u.id::text = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  select q.* into v_quest
  from public.quests as q
  where q.id::text = p_quest_id
  for update;

  if not found then
    raise exception 'Quest not found';
  end if;

  select p.* into v_participation
  from public.participations as p
  where p.user_id::text = p_user_id
    and p.quest_id::text = p_quest_id
  for update;

  if not found then
    raise exception 'Participation not found';
  end if;

  if v_participation.status <> 'pending' then
    raise exception 'Quest participation is no longer pending';
  end if;

  update public.participations as p
  set status = 'submitted',
      photo_url = p_photo_url,
      comment = nullif(trim(p_comment), ''),
      is_demo = p_is_demo,
      submitted_at = now()
  where p.id = v_participation.id
  returning p.* into v_participation;

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

  update public.users as u
  set total_points = coalesce(u.total_points, 0) + coalesce(v_quest.points, 0)
  where u.id = v_user.id
  returning u.* into v_user;

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

create or replace function public.reset_user_game_data(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id
  from public.users as u
  where u.device_id = p_device_id;

  if v_user_id is null then
    return false;
  end if;

  delete from public.ledger as l where l.user_id = v_user_id;
  delete from public.community_events as e where e.user_id = v_user_id;
  delete from public.tree_follows as f where f.user_id = v_user_id;
  delete from public.participations as p where p.user_id = v_user_id;

  update public.users as u
  set total_points = 0,
      updated_at = now()
  where u.id = v_user_id;

  return true;
end;
$$;

revoke all on function public.reset_user_game_data(text) from public;
grant execute on function public.reset_user_game_data(text) to anon, authenticated;

comment on function public.reset_user_game_data(text)
  is 'Atomically clears one device user participation, rewards, follows, events, and points for a new game.';
