import { afterEach, describe, expect, it, vi } from "vitest";

import { followAudit, getLatestAudit, startAudit, type AuditRunEvent } from "@/services/repositoryAuditService";

/* MS-2026-0012: Repo Audit reads only Runtime, and says so when it cannot. */

function stream(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

const sse = (event: AuditRunEvent) => `id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("repositoryAuditService", () => {
  it("follows an audit's events, split across chunks, to its completion", async () => {
    const progress: AuditRunEvent = { sequence: 1, type: "progress", progress: { stage: "snapshot", state: "completed", message: "12 files", at: 1 } };
    const completed: AuditRunEvent = { sequence: 2, type: "completed", reportId: "repository-audit:abc" };
    const text = sse(progress) + sse(completed);
    vi.stubGlobal("fetch", vi.fn(async () => stream([text.slice(0, 40), text.slice(40, 90), text.slice(90)])));
    const seen: AuditRunEvent[] = [];
    const last = await followAudit("audit-run:1", (event) => seen.push(event));
    expect(seen.map((event) => event.type)).toEqual(["progress", "completed"]);
    expect(last.reportId).toBe("repository-audit:abc");
  });

  it("fails when the stream ends before the audit finishes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => stream([sse({ sequence: 1, type: "progress", progress: { stage: "snapshot", state: "started", message: "", at: 1 } })])));
    await expect(followAudit("audit-run:1", () => undefined)).rejects.toThrow(/ended before the audit finished/);
  });

  it("says Runtime could not be reached instead of showing sample data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(getLatestAudit("app")).rejects.toThrow(/Runtime could not be reached/);
  });

  it("treats a project that was never audited as having no report", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "repository_audit_report_not_found" }), { status: 404 })));
    await expect(getLatestAudit("app")).resolves.toEqual({ report: null, runningRunId: null });
  });

  it("joins an audit that is already running", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "repository_audit_already_running", runId: "audit-run:9" }), { status: 409 })));
    await expect(startAudit("app", "scan")).resolves.toBe("audit-run:9");
  });
});
