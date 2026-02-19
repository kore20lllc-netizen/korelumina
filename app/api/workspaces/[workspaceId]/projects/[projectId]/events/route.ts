import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";
import { readJobs } from "@/runtime/job-store";
import { getPreview } from "@/runtime/preview-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

type SSEEvent = {
  t: "hello" | "state" | "log" | "ping" | "error";
  source?: "build" | "preview";
  ts: number;
  data?: any;
};

function sseEncode(evt: SSEEvent) {
  // Named events make the client easy (EventSource.addEventListener)
  const name = `event: ${evt.t}\n`;
  const payload = `data: ${JSON.stringify(evt)}\n\n`;
  return name + payload;
}

function safeReadAppend(filePath: string, fromOffset: number) {
  try {
    if (!filePath) return { nextOffset: fromOffset, chunk: "" };
    if (!fs.existsSync(filePath)) return { nextOffset: fromOffset, chunk: "" };

    const st = fs.statSync(filePath);
    const size = st.size ?? 0;

    // log rotated/truncated
    const start = Math.min(fromOffset, size);
    const end = size;
    if (end <= start) return { nextOffset: start, chunk: "" };

    const buf = fs.readFileSync(filePath);
    const slice = buf.subarray(start, end).toString("utf8");
    return { nextOffset: end, chunk: slice };
  } catch {
    return { nextOffset: fromOffset, chunk: "" };
  }
}

function latestJobFor(workspaceId: string, projectId: string) {
  const jobs = readJobs().filter(
    (j) => j.workspaceId === workspaceId && j.projectId === projectId
  );
  return jobs.length ? jobs[jobs.length - 1] : null;
}

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId, {
    strict: process.env.NODE_ENV === "production",
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();

      let closed = false;

      let buildOffset = 0;
      let previewOffset = 0;

      // Initial hello
      controller.enqueue(
        enc.encode(
          sseEncode({
            t: "hello",
            ts: Date.now(),
            data: {
              workspaceId,
              projectId,
              manifest,
            },
          })
        )
      );

      const send = (evt: SSEEvent) => {
        if (closed) return;
        controller.enqueue(enc.encode(sseEncode(evt)));
      };

      const tick = () => {
        if (closed) return;

        const job = latestJobFor(workspaceId, projectId);
        const preview = getPreview(workspaceId, projectId);

        // Emit state snapshot every tick (cheap + stable)
        send({
          t: "state",
          ts: Date.now(),
          data: {
            latestJob: job,
            preview,
          },
        });

        // Multiplex logs (append-only streaming)
        const buildLogPath = job?.logPath ?? null;
        const previewLogPath = preview?.logPath ?? null;

        if (buildLogPath) {
          const r = safeReadAppend(path.resolve(buildLogPath), buildOffset);
          buildOffset = r.nextOffset;
          if (r.chunk) {
            send({
              t: "log",
              source: "build",
              ts: Date.now(),
              data: { text: r.chunk },
            });
          }
        }

        if (previewLogPath) {
          const r = safeReadAppend(path.resolve(previewLogPath), previewOffset);
          previewOffset = r.nextOffset;
          if (r.chunk) {
            send({
              t: "log",
              source: "preview",
              ts: Date.now(),
              data: { text: r.chunk },
            });
          }
        }

        // keep-alive
        send({ t: "ping", ts: Date.now() });
      };

      const interval = setInterval(tick, 500);

      // If the client closes connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cancel = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      };

      // @ts-expect-error - stream cancel hook
      (controller as any).signal?.addEventListener?.("abort", cancel);
    },
    cancel() {
      // no-op; start() handles close
    },
  });

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // For reverse proxies:
      "x-accel-buffering": "no",
    },
  });
}
