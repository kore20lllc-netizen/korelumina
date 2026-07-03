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

export function KnowledgeOverviewPanel({
  snapshot,
}: Props) {
  const cards = [
    {
      title: "Repositories",
      value:
        snapshot?.repositories.total ?? 0,
    },
    {
      title: "Evidence",
      value:
        snapshot?.evidence.total ?? 0,
    },
    {
      title: "Candidate Knowledge",
      value:
        snapshot?.knowledge.candidates ?? 0,
    },
    {
      title: "Canonical Knowledge",
      value:
        snapshot?.knowledge.canonicalItems ?? 0,
    },
    {
      title: "Provider Coverage",
      value:
        `${snapshot?.providers.active ?? 0}/${snapshot?.providers.total ?? 0}`,
    },
    {
      title: "Recovery",
      value:
        snapshot?.recovery.status ?? "Idle",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="text-sm">
              {card.title}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-semibold">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
