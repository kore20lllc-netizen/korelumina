import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGISTRY = path.join(process.cwd(), "data/projects.json");

export async function GET() {
  if (!fs.existsSync(REGISTRY)) {
    return NextResponse.json([]);
  }

  const data = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));

  return NextResponse.json(data);
}
