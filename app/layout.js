import '../styles/globals.css';

export const metadata = {
  title: '樹蔭守護者 — King of Tree Planting',
  description: '為社區留一片蔭。走進台北街頭，記錄身邊的樹。',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
