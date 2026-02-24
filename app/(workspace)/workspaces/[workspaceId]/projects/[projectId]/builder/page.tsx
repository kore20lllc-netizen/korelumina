import Shell from "./shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    workspaceId: string;
    projectId: string;
  };
};

export default function BuilderPage({ params }: PageProps) {
  return <Shell workspaceId={params.workspaceId} projectId={params.projectId} />;
}
