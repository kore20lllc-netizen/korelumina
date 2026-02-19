type PageProps = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export default async function BuilderPage(props: PageProps) {
  const { workspaceId, projectId } = await props.params;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Builder – {workspaceId}/{projectId}
      </h1>
    </div>
  );
}
