# 新版任務 NPC 美術設定

這份設定補足劇情 V2 只定義角色功能、但沒有指定外觀的部分。所有角色都採用標題畫面的 Q 版比例、圓潤輪廓、暖色光線與帶立體感的角色插畫風格；3D 模型則沿用主角的彈頭圓柱身體、簡單幾何四肢與玩具材質。

## 角色設定與資產

| 角色 | 美術設定 | Blender 模型 | 對話立繪 |
| --- | --- | --- | --- |
| 主角／樹蔭守護者 | 黑色短髮、黑框眼鏡、編織草帽、白色 Polo 衫與深藍長褲；親切有行動力。 | 既有模組化主角 | `/assets/story/player-shade-keeper.png` |
| 阿樹 | 年輕街區志工；深棕短捲髮、綠色上衣、沙色工作背心、卡其短褲、葉片徽章與田調斜背包。 | `/models/npc-guide-ashu.glb` | `/assets/story/guide-ashu-civic-volunteer.png` |
| 上班族 | 俐落黑色側分髮、淺藍短袖襯衫、深藍長褲與海軍藍通勤包；被太陽曬熱但仍有禮貌。 | `/models/npc-office-worker.glb` | `/assets/story/local-office-worker.png` |
| 街坊阿姨 | 深灰短波浪髮與銀白髮束、珊瑚色上衣、青綠七分褲、環保買菜袋；爽朗親切。 | `/models/npc-neighborhood-aunt.glb` | `/assets/story/local-neighborhood-aunt.png` |
| 永康街樟樹 | 真實樟樹輪廓與橢圓葉，樹幹表情像街坊長輩；不做人形手腳。 | `/models/npc-heritage-557.glb` | `/assets/story/heritage-557-modern-character.png` |
| 麗水街麵包樹 | 大型深裂葉與少量麵包果，樹幹表情較俏皮；不做人形手腳。 | `/models/npc-heritage-763.glb` | `/assets/story/heritage-763-modern-character.png` |

## Blender 來源與重建

- 可編輯來源：`assets/blender/shade-keeper-npcs.blend`
- 生成器：`scripts/generate-npcs.py`
- 重新生成：`/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/generate-npcs.py`
- 三位人物 NPC 使用與主角相同的骨架命名，包含 `Idle` 與 `Walk` 動作。
- 兩位老樹旁白目前是靜態模型；需要風擺時應由場景端對樹冠做輕微程序動畫。

## 對話立繪規格

- PNG、RGBA 透明背景。
- 桌面版最大寬度 440px、高度 68vh；下半部由對話框覆蓋。
- 所有 NPC 固定在左側、主角固定在右側。立繪已統一水平反轉至目前核定方向；方向由 `portraits.json` 的 `dialogueSide`、`facing` 與 `mirrorX` 控制，不受個別場景原始 `portraitEntrance` 影響。
- 旁白、系統提示、任務看板與活動公告仍使用文字，不配置人物立繪。
