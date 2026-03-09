import Shell from "./shell"

export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>
}) {
  const { workspaceId, projectId } = await params

  return (
    <Shell
      workspaceId={workspaceId}
      projectId={projectId}
    />
  )
}
