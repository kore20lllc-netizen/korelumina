import BuilderClient from "@/components/builder/BuilderClient";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const workspaceId = "default";

  return (
    <BuilderClient
      projectId={projectId}
      workspaceId={workspaceId}
    />
  );
}
