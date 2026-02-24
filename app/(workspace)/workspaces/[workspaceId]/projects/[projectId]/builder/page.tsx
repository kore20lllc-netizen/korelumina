import Shell from "./shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
};

export default async function BuilderPage({ params }: PageProps) {
  const { workspaceId, projectId } = await params;
  return <Shell workspaceId={workspaceId} projectId={projectId} />;
}
