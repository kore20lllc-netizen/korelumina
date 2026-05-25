const RUNTIME_API =
  import.meta.env.VITE_RUNTIME_API ||
  "http://localhost:4100";

type RuntimeStartResponse = {
  ok: boolean;
  runtime?: {
    projectId: string;
    port: number;
    url: string;
  };
};

export async function startRuntime(
  projectId: string,
) {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/start`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        projectId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "runtime_start_failed",
    );
  }

  const data: RuntimeStartResponse =
    await response.json();

  if (!data.ok || !data.runtime) {
    throw new Error(
      "runtime_start_failed",
    );
  }

  return data.runtime;
}

export async function getRuntimeStatus(
  projectId: string,
) {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/status?projectId=${projectId}`,
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}
