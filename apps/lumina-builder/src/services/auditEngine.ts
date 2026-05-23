import { uid } from "@/lib/persistence";
import type { ImportedRepo } from "@/providers/types";

export type Severity = "low" | "medium" | "high" | "critical";
export interface Finding { id: string; category: "dependency" | "security" | "typescript" | "env" | "build"; severity: Severity; title: string; detail: string; file?: string; suggestion?: string }
export interface RepairStep { id: string; title: string; etaMinutes: number; patch?: string }
export interface RepairPlan { findings: Finding[]; steps: RepairStep[]; totalEtaMinutes: number }

const KNOWN_VULN = new Set(["lodash@4.17.20", "axios@0.21.0", "node-fetch@2.6.0"]);

export function runAudit(repo: ImportedRepo): RepairPlan {
  const findings: Finding[] = [];

  // Dependency: imports referenced in files but not in deps
  const importRegex = /from\s+["']([^."'/][^"']*)["']/g;
  const used = new Set<string>();
  for (const content of Object.values(repo.files)) {
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(content))) used.add(m[1].split("/")[0]);
  }
  for (const dep of used) {
    if (!repo.dependencies[dep] && !["react", "react-dom"].includes(dep)) {
      findings.push({ id: uid("f"), category: "dependency", severity: "medium", title: `Missing dependency: ${dep}`, detail: `${dep} is imported but not declared in package.json.`, suggestion: `Run npm install ${dep}` });
    }
  }

  // Security: known vulnerable versions
  for (const [name, version] of Object.entries(repo.dependencies)) {
    const key = `${name}@${version.replace(/^[^\d]*/, "")}`;
    if (KNOWN_VULN.has(key)) findings.push({ id: uid("f"), category: "security", severity: "high", title: `Vulnerable package: ${key}`, detail: "Known CVE in this version.", suggestion: `Upgrade ${name}` });
  }

  // Env: process.env.X references not in .env
  const envFile = repo.files[".env"] ?? "";
  const envKeys = new Set([...envFile.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]));
  const envRegex = /process\.env\.([A-Z0-9_]+)/g;
  const referenced = new Set<string>();
  for (const content of Object.values(repo.files)) {
    let m: RegExpExecArray | null;
    while ((m = envRegex.exec(content))) referenced.add(m[1]);
  }
  for (const k of referenced) if (!envKeys.has(k)) findings.push({ id: uid("f"), category: "env", severity: "low", title: `Missing env var: ${k}`, detail: `${k} is referenced in code but not defined in .env.` });

  // Build: synthetic check
  if (!repo.files["tsconfig.json"]) findings.push({ id: uid("f"), category: "build", severity: "low", title: "Missing tsconfig.json", detail: "TypeScript projects should include a tsconfig.json." });

  const steps: RepairStep[] = findings.map((f) => ({ id: uid("s"), title: `Fix: ${f.title}`, etaMinutes: f.severity === "critical" ? 30 : f.severity === "high" ? 15 : f.severity === "medium" ? 8 : 3, patch: f.suggestion }));
  return { findings, steps, totalEtaMinutes: steps.reduce((a, b) => a + b.etaMinutes, 0) };
}