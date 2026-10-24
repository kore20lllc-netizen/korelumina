import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";

/* MS-2026-0017: what a project's download holds, and the download itself. */

export interface ProjectExportSummary {
  projectId: string;
  fileCount: number;
  totalBytes: number;
  leftOutSecrets: string[];
  leftOutLinks: string[];
}

async function failure(response: Response, fallback: string): Promise<Error> {
  try {
    const data = (await response.json()) as { error?: string };
    return new Error(data.error ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function getProjectExportSummary(projectId: string): Promise<ProjectExportSummary> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/projects/${encodeURIComponent(projectId)}/export`, {
    headers: getRuntimeCallerHeaders(),
  });
  if (!response.ok) throw await failure(response, "export_unavailable");
  return (await response.json()) as ProjectExportSummary;
}

/* Downloads with the person's sign-in (a plain link could not carry it) and saves the file. */
export async function downloadProjectZip(projectId: string): Promise<number> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/projects/${encodeURIComponent(projectId)}/export.zip`, {
    headers: getRuntimeCallerHeaders(),
  });
  if (!response.ok) throw await failure(response, "export_failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectId}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  return blob.size;
}
