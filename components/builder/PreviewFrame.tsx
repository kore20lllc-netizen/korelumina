"use client";

type Props = {
  projectId: string;
  version: number;
  file?: string;
};

export default function PreviewFrame({
  projectId,
  version,
  file,
}: Props) {
  // 🔥 ONLY use actual selected/active file
  if (!file) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        No file selected
      </div>
    );
  }

  const src = `/api/dev/preview?projectId=${projectId}&entry=${encodeURIComponent(
    file
  )}&v=${version}`;

  return (
    <iframe
      key={`${projectId}-${file}-${version}`}
      src={src}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: "#fff",
      }}
    />
  );
}
