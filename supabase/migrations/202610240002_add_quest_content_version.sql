-- A quest content version identifies the content release that owns a runtime quest.
-- Existing rows predate versioning and remain available as legacy history.

alter table public.quests
  add column if not exists content_version text;

update public.quests
set content_version = 'legacy-v1'
where content_version is null or btrim(content_version) = '';

alter table public.quests
  alter column content_version set default 'legacy-v1',
  alter column content_version set not null;

create index if not exists idx_quests_content_version_active
  on public.quests (content_version, is_active, satisfied, area_id);

comment on column public.quests.content_version
  is 'Content release that owns this runtime quest; use 2.0-review.1 for the current story pack and legacy-v1 for pre-versioning rows.';
