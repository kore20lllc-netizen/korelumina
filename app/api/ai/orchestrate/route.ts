import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { projectId, prompt } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: string) {
        controller.enqueue(new TextEncoder().encode(msg + "\n"));
      }

      send("Starting orchestrator...");
      await sleep(500);

      send(`Project: ${projectId}`);
      await sleep(500);

      send("Planning...");
      await sleep(800);

      send("Generating code...");
      await sleep(1000);

      send("Applying changes...");
      await sleep(800);

      send("Done");

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
