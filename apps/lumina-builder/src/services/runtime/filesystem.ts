import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

export interface RuntimeFileListResponse {
  ok: boolean;
  projectId: string;
  files: string[];
  error?: string;
}

export interface RuntimeFileReadResponse {
  ok: boolean;
  projectId: string;
  file: string;
  content: string;
  sha256: string;
  error?: string;
}

export interface RuntimeFileWriteResponse {
  ok: boolean;
  projectId: string;
  file: string;
  sha256?: string;
  currentSha256?: string;
  error?: string;
}

export async function listRuntimeFiles(
  projectId: string,
): Promise<string[]> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/fs/list?projectId=${encodeURIComponent(projectId)}`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  const data =
    (await response.json()) as RuntimeFileListResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ??
      "failed_to_list_files",
    );
  }

  return Array.isArray(data.files)
    ? data.files
    : [];
}

export async function readRuntimeFile(
  projectId: string,
  file: string,
): Promise<RuntimeFileReadResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/fs/read?projectId=${encodeURIComponent(projectId)}&file=${encodeURIComponent(file)}`,
    {
      headers: getRuntimeCallerHeaders(),
    },
  );

  const data =
    (await response.json()) as RuntimeFileReadResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ??
      "failed_to_read_file",
    );
  }

  return data;
}

export async function writeRuntimeFile(input: {
  projectId: string;
  file: string;
  content: string;
  expectedSha256?: string;
}): Promise<RuntimeFileWriteResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/fs/write`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(input),
    },
  );

  const data =
    (await response.json()) as RuntimeFileWriteResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ??
      "failed_to_write_file",
    );
  }

  return data;
}
