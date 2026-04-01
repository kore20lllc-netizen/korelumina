"use client";

type Props = {
  projectId: string;
  onSelect: (file: string) => void;
};

export default function FileTree({ onSelect }: Props) {
  const files = [
    "app/page.tsx",
    "app/layout.tsx"
  ];

  return (
    <div style={{ padding: 10 }}>
      <h3>Files</h3>
      {files.map((f) => (
        <div
          key={f}
          style={{ cursor: "pointer", padding: "4px 0" }}
          onClick={() => onSelect(f)}
        >
          {f}
        </div>
      ))}
    </div>
  );
}
