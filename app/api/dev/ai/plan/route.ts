import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = body.prompt || "";

  // 🔥 MOCK PLANNER (replace later with real LLM)
  return Response.json({
    ok: true,
    plan: [
      {
        path: "app/page.tsx",
        action: "update",
        description: `Update UI based on: ${prompt}`,
      }
    ]
  });
}
