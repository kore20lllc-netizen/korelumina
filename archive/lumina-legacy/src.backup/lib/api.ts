export interface Project {
  id: string;
  name: string;
  framework?: string;
  updatedAt?: string;
}

export interface RuntimeStatus {
  ok: boolean;
  projectId: string;
  framework?: string;
  port?: number;
  url?: string;
  status?: string;
}

async function request<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error || `Request failed with status ${res.status}`,
    );
  }

  return data as T;
}

export async function fetchProjects(): Promise<Project[]> {
  const data = await request<{ projects?: Project[] }>("/api/projects");
  return data.projects || [];
}

export async function importRepo(repoUrl: string) {
  return request("/api/dev/import", {
    method: "POST",
    body: JSON.stringify({ repoUrl }),
  });
}

export async function importZip(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/dev/import-zip", {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "ZIP import failed");
  }

  return data;
}

export async function startRuntime(
  projectId: string,
): Promise<RuntimeStatus> {
  return request<RuntimeStatus>(
    `/api/dev/runtime?projectId=${encodeURIComponent(projectId)}`,
  );
}

export async function getPreview(
  projectId: string,
): Promise<RuntimeStatus> {
  return request<RuntimeStatus>(
    `/api/dev/preview?projectId=${encodeURIComponent(projectId)}`,
  );
}
