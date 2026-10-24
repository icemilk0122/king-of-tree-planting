-- Every Taipei street tree can lazily receive one active quest for the current
-- content release. Keep the constraint scoped to this release so historical
-- quest rows and future content versions remain independent.

with ranked as (
  select id,
         row_number() over (
           partition by tree_id, content_version
           order by (quest_type = 'special') desc, created_at asc, id asc
         ) as row_number
  from public.quests
  where content_version = '2.0-review.1'
    and is_active = true
    and satisfied = false
)
update public.quests
set is_active = false
where id in (select id from ranked where row_number > 1);

create unique index if not exists quests_current_active_tree_unique
  on public.quests (tree_id, content_version)
  where content_version = '2.0-review.1'
    and is_active = true
    and satisfied = false;

comment on index public.quests_current_active_tree_unique
  is 'Prevents duplicate lazy-created tasks when multiple players first interact with the same tree.';
