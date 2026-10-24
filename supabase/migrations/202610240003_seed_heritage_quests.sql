-- Current story-pack quests for the two heritage-tree characters in Daan.
-- Keep this migration idempotent so a partially hand-seeded project can adopt it safely.

update public.quests
set quest_type = 'general',
    title = '永康街樟樹觀察',
    description = '從安全的位置拍攝完整樹形。照片與任務保存成功後，系統會立即結算 10 點；不代表人工或市府審核。',
    points = 10,
    deadline = null,
    max_participants = null,
    is_active = true,
    area_id = 'daan',
    npc_name = '永康街樟樹',
    npc_dialogue = '路過時，幫我留張全樹照吧。',
    evidence_kind = 'whole_tree',
    demand_after = null
where tree_id = 'heritage-557'
  and content_version = '2.0-review.1';

insert into public.quests (
  id, tree_id, quest_type, title, description, points, deadline,
  max_participants, is_active, area_id, npc_name, npc_dialogue,
  evidence_kind, demand_after, satisfied, content_version
)
select
  '05570557-0557-4055-8055-700000000557'::uuid,
  'heritage-557',
  'general',
  '永康街樟樹觀察',
  '從安全的位置拍攝完整樹形。照片與任務保存成功後，系統會立即結算 10 點；不代表人工或市府審核。',
  10,
  null,
  null,
  true,
  'daan',
  '永康街樟樹',
  '路過時，幫我留張全樹照吧。',
  'whole_tree',
  null,
  false,
  '2.0-review.1'
where not exists (
  select 1 from public.quests
  where tree_id = 'heritage-557'
    and content_version = '2.0-review.1'
);

update public.quests
set quest_type = 'special',
    title = '麗水街麵包樹特別委託',
    description = '從安全的位置拍攝完整樹形。照片與任務保存成功後，系統會結算這份特別委託的 20 點。',
    points = 20,
    deadline = null,
    max_participants = null,
    is_active = true,
    area_id = 'daan',
    npc_name = '麗水街麵包樹',
    npc_dialogue = '叫麵包樹，不代表我會賣早餐啦。可以幫我留張全身照嗎？',
    evidence_kind = 'whole_tree',
    demand_after = null
where tree_id = 'heritage-763'
  and content_version = '2.0-review.1';

insert into public.quests (
  id, tree_id, quest_type, title, description, points, deadline,
  max_participants, is_active, area_id, npc_name, npc_dialogue,
  evidence_kind, demand_after, satisfied, content_version
)
select
  '07630763-0763-4076-8076-300000000763'::uuid,
  'heritage-763',
  'special',
  '麗水街麵包樹特別委託',
  '從安全的位置拍攝完整樹形。照片與任務保存成功後，系統會結算這份特別委託的 20 點。',
  20,
  null,
  null,
  true,
  'daan',
  '麗水街麵包樹',
  '叫麵包樹，不代表我會賣早餐啦。可以幫我留張全身照嗎？',
  'whole_tree',
  null,
  false,
  '2.0-review.1'
where not exists (
  select 1 from public.quests
  where tree_id = 'heritage-763'
    and content_version = '2.0-review.1'
);

comment on column public.quests.evidence_kind
  is 'Expected evidence for a quest; whole_tree asks for a safe full-tree photograph.';
