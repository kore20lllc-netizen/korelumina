import type { RepositorySnapshot } from "./RepositorySnapshot.js";
import { createFinding, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";
import { ARCHIVED_PATH } from "./DependencyAnalysis.js";

/*
 * MS-2026-0012: credentials committed to a repository. Only formats with
 * a recognizable shape are matched, so a finding is almost always real.
 * A finding states the file, line and kind of credential; the value is
 * never reported, stored or excerpted.
 */

interface SecretRule {
  id: string;
  kind: string;
  expression: RegExp;
  severity: FindingSeverity;
  /* Returns false to discard a match (e.g. a public Supabase key). */
  confirm?(match: string): boolean;
}

function jwtRole(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as { role?: unknown };
    return typeof decoded.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}

export const SECRET_RULES: readonly SecretRule[] = [
  { id: "private-key", kind: "private key", expression: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g, severity: "critical" },
  { id: "aws-access-key", kind: "AWS access key ID", expression: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, severity: "high" },
  { id: "github-token", kind: "GitHub token", expression: /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{22,255})\b/g, severity: "critical" },
  { id: "gitlab-token", kind: "GitLab token", expression: /\bglpat-[A-Za-z0-9_-]{20,}\b/g, severity: "critical" },
  { id: "slack-token", kind: "Slack token", expression: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g, severity: "high" },
  { id: "slack-webhook", kind: "Slack webhook URL", expression: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}/g, severity: "medium" },
  { id: "stripe-secret", kind: "Stripe live secret key", expression: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g, severity: "critical" },
  { id: "stripe-test-secret", kind: "Stripe test secret key", expression: /\b(?:sk|rk)_test_[A-Za-z0-9]{20,}\b/g, severity: "medium" },
  { id: "google-api-key", kind: "Google API key", expression: /\bAIza[0-9A-Za-z_-]{35}\b/g, severity: "medium" },
  { id: "openai-key", kind: "OpenAI API key", expression: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}\b|\bsk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{40,}\b/g, severity: "critical" },
  { id: "anthropic-key", kind: "Anthropic API key", expression: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{80,}\b/g, severity: "critical" },
  { id: "sendgrid-key", kind: "SendGrid API key", expression: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g, severity: "high" },
  { id: "twilio-key", kind: "Twilio API key", expression: /\bSK[0-9a-fA-F]{32}\b/g, severity: "high" },
  { id: "npm-token", kind: "npm access token", expression: /\bnpm_[A-Za-z0-9]{36}\b/g, severity: "critical" },
  { id: "supabase-secret-key", kind: "Supabase secret key", expression: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g, severity: "critical" },
  {
    id: "supabase-service-role",
    kind: "Supabase service_role key",
    expression: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    severity: "critical",
    confirm: (token) => jwtRole(token) === "service_role",
  },
  {
    id: "database-url-password",
    kind: "database URL with a password",
    expression: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^:\s/"'`@]+:([^@\s"'`]+)@[^\s"'`]+/g,
    severity: "high",
    /* Placeholders like user:password@localhost are not credentials. */
    confirm: (url) => !/:(?:password|pass|secret|changeme|postgres|root|example|\$\{[^}]*\}|<[^>]*>|\*+)@/i.test(url),
  },
];

/* Text files that hold generated or third-party content rather than the project's own. */
const SKIPPED_FOR_SECRETS = /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lock)$|\.min\.(js|css)$|\.map$/;

export interface SecretScan {
  findings: RepositoryFinding[];
  filesScanned: number;
}

export function scanSecrets(snapshot: RepositorySnapshot): SecretScan {
  const findings: RepositoryFinding[] = [];
  let filesScanned = 0;

  for (const file of snapshot.files) {
    if (file.ignored || !file.text || SKIPPED_FOR_SECRETS.test(file.path)) continue;
    const text = snapshot.readSensitive(file.path);
    if (text === null) continue;
    filesScanned += 1;
    const lineStarts = [0];
    for (let index = 0; index < text.length; index += 1) if (text.charCodeAt(index) === 10) lineStarts.push(index + 1);
    const lineOf = (offset: number) => {
      let low = 0;
      let high = lineStarts.length - 1;
      while (low < high) {
        const middle = (low + high + 1) >> 1;
        if (lineStarts[middle]! <= offset) low = middle;
        else high = middle - 1;
      }
      return low + 1;
    };

    const archived = ARCHIVED_PATH.test(file.path);
    for (const rule of SECRET_RULES) {
      const lines = new Set<number>();
      for (const match of text.matchAll(rule.expression)) {
        if (rule.confirm && !rule.confirm(match[0])) continue;
        lines.add(lineOf(match.index!));
      }
      for (const line of [...lines].sort((left, right) => left - right)) {
        const committed = file.tracked === true;
        findings.push(
          createFinding({
            identity: `${file.path}\0${line}`,
            rule: `security.secret.${rule.id}`,
            category: "security",
            severity: file.tracked === false ? "medium" : rule.severity,
            title: `${rule.kind[0]!.toUpperCase()}${rule.kind.slice(1)} in ${file.path}`,
            detail: `Line ${line} of ${file.path} contains what has the exact format of a ${rule.kind}${
              committed ? ". The file is committed, so the value is in the repository's history" : file.tracked === false ? ". The file is not committed yet but is not git-ignored either" : ""
            }${archived ? " (in archived code)" : ""}. The value is not shown here.`,
            packageDirectory: null,
            evidence: [{ file: file.path, line }],
            remedy: committed
              ? `Revoke the ${rule.kind} with its provider, move the new one to an ignored environment file, and remove it from the repository's history.`
              : `Move the ${rule.kind} to a git-ignored environment file.`,
          }),
        );
      }
    }
  }

  /* Environment files that are committed. */
  for (const file of snapshot.files) {
    if (!/(^|\/)\.env(\.[\w.-]+)?$/.test(file.path) || /\.(example|sample|template|defaults|dist)$/.test(file.path)) continue;
    if (file.tracked !== true && (file.tracked !== null || file.ignored)) continue;
    findings.push(
      createFinding({
        identity: file.path,
        rule: "security.environment-file-committed",
        category: "security",
        severity: "medium",
        title: `${file.path} is ${file.tracked ? "committed" : "not ignored"}`,
        detail: `${file.path} holds environment values and ${
          file.tracked ? "is committed to the repository" : "is not covered by .gitignore, so the next commit can include it"
        }. Anything in it is readable by everyone with access to the repository. Values meant for the browser (VITE_, NEXT_PUBLIC_) are public anyway; anything else should not be here.`,
        packageDirectory: null,
        evidence: [{ file: file.path }],
        remedy: file.tracked
          ? `Remove ${file.path} from the repository (git rm --cached), keep it in .gitignore, and commit a ${file.path}.example with names only.`
          : `Add ${file.path} to .gitignore.`,
      }),
    );
  }

  return { findings, filesScanned };
}
