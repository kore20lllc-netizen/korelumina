"use client";

export default function ExecutionPanel({
  result,
  workspaceId,
  projectId,
}: {
  result: any;
  workspaceId: string;
  projectId: string;
}) {
  async function applyChanges() {
    const res = await fetch("/api/ai/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        projectId,
        mode: "apply_repair",
        spec: "apply generated files",
        files: result.files,
      }),
    });

    const data = await res.json();
    alert("Applied");
    console.log(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Execution</h2>

      <pre
        style={{
          background: "#f6f6f6",
          padding: 20,
          overflow: "auto",
        }}
      >
        {result
          ? JSON.stringify(result, null, 2)
          : "No task executed yet"}
      </pre>

      {result?.files && (
        <button onClick={applyChanges}>
          Apply Changes
        </button>
      )}
    </div>
  );
}
