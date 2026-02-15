import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGISTRY = path.join(process.cwd(), "data/projects.json");
const PROJECTS_DIR = path.join(process.cwd(), "projects");

function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) return [];
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

function saveRegistry(data: any) {
  fs.writeFileSync(REGISTRY, JSON.stringify(data, null, 2));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, repo } = body;

  if (!name || !repo) {
    return NextResponse.json(
      { error: "Missing name or repo" },
      { status: 400 }
    );
  }

  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const projectPath = path.join(PROJECTS_DIR, id);

  if (fs.existsSync(projectPath)) {
    return NextResponse.json(
      { error: "Project already exists" },
      { status: 409 }
    );
  }

  try {
    execSync(`git clone ${repo} ${projectPath}`, {
      stdio: "inherit",
    });
  } catch {
    return NextResponse.json(
      { error: "Git clone failed" },
      { status: 500 }
    );
  }

  const registry = loadRegistry();

  registry.push({
    id,
    name,
    repo,
    createdAt: new Date().toISOString(),
  });

  saveRegistry(registry);

  return NextResponse.json({
    status: "imported",
    id,
  });
}
