export const metadata = {
  title: 'King of Tree Planting - Taipei',
  description: 'A 3D walking game on OpenStreetMap',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#000' }}>
        {children}
      </body>
    </html>
  );
}
