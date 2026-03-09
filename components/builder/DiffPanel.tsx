"use client";

export default function DiffPanel({ result }: { result: any }) {
  if (!result) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Changes</h2>
        <p>No task executed yet</p>
      </div>
    );
  }

  const files = result?.files || [];

  return (
    <div style={{ padding: 20, overflow: "auto" }}>
      <h2>Changes</h2>

      {files.length === 0 && <p>No files returned</p>}

      {files.map((f: any, i: number) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 10,
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 6,
              fontFamily: "monospace",
            }}
          >
            {f.path}
          </div>

          <pre
            style={{
              background: "#111",
              color: "#0f0",
              padding: 10,
              overflow: "auto",
              fontSize: 12,
            }}
          >
{f.content}
          </pre>
        </div>
      ))}
    </div>
  );
}
