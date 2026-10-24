# 樹蔭守護者 Shade Keepers

台北市行道樹守護 RPG — 在真實街道地圖上探索、接任務、拍照回報樹木狀態。

![Title Screen](public/images/title-hero.png)

## 技術架構

| 層級 | 技術 | 用途 |
|------|------|------|
| 前端框架 | [Next.js](https://nextjs.org/) 16 (App Router) | SSR / 路由 / 開發伺服器 |
| UI | [React](https://react.dev/) 19 | 元件化介面 |
| 3D 引擎 | [Three.js](https://threejs.org/) 0.186 | WebGL 地圖渲染、角色、樹木、建築 |
| 後端 / 資料庫 | [Supabase](https://supabase.com/) (PostgreSQL + Storage) | 任務資料、照片儲存、RLS 權限控制 |
| 地圖圖磚 | [Thunderforest](https://www.thunderforest.com/) Transport + [OpenStreetMap](https://www.openstreetmap.org/) fallback | 街道底圖（超額自動退回 OSM） |
| 天氣 | [Open-Meteo](https://open-meteo.com/) | 即時天氣 API（免費、免 API key） |
| 3D 角色建模 | [Blender](https://www.blender.org/) + Python 腳本 | Q 版模組化角色（7 部位 × 23 件裝備 + 3 套預設造型） |

## 資料來源與授權

| 資料 | 來源 | 授權 |
|------|------|------|
| 台北市行道樹（90,395 棵） | [台北市政府開放資料](https://data.taipei/) | 政府資料開放授權條款 |
| 台北市建築物輪廓 | 台北市政府開放資料 | 政府資料開放授權條款 |
| 地圖圖磚 | [Thunderforest](https://www.thunderforest.com/) Transport | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 地圖資料 | OpenStreetMap 貢獻者 | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) |
| 天氣資料 | Open-Meteo | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

## AI 開發工具

本專案使用 AI 輔助開發：

| 工具 | 用途 |
|------|------|
| [Claude Code](https://claude.com/claude-code) (Anthropic) | 程式碼撰寫、架構設計、除錯 |
| [ChatGPT](https://chat.openai.com/) (OpenAI) | 標題畫面美術圖生成 |

## 快速開始

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.local.example .env.local
# 填入 Supabase URL 和 anon key

# 啟動開發伺服器
npm run dev
# 預設 http://localhost:3000
```

### 環境變數

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_THUNDERFOREST_API_KEY=your-thunderforest-api-key  # 可選，未設定時自動使用 OSM 圖磚
```

### 角色模型生成（可選）

需要安裝 [Blender](https://www.blender.org/) 3.0+：

```bash
blender --background --python scripts/generate-character-v2.py
```

在 `public/models/` 生成 `char-base.glb` 與完整套裝所需的 23 件裝備 GLB。未生成時遊戲自動使用幾何體角色。

角色系統支援 7 個裝備部位（髮型、臉部配件、帽子、上衣、下裝、鞋子、配件），換裝介面以完整套裝為單位：

| 造型 | 說明 |
|------|------|
| 樹蔭守護者 | 草帽 + 白色 Polo 衫 + 深藍長褲 |
| 經典船長 | 捲髮 + 方框眼鏡 + 條紋上衣 + 深色長褲 |
| 海島休閒 | 墨鏡 + 花襯衫 + 黑短褲 + 夾腳拖 |

### 資料庫 migration

照片任務的點數結算與 V2 劇情事件依賴 `supabase/migrations/`。部署新版前，請先在對應的 Supabase 專案審查 RLS，並依序套用 migration；未套用時前端會停止結算，不會退回可能重複加點的舊流程。

```bash
npm test
npm run build
```

整合範圍與部署順序請見 [`docs/v2-story-database-integration.md`](docs/v2-story-database-integration.md)。

## 專案結構

```
├── app/                    # Next.js App Router
├── components/
│   ├── Game.js             # 主遊戲協調器
│   ├── title/              # 標題畫面（視差 + 呼吸動效）
│   ├── hud/                # ActionBar、Wardrobe、VirtualJoystick
│   ├── quest/              # RPGDialogue、NearbyQuests
│   ├── photo/              # PhotoCapture（拍照回報）
│   ├── story/              # StoryPlayer（VN 對話）
│   ├── social/             # CommunityFeed、FollowedTrees、PlantProposal
│   ├── map/                # DistrictMap（行政區傳送）
│   └── records/            # MyRecords（個人紀錄）
├── lib/
│   ├── engine.js           # 3D 引擎（相機、輸入、動畫迴圈）
│   ├── map.js              # Thunderforest/OSM 圖磚管理 + 座標轉換
│   ├── trees.js            # TreeManager（90K 棵樹的 LOD 載入）
│   ├── buildings.js        # 建築物 3D 渲染
│   ├── character.js        # 模組化 GLB 角色 + 裝備系統
│   ├── equipment.js        # 7 個裝備欄位、23 件裝備、三套完整造型與版本化存檔
│   ├── quest-engine.js     # 任務 CRUD + 接力賽
│   ├── story/              # V2 劇情正規化、事件導演與進度 sidecar
│   ├── supabase.js         # Supabase client（Proxy 延遲初始化）
│   └── weather.js          # Open-Meteo 天氣查詢
├── public/
│   ├── data/               # trees.json (90K)、buildings.json
│   ├── models/             # 主角套裝、NPC 與預覽 GLB
│   ├── assets/story/       # V2 劇情對話立繪
│   └── images/             # 標題畫面美術圖（三層分離：bg/char/text）
├── content/story/v2/       # V2 劇情交接資料與目前執行環境 profile
├── supabase/migrations/    # 可審查、依序部署的資料庫變更
├── assets/
│   └── blender/            # Blender 原始檔 (.blend)
└── scripts/
    ├── generate-character.py     # Blender 角色生成腳本 (v1)
    └── generate-character-v2.py  # Blender 角色生成腳本 (v2，模組化裝備)
```

## RPG 任務模組

任務系統設計為**獨立可移植模組**，與 3D 引擎鬆耦合：

```
quest-engine.js    ← 純資料層：Supabase CRUD，不依賴 Three.js
    ↕
RPGDialogue.js     ← 純 UI 層：接收 tree/quest props，觸發 action callback
    ↕
Game.js            ← 膠水層：連接 3D 引擎事件與 UI 狀態
```

**移植方式：**

1. `quest-engine.js` 可直接用於任何 React 專案（只需 Supabase client）
2. `RPGDialogue.js` / `NearbyQuests.js` 是純 React 元件，不含 3D 依賴
3. 替換 `Game.js` 中的 `onTreeClick` 來源即可接入不同的地圖/互動系統

任務資料結構（Supabase）：

```sql
quests: id, tree_id, area_id, title, description, type, status
quest_completions: quest_id, device_id, photo_url, completed_at
relay_chains / relay_legs: 接力賽任務鏈
```

## 授權

- **程式碼：** [MIT License](LICENSE)
- **資料與文件：** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **行道樹資料：** 依台北市政府資料開放授權條款使用
- **地圖圖磚：** Map © [Thunderforest](https://www.thunderforest.com/), CC BY-SA 4.0；data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, ODbL 1.0
