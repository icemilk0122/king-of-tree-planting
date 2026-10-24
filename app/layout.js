import '../styles/globals.css';

export const metadata = {
  title: '樹蔭守護者：城市守護任務',
  description:
    '《樹蔭守護者：城市守護任務》把臺北變成一張可以探索的 RPG 樹木地圖！\n點開老樹，就能認識它的故事與紀錄；居民只要拍張照片，就能協助更新樹木狀況，或建議值得評估的種樹位置。\n透過一般任務、限時特殊任務及護樹積分，讓城市守護變得簡單有趣。每次參與都能在地圖上留下紀錄，也能看見社區樹木的觀察、修剪、治療及預計植樹進度。\n不需要是樹木專家，每個人都能成為生活圈的樹蔭守護者。\n每一次關心，都在地圖上留下改變。',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  manifest: '/site.webmanifest',
  openGraph: {
    title: '樹蔭守護者：城市守護任務',
    description:
      '《樹蔭守護者：城市守護任務》把臺北變成一張可以探索的 RPG 樹木地圖！\n點開老樹，就能認識它的故事與紀錄；居民只要拍張照片，就能協助更新樹木狀況，或建議值得評估的種樹位置。\n透過一般任務、限時特殊任務及護樹積分，讓城市守護變得簡單有趣。每次參與都能在地圖上留下紀錄，也能看見社區樹木的觀察、修剪、治療及預計植樹進度。\n不需要是樹木專家，每個人都能成為生活圈的樹蔭守護者。\n每一次關心，都在地圖上留下改變。',
    type: 'website',
    locale: 'zh_TW',
  },
  icons: {
    icon: [
      { url: '/icons/tree-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/tree-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/tree-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/tree-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/tree-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/tree-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
