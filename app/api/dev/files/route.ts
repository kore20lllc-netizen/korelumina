import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest) {
  try {

    const projectId = req.nextUrl.searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ ok:false, error:"missing projectId" }, { status:400 })
    }

    const root = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId
    )

    const files: string[] = []

    async function walk(dir:string, base="") {
      const entries = await fs.readdir(dir,{ withFileTypes:true })

      for (const e of entries) {
        const full = path.join(dir,e.name)
        const rel = path.join(base,e.name)

        if (e.isDirectory()) {
          await walk(full,rel)
        } else {
          files.push(rel)
        }
      }
    }

    await walk(root)

    return NextResponse.json({
      ok:true,
      files
    })

  } catch (err:any) {

    console.error("FILES API ERROR:", err)

    return NextResponse.json({
      ok:false,
      error:String(err)
    }, { status:500 })
  }
}
