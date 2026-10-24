import '../styles/globals.css';

export const metadata = {
  title: '樹蔭守護者 — King of Tree Planting',
  description: '為社區留一片蔭。走進台北街頭，記錄身邊的樹。',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  manifest: '/site.webmanifest',
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
