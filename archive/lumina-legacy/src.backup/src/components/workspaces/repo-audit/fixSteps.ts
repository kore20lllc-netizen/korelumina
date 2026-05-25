import type {
  MissingDependency,
  BuildError,
  EnvVar,
  SecurityFinding,
} from "@/services/repoAuditService";

export interface FixGuide {
  explanation: string;
  steps: string[];
  commands?: string[];
  docsLabel?: string;
  docsUrl?: string;
}

export function dependencyFix(d: MissingDependency): FixGuide {
  const missing = d.found === null;
  return {
    explanation: missing
      ? `\`${d.name}\` is referenced in the codebase but not installed. The build cannot resolve its imports until the package is added at version ${d.required}.`
      : `\`${d.name}\` is installed at ${d.found}, but the project requires ${d.required}. The mismatch can cause type errors and runtime drift.`,
    steps: [
      missing
        ? `Add \`${d.name}\` to package.json under "dependencies".`
        : `Bump \`${d.name}\` to ${d.required} in package.json.`,
      `Run the install command to update the lockfile.`,
      `Restart the dev server and re-run the audit to confirm the issue is resolved.`,
      ...(d.severity === "critical" || d.severity === "high"
        ? [`Review the package changelog for breaking changes before merging.`]
        : []),
    ],
    commands: [missing ? `npm install ${d.name}@${d.required}` : `npm install ${d.name}@${d.required}`],
    docsLabel: "View on npm",
    docsUrl: `https://www.npmjs.com/package/${d.name}`,
  };
}

export function buildErrorFix(e: BuildError): FixGuide {
  const code = e.code ?? "";
  if (code === "TS2307") {
    return {
      explanation: `TypeScript cannot resolve a module imported in \`${e.file}\`. This usually means the package is missing or the import path is wrong.`,
      steps: [
        `Open \`${e.file}\` at line ${e.line} and verify the import path.`,
        `If it is a third-party package, install it and confirm the import name matches.`,
        `If it is a local module, check that the file exists and the path casing is correct.`,
        `Re-run the audit after fixing the import.`,
      ],
    };
  }
  if (code === "TS2322" || code === "TS2339") {
    return {
      explanation: `Type mismatch detected at \`${e.file}:${e.line}\`. The value's type doesn't satisfy what the surrounding code expects.`,
      steps: [
        `Inspect the type of the expression at line ${e.line}.`,
        `Narrow the type with a guard, or update the consumer to accept the actual type.`,
        `Avoid \`as any\` casts — fix the underlying type instead.`,
        `Re-run the audit to confirm the error is cleared.`,
      ],
    };
  }
  return {
    explanation: `Build error in \`${e.file}\` at line ${e.line}: ${e.message}`,
    steps: [
      `Open \`${e.file}\` at line ${e.line}.`,
      `Apply the fix suggested by the compiler message.`,
      `Run a local build and re-run the audit.`,
    ],
  };
}

export function envFix(e: EnvVar): FixGuide {
  const missing = e.required && !e.present;
  return {
    explanation: missing
      ? `\`${e.key}\` is required at runtime but is not present in the environment. The feature relying on it will fail to initialize.`
      : `\`${e.key}\` is optional but recommended for ${e.description.toLowerCase()}.`,
    steps: [
      `Locate the source value for \`${e.key}\` from the provider dashboard or your secrets vault.`,
      `Add it to a local \`.env\` file and to your deployment environment.`,
      `Restart the dev server so the new value is picked up.`,
      `Re-run the audit to confirm the variable is now detected.`,
    ],
    commands: [`echo "${e.key}=your-value" >> .env`],
  };
}

export function securityFix(f: SecurityFinding): FixGuide {
  return {
    explanation: `${f.title} — affects the \`${f.package}\` package.${f.fixedIn ? ` Patched in version ${f.fixedIn}.` : ""}`,
    steps: [
      f.fixedIn
        ? `Upgrade \`${f.package}\` to \`${f.fixedIn}\` or later in package.json.`
        : `Pin \`${f.package}\` to the latest published version.`,
      `Run the install command to refresh the lockfile.`,
      `Run \`npm audit\` to confirm the advisory is cleared.`,
      f.severity === "critical" || f.severity === "high"
        ? `Notify the on-call engineer; high-severity advisories should ship same-day.`
        : `Schedule a regression test pass after the upgrade.`,
    ],
    commands: f.fixedIn ? [`npm install ${f.package}@${f.fixedIn}`] : [`npm install ${f.package}@latest`],
    docsLabel: f.id.startsWith("GHSA") ? "View advisory" : undefined,
    docsUrl: f.id.startsWith("GHSA") ? `https://github.com/advisories/${f.id}` : undefined,
  };
}