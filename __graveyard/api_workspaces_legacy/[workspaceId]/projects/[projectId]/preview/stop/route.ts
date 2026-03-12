import { NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function baseUrl() {
  const host = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
  const port = process.env.KORELUMINA_PREVIEWD_PORT || "3101";
  return `http://${host}:${port}`;
}

export async function POST(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const r = await fetch(`${baseUrl()}/preview/stop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId, projectId }),
  });

  const data = await r.json();
  return NextResponse.json(data);
}
