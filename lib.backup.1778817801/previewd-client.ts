const PREVIEWD_HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PREVIEWD_PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

function baseUrl() {
  return `http://${PREVIEWD_HOST}:${PREVIEWD_PORT}`;
}

export async function previewdStart(workspaceId: string, projectId: string) {
  const r = await fetch(`${baseUrl()}/preview/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId, projectId }),
    cache: "no-store",
  });
  const j = await r.json();
  return { ok: r.ok && j?.ok, json: j, status: r.status };
}

export async function previewdStop(workspaceId: string, projectId: string, reason = "stopped") {
  const r = await fetch(`${baseUrl()}/preview/stop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId, projectId, reason }),
    cache: "no-store",
  });
  const j = await r.json();
  return { ok: r.ok && j?.ok, json: j, status: r.status };
}

export async function previewdStatus(workspaceId: string, projectId: string) {
  const r = await fetch(
    `${baseUrl()}/preview/status?workspaceId=${encodeURIComponent(workspaceId)}&projectId=${encodeURIComponent(projectId)}`,
    { cache: "no-store" }
  );
  const j = await r.json();
  return { ok: r.ok && j?.ok, json: j, status: r.status };
}
