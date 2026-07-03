import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";

interface Props {
  snapshot:
    KnowledgeOperationsSnapshot | null;
}

function value(
  text: string | number | undefined,
) {
  return text ?? "—";
}

export function AcquisitionActivityPanel({
  snapshot,
}: Props) {
  const acquisition =
    snapshot?.acquisition;

  const rows = [
    {
      label: "Status",
      value: value(acquisition?.status),
    },
    {
      label: "Repository",
      value: value(acquisition?.repository),
    },
    {
      label: "Stage",
      value: value(acquisition?.stage),
    },
    {
      label: "Files Scanned",
      value: value(acquisition?.filesScanned),
    },
    {
      label: "Evidence",
      value: value(acquisition?.evidenceExtracted),
    },
    {
      label: "Elapsed",
      value: value(acquisition?.elapsed),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Acquisition Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b pb-2 last:border-0"
          >
            <span className="text-sm text-muted-foreground">
              {row.label}
            </span>

            <span className="font-medium">
              {row.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
