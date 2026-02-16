import { notFound } from "next/navigation";

interface BuilderPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { projectId } = await params;

  if (!projectId) {
    notFound();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Builder: {projectId}</h1>
      <p>Workspace build interface ready.</p>
    </div>
  );
}
