import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = body.prompt || "";

  return Response.json({
    ok: true,
    code: `export default function Page() {
  return <div style={{padding:40,fontSize:40}}>AI: ${prompt}</div>
}`
  });
}
