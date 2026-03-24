import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") || "default";

  try{

    const file = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId,
      ".journal.json"
    );

    const raw = await fs.readFile(file,"utf8");

    const entries = JSON.parse(raw);

    return NextResponse.json({
      ok:true,
      entries
    });

  }catch{

    return NextResponse.json({
      ok:true,
      entries:[]
    });

  }

}
