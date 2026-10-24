# V2 劇情與資料庫整合

這次整合保留現有的 Next.js、Three.js 與 Supabase 架構，沒有把交接包中假設的離線快照覆蓋到主程式。交接包的 JSON 是內容來源；`lib/story/` 是執行期轉接層；Supabase 的成功結果才是可觸發劇情的業務事實。

## 部署順序

1. 備份 Supabase，先檢查 `participations` 是否已有重複資料，以及現有 RLS 是否允許目前使用者完成交易內的讀寫。舊 ledger 可保留歷史重複紀錄；新版以 participation row lock 防止再次重複結算。
2. 在測試環境依序套用 `supabase/migrations/202610240001_v2_story_domain_contracts.sql` 與 `supabase/migrations/202610240002_add_quest_content_version.sql`。
3. 驗證領取任務、照片上傳、單次加點、重複送出拒絕、提案重送防重複與社區事件。
4. 執行 `npm test` 與 `npm run build`，再部署前端。
5. 驗證完成前，不開啟官方狀態、人工審核、特定老樹或期間活動劇情。

## 已接上的事件

| 業務事件 | 劇情 | 條件 |
| --- | --- | --- |
| `game.new_started` | `S00_OPENING` | 每份瀏覽器進度一次 |
| `proposal.tool_opened` | `S02_FIRST_PLANT_TOOL` | 每位玩家一次 |
| `proposal.saved` | `S05_PLANT_PROPOSAL_SAVED` | Supabase 確實回傳提案後，每筆一次 |
| `quest.local_reward_committed` | `S16_GENERAL_REVIEWED` | 交易回傳一般任務 ledger/event 後，每筆一次 |

`content/story/v2/runtime-profile.json` 是目前能力的唯一開關。交接包內其他劇情仍保留，但不會只因為 JSON 存在就自動觸發。

## 任務內容版號

`quests.content_version` 用來區分執行期任務所屬的內容批次。導入前的既有任務由 migration 回填為 `legacy-v1`；目前故事包新建立的任務標記為 `2.0-review.1`。任務清單、樹木任務與玩家任務紀錄預設只讀目前版本，因此舊任務不需刪除也不會混入新流程。

需要人工盤點時可直接依版號篩選：

```sql
select * from public.quests where content_version = 'legacy-v1';
select * from public.quests where content_version = '2.0-review.1';
```

## 資料一致性

`complete_quest_submission` 在單一 PostgreSQL 交易中更新回報、帳本、總點數、任務狀態與 durable event。前端只使用函式回傳的 `ledgerId`、`eventId`、`points` 和 `totalPoints` 播放完成劇情。RPC 不存在或結果不完整時，前端會顯示錯誤並嘗試刪除剛上傳、尚未被資料庫引用的照片。

種樹建議以 `(user_id, client_request_id)` 防止網路重送造成重複資料；缺少有效座標時禁止送出，不再以 `0,0` 代替。成功訊息只表示遊戲服務已保存，不表示公開、市府收件或核准種植。

## 尚未自動執行的工作

- migration 尚未套用到任何遠端 Supabase。
- RLS 與既有資料重複狀況尚未從遠端 schema 驗證。
- 交接包未附角色肖像，因此目前使用姓名卡 fallback。
- `S17` 與所有 P1/P2、campaign、official-status 劇情保持停用。
