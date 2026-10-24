-- Reset only one anonymous device user's game progress. Shared quest rows and
-- other players' progress are intentionally left untouched.

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
