"use client";

type Props = {
  projectId: string;
};

export default function DesignerCanvas({ projectId }: Props) {
  const generate = async () => {
    await fetch("/api/dev/designer/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        schema: {
          nodes: [
            { type: "heading", text: "Hello from Designer" },
            { type: "text", text: "Generated safely on server" }
          ]
        }
      })
    });
  };

  return (
    <div className="h-full flex items-center justify-center">
      <button
        onClick={generate}
        className="px-4 py-2 border rounded text-sm"
      >
        Generate Page
      </button>
    </div>
  );
}
