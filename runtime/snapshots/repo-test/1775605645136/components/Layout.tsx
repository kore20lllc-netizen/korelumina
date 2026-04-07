
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 20, fontWeight: 700 }}>
        KoreLumina App
      </div>
      {children}
    </div>
  );
}
