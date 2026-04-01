export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(){

  const tickFile = path.join(
    process.cwd(),
    ".kore_runtime",
    "tick"
  )

  try{
    const tick = await fs.readFile(tickFile,"utf8")
    return NextResponse.json({ ok:true, tick: Number(tick) || 0 })
  }catch{
    return NextResponse.json({ ok:true, tick: 0 })
  }

}
