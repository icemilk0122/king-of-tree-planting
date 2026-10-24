-- Shorten fixed heritage-tree dialogue without changing rewards or quest mechanics.

update public.quests
set npc_dialogue = '路過嗎？幫我留張全樹照吧！'
where tree_id = 'heritage-557'
  and content_version = '2.0-review.1';

update public.quests
set npc_dialogue = '麵包樹不賣早餐啦！幫我留張全樹照？'
where tree_id = 'heritage-763'
  and content_version = '2.0-review.1';
