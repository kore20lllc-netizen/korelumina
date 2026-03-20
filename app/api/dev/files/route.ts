import { ensureProjectRoot } from "@/runtime/fs/ensureProjectRoot";
import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ ok: false, files: [] })
  }

  const root = path.join(
    process.env.KORE_RUNTIME_ROOT!,
    "workspaces",
    "default",
    "projects",
    projectId
  )

  const files: string[] = []

  async function walkSafe(dir: string, base = "") {
    let entries: any[] = []

    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const e of entries) {
      const full = path.join(dir, e.name)
      const rel = path.join(base, e.name)

      if (e.isDirectory()) {
        await walkSafe(full, rel)
      } else {
        files.push(rel)
      }
    }
  }

  try {
    await walkSafe(root)
  } catch {
    // never crash
  }

  return NextResponse.json({
    ok: true,
    files
  })
}
