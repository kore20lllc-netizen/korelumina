"use client";

type Props = {
  projectId: string;
};

export default function BuilderInner({ projectId }: Props) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Builder</h1>
      <p>Project: {projectId}</p>
    </div>
  );
}
