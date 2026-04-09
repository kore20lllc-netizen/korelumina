"use client";

type Props = {
  projectId: string;
  version: number;
  file?: string;
};

export default function PreviewFrame({ projectId, version, file }: Props) {
  const entry = file ? `&entry=${encodeURIComponent(file)}` : "";

  return (
    <iframe
      key={version + (file || "")}
      src={`/api/dev/preview?projectId=${projectId}${entry}&v=${version}`}
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
}
