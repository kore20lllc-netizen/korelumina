"use client";

export default function PlanPanel({
  plan,
  files,
  workspaceId,
  projectId,
  onResult,
}: {
  plan: string | null;
  files: string[];
  workspaceId: string;
  projectId: string;
  onResult: (data: any) => void;
}) {
  if (!plan) {
    return <div style={{ padding: 20 }}>No plan yet</div>;
  }

  async function generateFiles() {
    const res = await fetch("/api/ai/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        projectId,
        mode: "draft",
        spec: plan,
      }),
    });

    const data = await res.json();
    onResult(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>AI Plan</h2>

      <pre
        style={{
          background: "#f6f6f6",
          padding: 20,
          overflow: "auto",
        }}
      >
        {plan}
      </pre>

      <h3>Files</h3>

      <ul>
        {files.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <button onClick={generateFiles} style={{ marginTop: 10 }}>
        Generate Files
      </button>
    </div>
  );
}
