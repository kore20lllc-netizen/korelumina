export type StageTelemetry = {
  label: string;
  value: string;
};

const TELEMETRY: Record<string, StageTelemetry> = {
  acquisition: { label: "Sources", value: "—" },
  ir: { label: "Documents", value: "—" },
  validation: { label: "Confidence", value: "—" },
  compiler: { label: "Artifacts", value: "—" },
  canonical: { label: "Published", value: "—" },
  graph: { label: "Relationships", value: "—" },
  memory: { label: "Knowledge", value: "—" },
};

export function getStageTelemetry(
  stageId: string,
): StageTelemetry {
  return (
    TELEMETRY[stageId] ?? {
      label: "Metric",
      value: "—",
    }
  );
}
