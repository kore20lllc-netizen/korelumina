import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { projectId, prompt } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      function send(msg: string) {
        controller.enqueue(enc.encode(msg + "\n"));
      }

      send("Starting orchestrator...");

      // ⚠️ DEMO: fake draft (replace with real planner later)
      const drafts = [
        {
          file: "app/page.tsx",
          code: `export default function Page() {
  return <div style={{padding:40,fontSize:32}}>AI: ${prompt}</div>;
}`,
        },
      ];

      send("Writing files...");

      const baseDir = path.join(process.cwd(), "runtime/workspaces/default/projects", projectId);

      for (const d of drafts) {
        const filePath = path.join(baseDir, d.file);

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, d.code);

        send(`Updated: ${d.file}`);
      }

      send("Rebuilding preview...");

      send("Done");
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
