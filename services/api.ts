export interface Project {
  projectId: string;
  name: string;
  framework?: string;
  status?: string;
  builderUrl?: string;
  previewUrl?: string | null;
}

export interface RuntimeStatus {
  ok?: boolean;
  projectId?: string;
  port?: number | null;
  url?: string | null;
  running?: boolean;
  message?: string;
}

function apiUrl(path: string): string {
  return path;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(apiUrl("/api/projects"));
  const data = await handle<any>(res);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.projects)) {
    return data.projects;
  }

  return [];
}

export async function startRuntime(
  projectId: string,
): Promise<RuntimeStatus> {
  const res = await fetch(
    apiUrl(`/api/dev/runtime?projectId=${encodeURIComponent(projectId)}`),
  );
  return handle<RuntimeStatus>(res);
}

export async function getRuntime(
  projectId?: string,
): Promise<RuntimeStatus> {
  const qs = projectId
    ? `?projectId=${encodeURIComponent(projectId)}`
    : "";

  const res = await fetch(apiUrl(`/api/dev/runtime${qs}`));
  return handle<RuntimeStatus>(res);
}

export async function getPreview(
  projectId: string,
): Promise<RuntimeStatus> {
  const res = await fetch(
    apiUrl(`/api/dev/preview?projectId=${encodeURIComponent(projectId)}`),
  );
  return handle<RuntimeStatus>(res);
}

export async function deleteProject(
  projectId: string,
): Promise<{ ok: boolean; deleted?: boolean; error?: string }> {
  const res = await fetch(
    apiUrl(`/api/projects/${encodeURIComponent(projectId)}`),
    {
      method: "DELETE",
    },
  );

  return handle<{
    ok: boolean;
    deleted?: boolean;
    error?: string;
  }>(res);
}
