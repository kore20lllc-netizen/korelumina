interface Props {
  acquisition: unknown;
}

export function KnowledgeAcquisitionPanel({
  acquisition,
}: Props) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">
        Knowledge Acquisition
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Source ingestion pipeline overview.
      </p>

      <pre className="mt-6 overflow-auto rounded-xl border border-white/10 bg-black/20 p-4 text-xs">
{JSON.stringify(acquisition, null, 2)}
      </pre>
    </div>
  );
}
