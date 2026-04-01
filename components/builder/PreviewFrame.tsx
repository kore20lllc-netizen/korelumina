"use client";

type Props = {
  projectId: string;
  version: number;
};

export default function PreviewFrame({ projectId, version }: Props) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <iframe
        key={version}
        src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}
