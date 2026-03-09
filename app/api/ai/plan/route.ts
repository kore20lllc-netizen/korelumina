import { NextResponse } from "next/server"
import OpenAI from "openai"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const workspaceId = body?.workspaceId
    const projectId = body?.projectId
    const spec = body?.spec

    if (!workspaceId || !projectId || !spec) {
      return NextResponse.json(
        { error: "workspaceId, projectId, spec required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const client = new OpenAI({ apiKey })

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
Return a JSON plan describing which files will be created or modified.

Rules:
- JSON only
- No markdown
- No explanation

Format:

{
  "plan":[
    {
      "path":"src/file.ts",
      "action":"create"
    }
  ]
}

Task:
${spec}
`
    })

    const text = completion.output_text ?? ""

    const parsed = JSON.parse(text)

    return NextResponse.json({
      ok: true,
      ...parsed
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Plan failed" },
      { status: 500 }
    )
  }
}
