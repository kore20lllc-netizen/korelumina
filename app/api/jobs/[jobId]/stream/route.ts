import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { jobId } = await context.params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            ok: true,
            jobId,
            status: "connected",
          })}\n\n`,
        ),
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control":
        "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
