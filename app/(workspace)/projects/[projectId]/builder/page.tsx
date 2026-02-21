import BuilderClient from "./BuilderClient";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <BuilderClient projectId={projectId} />;
}
