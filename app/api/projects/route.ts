import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { detectProject } from "@/lib/project-detection";

const PROJECTS_ROOT = path.join(
  process.cwd(),
  "runtime/workspaces/default/projects"
);

type DetectedProject = ReturnType<typeof detectProject>;

const FALLBACK_DETECTED: DetectedProject = {
  framework: "unknown",
  runtime: "unknown",
  packageManager: "unknown",
  installCommand: null,
  devCommand: null,
  entry: null,
};

export async function GET() {
  if (!fs.existsSync(PROJECTS_ROOT)) {
    return NextResponse.json({
      ok: true,
      projects: [],
    });
  }

  const entries = fs
    .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  const projects = entries.map((entry) => {
    const projectId = entry.name;
    const projectPath = path.join(PROJECTS_ROOT, projectId);

    let detected: DetectedProject;

    try {
      detected = detectProject(projectPath);
    } catch {
      detected = FALLBACK_DETECTED;
    }

    return {
      id: projectId,
      name: projectId,
      path: projectPath,
      detected,
    };
  });

  return NextResponse.json({
    ok: true,
    projects,
  });
}
