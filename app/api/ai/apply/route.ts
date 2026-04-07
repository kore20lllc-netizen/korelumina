import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Draft = {
  file?: string;
  path?: string;
  code?: string;
  content?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = body?.projectId;
    const drafts: Draft[] = body?.drafts || [];

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No drafts provided" },
        { status: 400 }
      );
    }

    const results: Array<{ file: string; ok: boolean; error?: string }> = [];

    for (const draft of drafts) {
      const file = draft.file || draft.path || "app/page.tsx";
      const content = draft.code ?? draft.content ?? "";

      if (!content) {
        results.push({ file, ok: false, error: "Empty content" });
        continue;
      }

      const res = await fetch("http://localhost:3000/api/dev/fs/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          file,
          content,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        results.push({ file, ok: false, error: text || "fs/write failed" });
        continue;
      }

      results.push({ file, ok: true });
    }

    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failed.length === 0,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "apply failed",
      },
      { status: 500 }
    );
  }
}
