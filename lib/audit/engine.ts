import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface MissingDependency {
  name: string;
  required: string;
  found: string | null;
  severity: "low" | "medium" | "high" | "critical";
}

export interface BuildError {
  file: string;
  line: number;
  message: string;
  code?: string;
}

export interface EnvVar {
  key: string;
  description: string;
  present: boolean;
  required: boolean;
}

export interface SecurityFinding {
  id: string;
  package: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  fixedIn?: string;
}

export interface RepairStep {
  id: string;
  title: string;
  detail: string;
  estMinutes: number;
  automated: boolean;
}

export interface AuditReport {
  projectId: string;
  generatedAt: string;
  buildStatus: "passing" | "warning" | "failing";
  typeErrors: number;
  estimatedFixMinutes: number;
  missingDependencies: MissingDependency[];
  buildErrors: BuildError[];
  envVars: EnvVar[];
  securityFindings: SecurityFinding[];
  repairPlan: RepairStep[];
}

function safeReadJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getProjectPath(projectId: string): string {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );
}

function detectMissingDeps(projectPath: string): MissingDependency[] {
  const pkg = safeReadJson(path.join(projectPath, "package.json")) || {};

  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const required = ["typescript", "react", "lucide-react"];

  if (deps.next) required.push("next");
  else if (deps.vite) required.push("vite");

  return required
    .filter((name) => deps[name] === undefined)
    .map((name) => ({
      name,
      required: "latest",
      found: null,
      severity: name === "typescript" ? "high" : "medium",
    }));
}

function detectEnvVars(projectPath: string): EnvVar[] {
  const envFiles = [".env", ".env.local", ".env.example"];
  const content = envFiles
    .map((file) => path.join(projectPath, file))
    .filter((file) => fs.existsSync(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ];

  return keys.map((key) => ({
    key,
    description: "Environment variable",
    present: content.includes(`${key}=`),
    required: false,
  }));
}

function runBuild(projectPath: string): {
  buildStatus: "passing" | "warning" | "failing";
  typeErrors: number;
  buildErrors: BuildError[];
} {
  const pkg = safeReadJson(path.join(projectPath, "package.json"));

  if (!pkg?.scripts?.build) {
    return {
      buildStatus: "warning",
      typeErrors: 0,
      buildErrors: [
        {
          file: "package.json",
          line: 1,
          message: "No build script found.",
        },
      ],
    };
  }

  try {
    execSync("NODE_OPTIONS='--max-old-space-size=8192' npm run build", {
      cwd: projectPath,
      stdio: "pipe",
      encoding: "utf8",
      timeout: 45 * 60 * 1000,
      maxBuffer: 50 * 1024 * 1024,
      shell: "/bin/zsh",
    });

    return {
      buildStatus: "passing",
      typeErrors: 0,
      buildErrors: [],
    };
  } catch (error: any) {
    const output = [
      error?.stdout?.toString?.() || "",
      error?.stderr?.toString?.() || "",
      error?.message || "",
    ].join("\n");

    const typeErrors = (output.match(/TS\d+/g) || []).length;

    return {
      buildStatus: "failing",
      typeErrors,
      buildErrors: [
        {
          file: "build",
          line: 1,
          message: output.slice(0, 5000),
        },
      ],
    };
  }
}

function generateRepairPlan(
  missingDependencies: MissingDependency[],
  buildErrors: BuildError[],
  envVars: EnvVar[]
): RepairStep[] {
  const steps: RepairStep[] = [];

  if (missingDependencies.length > 0) {
    steps.push({
      id: "deps",
      title: "Install missing dependencies",
      detail: missingDependencies.map((d) => d.name).join(", "),
      estMinutes: 10,
      automated: true,
    });
  }

  if (buildErrors.length > 0) {
    steps.push({
      id: "build",
      title: "Resolve build errors",
      detail: `Fix ${buildErrors.length} build error(s).`,
      estMinutes: 30,
      automated: false,
    });
  }

  if (envVars.some((v) => !v.present && v.required)) {
    steps.push({
      id: "env",
      title: "Configure environment variables",
      detail: "Populate missing required environment variables.",
      estMinutes: 15,
      automated: false,
    });
  }

  return steps;
}

export async function runRepoAudit(
  projectId: string,
  mode: "scan" | "deep" = "scan"
): Promise<AuditReport> {
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const missingDependencies = detectMissingDeps(projectPath);
  const envVars = detectEnvVars(projectPath);

  const build =
    mode === "deep"
      ? runBuild(projectPath)
      : {
          buildStatus: "warning" as const,
          typeErrors: 0,
          buildErrors: [
            {
              file: "build",
              line: 1,
              message: "Fast scan mode enabled. Full build execution skipped.",
            },
          ],
        };

  const securityFindings: SecurityFinding[] = [];

  const repairPlan = generateRepairPlan(
    missingDependencies,
    build.buildErrors,
    envVars
  );

  const estimatedFixMinutes = repairPlan.reduce(
    (sum, step) => sum + step.estMinutes,
    0
  );

  return {
    projectId,
    generatedAt: new Date().toISOString(),
    buildStatus: build.buildStatus,
    typeErrors: build.typeErrors,
    estimatedFixMinutes,
    missingDependencies,
    buildErrors: build.buildErrors,
    envVars,
    securityFindings,
    repairPlan,
  };
}
