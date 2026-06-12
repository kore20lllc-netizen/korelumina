"use client";

type DiffItem = {
  file: string;
  content: string;
};

type Props = {
  drafts: DiffItem[];
  onApply: (file: string, content: string) => void;
};

export default function DiffPanel({ drafts, onApply }: Props) {
  if (!drafts || drafts.length === 0) {
    return (
      <div style={{ padding: 10, fontSize: 12 }}>
        No changes
      </div>
    );
  }

  return (
    <div style={{ padding: 10 }}>
      {drafts.map((d) => (
        <div
          key={d.file}
          style={{
            border: "1px solid #eee",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {d.file}
          </div>

          <pre
            style={{
              fontSize: 12,
              background: "#f9f9f9",
              padding: 10,
              overflow: "auto",
              maxHeight: 200,
            }}
          >
            {d.content}
          </pre>

          <button
            onClick={() => onApply(d.file, d.content)}
            style={{
              marginTop: 8,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}
