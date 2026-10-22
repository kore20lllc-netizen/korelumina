import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  auditAdvisories,
  parseNpmAudit,
  scanCodeRisks,
  scanSecrets,
  takeRepositoryInventory,
  takeRepositorySnapshot,
  type AuditCommandRunner,
} from "../index.js";

/*
 * MS-2026-0012: security analysis. Credentials below are assembled at run
 * time so the repository never contains a string shaped like a real key.
 */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-security-analysis-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

const fake = {
  github: ["gh", "p_", "A1b2C3d4".repeat(5)].join(""),
  stripe: ["sk", "_live_", "Z9y8X7w6".repeat(4)].join(""),
  aws: ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
  privateKey: ["-----BEGIN ", "RSA PRIVATE KEY-----"].join(""),
  jwt: (role: string) =>
    [
      Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
      Buffer.from(JSON.stringify({ iss: "supabase", role })).toString("base64url"),
      "c2lnbmF0dXJlLXNpZ25hdHVyZQ",
    ].join("."),
};

test("committed credentials are found by kind and line, never by value", () => {
  const files = {
    ".gitignore": ".env.local\n",
    "src/config.ts": `export const token = "${fake.github}";\nexport const stripe = "${fake.stripe}";\n`,
    "deploy/key.pem": `${fake.privateKey}\nMIIEow\n`,
    "src/aws.ts": `const id = "${fake.aws}";\n`,
    "src/supabase.ts": `const admin = "${fake.jwt("service_role")}";\nconst anon = "${fake.jwt("anon")}";\n`,
    "src/db.ts": 'const ok = "postgres://user:password@localhost/db";\n',
    ".env": `STRIPE_SECRET=${fake.stripe}\n`,
    ".env.local": `GITHUB_TOKEN=${fake.github}\n`,
    ".env.example": "STRIPE_SECRET=\n",
    "package-lock.json": `{"note": "${fake.github}"}`,
  };
  const { findings } = scanSecrets(takeRepositorySnapshot(repository(files)));
  const summary = findings.map((finding) => `${finding.rule} ${finding.evidence[0]!.file}:${finding.evidence[0]!.line ?? ""} ${finding.severity}`).sort();
  assert.deepEqual(summary, [
    "security.environment-file-committed .env: medium",
    "security.secret.aws-access-key src/aws.ts:1 high",
    "security.secret.github-token src/config.ts:1 critical",
    "security.secret.private-key deploy/key.pem:1 critical",
    "security.secret.stripe-secret .env:1 critical",
    "security.secret.stripe-secret src/config.ts:2 critical",
    "security.secret.supabase-service-role src/supabase.ts:1 critical",
  ]);
  const everything = JSON.stringify(findings);
  for (const value of [fake.github, fake.stripe, fake.aws, fake.jwt("service_role")]) assert.equal(everything.includes(value), false);
  assert.equal(findings.every((finding) => finding.evidence.every((evidence) => evidence.excerpt === undefined)), true);
});

test("risky code is found in code, not in comments, strings or other methods", () => {
  const { findings } = scanCodeRisks(
    takeRepositorySnapshot(
      repository({
        "src/run.ts": [
          'import { exec, spawn } from "node:child_process";',
          "exec(`npm install ${name}`);",
          "while ((match = pattern.exec(content))) {}",
          'spawn(cmd, args, { shell: true });',
          "// eval(userInput)",
          'const text = "eval(x) is bad";',
          "const result = eval(code);",
          "const agent = new https.Agent({ rejectUnauthorized: false });",
          "app.use(cors());",
          "const token = Math.random().toString(36);",
          "db.query(`SELECT * FROM users WHERE id = ${id}`);",
        ].join("\n"),
        "src/regex.ts": "while ((m = re.exec(s))) {}\nexec(command);\n",
        "src/page.tsx": [
          "<div dangerouslySetInnerHTML={{ __html: message }} />",
          '<script type="application/ld+json" dangerouslySetInnerHTML={{',
          "  __html: JSON.stringify(data),",
          "}} />",
          "element.innerHTML = html;",
        ].join("\n"),
        "archive/old.js": "eval(x);\n",
      }),
    ),
  );
  const summary = findings.map((finding) => `${finding.rule.replace("security.code.", "")} ${finding.evidence[0]!.file}:${finding.evidence[0]!.line} ${finding.severity}`).sort();
  assert.deepEqual(summary, [
    "cors-any-origin src/run.ts:9 medium",
    "dangerously-set-inner-html src/page.tsx:1 medium",
    "dangerously-set-inner-html src/page.tsx:2 low",
    "eval archive/old.js:1 low",
    "eval src/run.ts:7 high",
    "inner-html src/page.tsx:5 medium",
    "insecure-random-secret src/run.ts:10 medium",
    "shell-command-interpolation src/run.ts:2 high",
    "spawn-shell src/run.ts:4 medium",
    "sql-string-building src/run.ts:11 high",
    "tls-verification-disabled src/run.ts:8 high",
  ]);
});

const NPM_AUDIT = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    axios: {
      name: "axios",
      severity: "high",
      isDirect: true,
      range: "<1.7.4",
      via: [{ source: 1097679, title: "Server-Side Request Forgery in axios", url: "https://github.com/advisories/GHSA-8hc4-vh64-cxmj" }],
      fixAvailable: { name: "axios", version: "1.7.9", isSemVerMajor: false },
    },
    "follow-redirects": { name: "follow-redirects", severity: "moderate", isDirect: false, range: "<=1.15.5", via: ["axios"], fixAvailable: true },
  },
});

test("npm audit results become findings with their advisories and fixes", () => {
  const { findings, error } = parseNpmAudit(NPM_AUDIT, "package-lock.json");
  assert.equal(error, null);
  assert.deepEqual(
    findings.map((finding) => [finding.severity, finding.title, finding.remedy]),
    [
      ["high", "axios: Server-Side Request Forgery in axios", "Upgrade axios to 1.7.9."],
      ["medium", "follow-redirects is vulnerable through axios", "npm audit fix resolves it without breaking changes."],
    ],
  );
  assert.match(findings[0]!.detail, /GHSA-8hc4-vh64-cxmj/);
});

test("advisories are reported unavailable, never clean, when the audit cannot run", async () => {
  const blocked: AuditCommandRunner = async () => ({
    stdout: JSON.stringify({ message: "403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick", statusCode: 403, error: { summary: "", detail: "" } }),
    stderr: "",
    exitCode: 1,
    timedOut: false,
  });
  const npmProject = repository({ "package.json": JSON.stringify({ dependencies: { axios: "^1.0.0" } }), "package-lock.json": "{}" });
  const offline = await auditAdvisories(npmProject, takeRepositoryInventory(takeRepositorySnapshot(npmProject)), { run: blocked, now: () => 7 });
  assert.deepEqual(
    { status: offline.status, findings: offline.findings.length, checkedAt: offline.checkedAt },
    { status: "unavailable", findings: 0, checkedAt: 7 },
  );
  assert.match(offline.reason!, /could not be reached \(403 Forbidden/);

  const pnpmProject = repository({ "package.json": "{}", "pnpm-lock.yaml": "" });
  const pnpm = await auditAdvisories(pnpmProject, takeRepositoryInventory(takeRepositorySnapshot(pnpmProject)), { run: blocked });
  assert.equal(pnpm.status, "unavailable");
  assert.match(pnpm.reason!, /uses pnpm/);

  const ok: AuditCommandRunner = async () => ({ stdout: NPM_AUDIT, stderr: "", exitCode: 1, timedOut: false });
  const checked = await auditAdvisories(npmProject, takeRepositoryInventory(takeRepositorySnapshot(npmProject)), { run: ok });
  assert.deepEqual({ status: checked.status, high: checked.counts.high, medium: checked.counts.medium }, { status: "checked", high: 1, medium: 1 });
});
