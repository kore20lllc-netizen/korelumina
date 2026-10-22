import path from "node:path";

import { ARCHIVED_PATH } from "./DependencyAnalysis.js";
import { createFinding, excerpt, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";
import { SOURCE_EXTENSIONS, scanSource } from "./SourceImports.js";

/*
 * MS-2026-0012: code patterns with a known security cost. A rule matches
 * code only (never comments or string contents), each finding points at
 * the line, and archived copies are reported at low severity.
 */

interface CodeRiskRule {
  id: string;
  title: string;
  why: string;
  remedy: string;
  severity: FindingSeverity;
  expression: RegExp;
  /* The rule applies only to files that import this module. */
  requiresImport?: RegExp;
}

export const CODE_RISK_RULES: readonly CodeRiskRule[] = [
  {
    id: "eval",
    title: "eval runs a string as code",
    why: "If any part of the string comes from input, an attacker can run arbitrary code.",
    remedy: "Parse the data instead (JSON.parse, a lookup table) rather than evaluating it.",
    severity: "high",
    expression: /(?<![\w$.])eval\s*\(/g,
  },
  {
    id: "new-function",
    title: "new Function builds code from a string",
    why: "It is eval by another name: input reaching the string runs as code.",
    remedy: "Replace the generated function with a fixed one that takes the varying part as data.",
    severity: "medium",
    expression: /\bnew\s+Function\s*\(/g,
  },
  {
    id: "dangerously-set-inner-html",
    title: "dangerouslySetInnerHTML renders raw HTML",
    why: "Unsanitized HTML from users or external sources becomes cross-site scripting.",
    remedy: "Render the content as text, or sanitize it (for example with DOMPurify) right before rendering.",
    severity: "medium",
    expression: /\bdangerouslySetInnerHTML\s*=/g,
  },
  {
    id: "inner-html",
    title: "HTML is assigned directly to the page",
    why: "Assigning to innerHTML or outerHTML, or calling insertAdjacentHTML, turns untrusted text into markup and script.",
    remedy: "Use textContent, or build the elements with the DOM API.",
    severity: "medium",
    expression: /\.(?:innerHTML|outerHTML)\s*[+]?=(?!=)|\.insertAdjacentHTML\s*\(|\bdocument\.write(?:ln)?\s*\(/g,
  },
  {
    id: "shell-command-interpolation",
    title: "A shell command is built from variables",
    why: "exec and execSync run their argument through a shell; a variable in the command lets crafted input run other commands.",
    remedy: "Use execFile or spawn with an argument array, which bypasses the shell.",
    severity: "high",
    /* Bare exec(...) or child_process.exec(...); regex.exec(...) is a different method. */
    expression: /(?:(?<![\w$.])|\b(?:child_process|childProcess|cp)\.)(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{|["'][^"'\n]*["']\s*\+|[A-Za-z_$][\w$]*\s*[+,)])/g,
    requiresImport: /["'](?:node:)?child_process["']/,
  },
  {
    id: "spawn-shell",
    title: "A process is started through a shell",
    why: "With shell: true, spawn and execFile interpret the command like exec does.",
    remedy: "Remove shell: true and pass arguments as an array.",
    severity: "medium",
    expression: /\b(?:spawn|spawnSync|execFile|execFileSync)\s*\([^)]*\bshell\s*:\s*true/g,
    requiresImport: /["'](?:node:)?child_process["']/,
  },
  {
    id: "tls-verification-disabled",
    title: "TLS certificate checks are turned off",
    why: "Connections accept any certificate, so anyone on the network path can read and change the traffic.",
    remedy: "Remove the override; trust a specific certificate authority instead if one is needed.",
    severity: "high",
    expression: /\brejectUnauthorized\s*:\s*false\b|NODE_TLS_REJECT_UNAUTHORIZED\s*\]?\s*=\s*["'`]?0/g,
  },
  {
    id: "cors-any-origin",
    title: "CORS allows every origin",
    why: "Any website a signed-in user visits can call this server with the user's browser.",
    remedy: "List the origins that may call it.",
    severity: "medium",
    expression: /\bcors\s*\(\s*\)|\borigin\s*:\s*(?:["'`]\*["'`]|true)\b|Access-Control-Allow-Origin["'`]\s*,\s*["'`]\*/g,
  },
  {
    id: "insecure-random-secret",
    title: "Math.random generates a secret",
    why: "Math.random is predictable; tokens, passwords and IDs made from it can be guessed.",
    remedy: "Use crypto.randomUUID() or crypto.getRandomValues().",
    severity: "medium",
    expression: /\b(?:token|secret|password|passwd|apiKey|api_key|nonce|salt|otp|sessionId|session_id)\w*\s*[:=]\s*[^;\n]*\bMath\.random\s*\(/gi,
  },
  {
    id: "sql-string-building",
    title: "SQL is built by inserting values into the text",
    why: "Values placed into a SQL string can change the query (SQL injection).",
    remedy: "Use the driver's parameter placeholders and pass values separately.",
    severity: "high",
    expression: /\b(?:query|execute|raw|unsafe)\s*\(\s*`\s*(?:SELECT|INSERT|UPDATE|DELETE|WITH)\b[^`]*\$\{/gi,
  },
];

export interface CodeRiskScan {
  findings: RepositoryFinding[];
  filesScanned: number;
}

export function scanCodeRisks(snapshot: RepositorySnapshot): CodeRiskScan {
  const findings: RepositoryFinding[] = [];
  let filesScanned = 0;

  for (const file of snapshot.files) {
    if (file.ignored || !file.text || !SOURCE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase())) continue;
    if (/\.min\.[cm]?js$/.test(file.path)) continue;
    const text = snapshot.read(file.path);
    if (text === null) continue;
    filesScanned += 1;
    const { code, inString } = scanSource(text);
    const lines = text.split("\n");
    const lineStarts = [0];
    for (let index = 0; index < code.length; index += 1) if (code.charCodeAt(index) === 10) lineStarts.push(index + 1);
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
    const test = /(^|\/)(__tests__|tests?|e2e)(\/|$)|\.(test|spec)\.[cm]?[jt]sx?$/.test(file.path);

    for (const rule of CODE_RISK_RULES) {
      if (rule.requiresImport && !rule.requiresImport.test(text)) continue;
      const seen = new Set<number>();
      for (const match of code.matchAll(rule.expression)) {
        /* The match must start in code; string-literal content is not code. */
        const start = match.index! + (match[0].length - match[0].trimStart().length);
        if (inString[start] && rule.id !== "tls-verification-disabled") continue;
        const line = lineOf(start);
        if (seen.has(line)) continue;
        seen.add(line);
        /*
         * Structured data serialized with JSON.stringify (JSON-LD) or a generated
         * <style> block is not markup from input. Only this attribute's own value
         * and its own element are read.
         */
        let serialized = false;
        if (rule.id === "dangerously-set-inner-html") {
          const close = code.indexOf("}}", start);
          const value = code.slice(start, close === -1 ? start + 400 : Math.min(close, start + 400));
          const tagStart = code.lastIndexOf("<", start);
          const tag = tagStart === -1 ? "" : code.slice(tagStart, start);
          serialized = /__html\s*:\s*JSON\.stringify\s*\(/.test(value) || /^<style\b/.test(tag);
        }
        findings.push(
          createFinding({
            identity: `${file.path}\0${line}`,
            rule: `security.code.${rule.id}`,
            category: "security",
            severity: archived || test || serialized ? "low" : rule.severity,
            title: `${rule.title}${archived ? " (archived code)" : test ? " (test code)" : serialized ? " (serialized data or stylesheet)" : ""}`,
            detail: `${file.path}, line ${line}. ${rule.why}`,
            packageDirectory: null,
            evidence: [{ file: file.path, line, excerpt: excerpt(lines[line - 1] ?? "") }],
            remedy: rule.remedy,
          }),
        );
      }
    }
  }

  return { findings, filesScanned };
}
