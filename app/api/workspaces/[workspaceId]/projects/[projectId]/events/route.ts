import { NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const interval = setInterval(() => {
        send({
          type: "heartbeat",
          workspaceId,
          projectId,
          ts: Date.now(),
        });
      }, 2000);

      const cancel = () => {
        clearInterval(interval);
        controller.close();
      };

      const signal = (controller as any)?.signal;

      if (signal && typeof signal.addEventListener === "function") {
        signal.addEventListener("abort", cancel);
      }
    },

    cancel() {
      // cleanup handled above
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
