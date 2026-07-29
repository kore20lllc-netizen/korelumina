import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

export async function getRuntimeMetrics(): Promise<RuntimeMetricsResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/metrics`,
    {
      headers:
        getRuntimeCallerHeaders(),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "failed_to_get_runtime_metrics",
    );
  }

  return data as RuntimeMetricsResponse;
}
