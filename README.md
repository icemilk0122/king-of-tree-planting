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
| 地圖圖磚 | [OpenStreetMap](https://www.openstreetmap.org/) | 衛星/街道底圖 (`tile.openstreetmap.org`) |
| 天氣 | [Open-Meteo](https://open-meteo.com/) | 即時天氣 API（免費、免 API key） |
| 3D 角色建模 | [Blender](https://www.blender.org/) + Python 腳本 | Q 版模組化角色 GLB 生成 |

## 資料來源與授權

| 資料 | 來源 | 授權 |
|------|------|------|
| 台北市行道樹（90,395 棵） | [台北市政府開放資料](https://data.taipei/) | 政府資料開放授權條款 |
| 台北市建築物輪廓 | 台北市政府開放資料 | 政府資料開放授權條款 |
| 地圖圖磚 | OpenStreetMap 貢獻者 | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) |
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
```

### 角色模型生成（可選）

需要安裝 [Blender](https://www.blender.org/) 3.0+：

```bash
blender --background --python scripts/generate-character.py
```

在 `public/models/` 生成 base + 14 件裝備 GLB 檔。未生成時遊戲自動使用幾何體角色。

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
│   ├── map.js              # OSM 圖磚管理 + 座標轉換
│   ├── trees.js            # TreeManager（90K 棵樹的 LOD 載入）
│   ├── buildings.js        # 建築物 3D 渲染
│   ├── character.js        # 模組化 GLB 角色 + 裝備系統
│   ├── equipment.js        # 裝備定義（6 slot × 15 件）
│   ├── quest-engine.js     # 任務 CRUD + 接力賽
│   ├── stories.js          # 劇情腳本
│   ├── supabase.js         # Supabase client（Proxy 延遲初始化）
│   └── weather.js          # Open-Meteo 天氣查詢
├── public/
│   ├── data/               # trees.json (90K)、buildings.json
│   └── images/             # 標題畫面美術圖
└── scripts/
    └── generate-character.py  # Blender 角色生成腳本
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
- **地圖圖磚：** (c) OpenStreetMap contributors, ODbL 1.0
