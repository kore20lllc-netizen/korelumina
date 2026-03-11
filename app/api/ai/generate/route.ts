import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.json();

  const prompt = body?.prompt || "build a simple SaaS dashboard";

  const projectId =
    "gen-" + Math.floor(Date.now()/1000);

  await fetch("http://localhost:3000/api/ai/scaffold", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ projectId })
  });

  await fetch("http://localhost:3000/api/ai/plan", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      workspaceId:"default",
      projectId,
      spec:prompt
    })
  });

  await fetch("http://localhost:3000/api/ai/task", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      workspaceId:"default",
      projectId
    })
  });

  return NextResponse.json({
    ok:true,
    projectId,
    builderUrl:`/workspaces/default/projects/${projectId}/builder`
  });
}
