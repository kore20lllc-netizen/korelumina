import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.json();
  const name = body?.name || "new-project";

  const projectId =
    name.toLowerCase().replace(/\s+/g,"-") +
    "-" +
    Math.floor(Date.now()/1000);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ai/scaffold`,
    {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ projectId })
    }
  );

  await res.json();

  return NextResponse.json({
    ok:true,
    projectId,
    builderUrl:`/workspaces/default/projects/${projectId}/builder`
  });
}
