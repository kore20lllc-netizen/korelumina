export async function POST(req: Request) {
  const { projectId, spec } = await req.json();

  // 🔥 TEMP: echo prompt into code (proves pipeline works)
  const code = `
export default function Page() {
  return <div style={{padding:40,fontSize:32}}>AI: ${spec}</div>;
}
`;

  return new Response(
    JSON.stringify({
      ok: true,
      files: [
        {
          file: "app/page.tsx",
          code,
        },
      ],
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
