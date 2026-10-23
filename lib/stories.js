export const STORIES = {
  intro: {
    trigger: 'game_start',
    pages: [
      {
        speaker: '???',
        text: '……你聽得到嗎？',
        overlay: 0.7,
      },
      {
        speaker: '樹靈長老',
        text: '太好了，終於有人能聽見我們的聲音了。',
        portrait: 'elder',
        overlay: 0.6,
      },
      {
        speaker: '樹靈長老',
        text: '我是這座城市的樹靈長老。台北的行道樹們……正在漸漸被遺忘。',
        portrait: 'elder',
        overlay: 0.6,
      },
      {
        speaker: '樹靈長老',
        text: '我們需要一位「樹蔭守護者」，記錄每棵樹的狀況，讓更多人看見它們。',
        portrait: 'elder',
        overlay: 0.5,
      },
      {
        speaker: '樹靈長老',
        text: '你願意成為守護者嗎？那就出發吧！',
        portrait: 'elder',
        overlay: 0.4,
      },
    ],
  },
  tutorial_move: {
    trigger: 'after_intro',
    pages: [
      {
        speaker: '系統',
        text: '使用 WASD 或方向鍵移動角色，Q/E 旋轉視角。',
        overlay: 0.3,
        highlight: 'controls',
      },
      {
        speaker: '系統',
        text: '手機玩家可以使用畫面上的虛擬搖桿操控。',
        overlay: 0.3,
      },
    ],
  },
  tutorial_quest: {
    trigger: 'after_move',
    pages: [
      {
        speaker: '系統',
        text: '看到樹上方的金色菱形 ◇ 了嗎？那代表這棵樹有任務。',
        overlay: 0.3,
      },
      {
        speaker: '系統',
        text: '走到有任務的樹旁邊，按空白鍵或點擊它就能接受任務。',
        overlay: 0.3,
      },
      {
        speaker: '系統',
        text: '完成拍照任務可以獲得護樹點數，在排行榜上留下你的名字！',
        overlay: 0.3,
      },
    ],
  },
  tutorial_actions: {
    trigger: 'after_quest',
    pages: [
      {
        speaker: '系統',
        text: '底部的功能列還有更多可以做的事：',
        overlay: 0.3,
      },
      {
        speaker: '系統',
        text: '「附近任務」查看周遭的樹有什麼需要，還會幫你導航過去。',
        overlay: 0.3,
      },
      {
        speaker: '系統',
        text: '「建議種樹」可以在你覺得需要樹蔭的地方提案。',
        overlay: 0.3,
      },
      {
        speaker: '系統',
        text: '準備好了嗎？台北的樹木們正在等你！',
        overlay: 0.2,
      },
    ],
  },
};

export const INTRO_SEQUENCE = ['intro', 'tutorial_move', 'tutorial_quest', 'tutorial_actions'];
