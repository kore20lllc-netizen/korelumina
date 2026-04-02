export async function POST(req: Request) {
  const { projectId, prompt } = await req.json();

  // ❌ NO file writes here
  const drafts = [
    {
      file: "app/page.tsx",
      code: `export default function Page() {
  return <div style={{padding:40,fontSize:32}}>AI: ${prompt}</div>;
}`,
    },
  ];

  return Response.json({
    ok: true,
    projectId,
    drafts,
  });
}
