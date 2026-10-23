

import { ARCHIVED_PATH } from "./DependencyAnalysis.js";
import { createFinding, excerpt, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";

/*
 * MS-2026-0013 (any language): code patterns with a known security cost in
 * the languages other than JavaScript and TypeScript, and in the mobile
 * platform configuration files.
 *
 * Each file is read with its language's comment and string syntax, so a
 * rule must start in code: a pattern inside a comment, or inside a string
 * (except where the rule is about the string), is not reported. Test and
 * archived code is reported at low severity.
 */

type Family = "hash" | "c" | "php" | "markup";

interface LanguageRule {
  id: string;
  title: string;
  why: string;
  remedy: string;
  severity: FindingSeverity;
  expression: RegExp;
  /* Only for files whose path matches. */
  files?: RegExp;
}

interface LanguageRules {
  language: string;
  extensions: RegExp;
  family: Family;
  rules: LanguageRule[];
}

const SQL_WHY = "Values placed into a SQL string can change the query (SQL injection).";
const SQL_REMEDY = "Use the driver's parameter placeholders and pass values separately.";
const TLS_WHY = "Turning off certificate checks lets anyone on the network read and change the traffic.";
const TLS_REMEDY = "Keep certificate verification on; for a private certificate authority, trust that authority instead.";
const SHELL_WHY = "Input reaching a shell command can run any command on the server.";
const SHELL_REMEDY = "Call the program directly with an argument list, never through a shell, and validate the input.";
const DESERIALIZE_WHY = "Deserializing untrusted data with this format can run attacker-chosen code.";

export const LANGUAGE_RULES: readonly LanguageRules[] = [
  {
    language: "Python",
    extensions: /\.pyi?$/,
    family: "hash",
    rules: [
      { id: "python.eval", title: "eval or exec runs a string as code", why: "If any part of the string comes from input, an attacker can run arbitrary code.", remedy: "Parse the data (json, ast.literal_eval) instead of executing it.", severity: "high", expression: /(?<![\w.])(?:eval|exec)\s*\(/g },
      { id: "python.shell-true", title: "subprocess runs through a shell", why: SHELL_WHY, remedy: SHELL_REMEDY, severity: "high", expression: /\bsubprocess\.\w+\s*\([^\n]*\bshell\s*=\s*True\b/g },
      { id: "python.os-system", title: "os.system or os.popen runs a shell command", why: SHELL_WHY, remedy: "Use subprocess.run with an argument list and shell=False.", severity: "medium", expression: /\bos\.(?:system|popen)\s*\(/g },
      { id: "python.pickle", title: "pickle loads data that can run code", why: DESERIALIZE_WHY, remedy: "Load only data you created yourself, or use JSON for anything that crosses a trust boundary.", severity: "medium", expression: /\b(?:pickle|cPickle|dill|shelve)\.loads?\s*\(/g },
      { id: "python.yaml-load", title: "yaml.load without a safe loader", why: "The full YAML loader can construct arbitrary Python objects from the document.", remedy: "Use yaml.safe_load, or pass Loader=yaml.SafeLoader.", severity: "medium", expression: /\byaml\.load\s*\((?![^\n)]*Loader\s*=\s*(?:yaml\.)?C?(?:Safe|Base)Loader)/g },
      { id: "python.tls-verification-disabled", title: "TLS certificate verification is turned off", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\bverify\s*=\s*False\b/g },
      { id: "python.sql-string-building", title: "SQL is built with an f-string or % formatting", why: SQL_WHY, remedy: SQL_REMEDY, severity: "high", expression: /\.execute(?:many)?\s*\(\s*(?:f["']|["'][^"'\n]*%[sd][^"'\n]*["']\s*%)/g },
      { id: "python.django-debug", title: "Django DEBUG is on in settings", why: "With DEBUG on, error pages show code, settings and data to anyone who triggers an error.", remedy: "Read DEBUG from the environment and keep it off in production.", severity: "medium", expression: /^\s*DEBUG\s*=\s*True\b/gm, files: /(^|\/)settings(\/[\w-]+)?\.py$|(^|\/)settings\.py$/ },
    ],
  },
  {
    language: "Go",
    extensions: /\.go$/,
    family: "c",
    rules: [
      { id: "go.tls-verification-disabled", title: "TLS certificate verification is turned off", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\bInsecureSkipVerify\s*:\s*true\b/g },
      { id: "go.sql-string-building", title: "SQL is built with fmt.Sprintf", why: SQL_WHY, remedy: SQL_REMEDY, severity: "high", expression: /\.(?:Query|QueryRow|Exec)(?:Context)?\s*\(\s*(?:\w+\s*,\s*)?fmt\.Sprintf\s*\(/g },
      { id: "go.shell", title: "a command runs through sh -c", why: SHELL_WHY, remedy: SHELL_REMEDY, severity: "medium", expression: /\bexec\.Command(?:Context)?\s*\([^\n)]*"(?:sh|bash|\/bin\/sh|\/bin\/bash)"\s*,\s*"-c"/g },
    ],
  },
  {
    language: "Java and Kotlin",
    extensions: /\.(java|kt|kts|scala)$/,
    family: "c",
    rules: [
      { id: "jvm.runtime-exec", title: "Runtime.exec runs a system command", why: SHELL_WHY, remedy: "Use ProcessBuilder with a fixed program and an argument list, and validate the input.", severity: "medium", expression: /\bRuntime\.getRuntime\(\)\s*\.exec\s*\(/g },
      { id: "jvm.object-deserialization", title: "Java object deserialization", why: DESERIALIZE_WHY, remedy: "Exchange data as JSON, or restrict classes with an ObjectInputFilter.", severity: "medium", expression: /\bObjectInputStream\s*\(/g },
      { id: "jvm.sql-string-building", title: "SQL is built by joining strings", why: SQL_WHY, remedy: "Use a PreparedStatement (or named parameters) and bind the values.", severity: "high", expression: /\b(?:executeQuery|executeUpdate|execute|prepareStatement|createQuery|createNativeQuery)\s*\(\s*"[^"\n]*"\s*\+/g },
      { id: "jvm.hostname-verification-disabled", title: "TLS hostname verification accepts every host", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\b(?:setHostnameVerifier|hostnameVerifier)\b[^\n;]*(?:->|\{)\s*true\b/g },
    ],
  },
  {
    language: "C#",
    extensions: /\.cs$/,
    family: "c",
    rules: [
      { id: "dotnet.binary-formatter", title: "BinaryFormatter deserialization", why: DESERIALIZE_WHY, remedy: "Use System.Text.Json; BinaryFormatter is obsolete and unsafe for any input.", severity: "high", expression: /\bnew\s+BinaryFormatter\s*\(/g },
      { id: "dotnet.type-name-handling", title: "Json.NET TypeNameHandling lets the payload choose types", why: DESERIALIZE_WHY, remedy: "Use TypeNameHandling.None, or a SerializationBinder that allows only known types.", severity: "high", expression: /\bTypeNameHandling\s*=\s*TypeNameHandling\.(?:All|Auto|Objects|Arrays)\b/g },
      { id: "dotnet.tls-verification-disabled", title: "TLS certificate validation always succeeds", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\bServerCertificate(?:Custom)?ValidationCallback\s*=[^\n;]*=>\s*true\b/g },
      { id: "dotnet.sql-string-building", title: "SQL is built by joining or interpolating strings", why: SQL_WHY, remedy: "Add SqlParameter values to the command instead of building the text.", severity: "high", expression: /\bnew\s+SqlCommand\s*\(\s*(?:\$"|"[^"\n]*"\s*\+)/g },
    ],
  },
  {
    language: "PHP",
    extensions: /\.php$/,
    family: "php",
    rules: [
      { id: "php.eval", title: "eval runs a string as code", why: "If any part of the string comes from input, an attacker can run arbitrary code.", remedy: "Remove eval; parse data with json_decode or a fixed lookup.", severity: "high", expression: /(?<![\w$>:])eval\s*\(/g },
      { id: "php.shell", title: "a shell command is built from a variable", why: SHELL_WHY, remedy: "Avoid the shell; if unavoidable, escape every argument with escapeshellarg.", severity: "high", expression: /(?<![\w$>:])(?:shell_exec|system|passthru|exec|popen|proc_open)\s*\([^\n)]*\$/g },
      { id: "php.unserialize-input", title: "unserialize on request input", why: DESERIALIZE_WHY, remedy: "Use json_decode for input, or unserialize with allowed_classes set to false.", severity: "high", expression: /\bunserialize\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE)\b/g },
      { id: "php.sql-input", title: "request input goes straight into a SQL query", why: SQL_WHY, remedy: "Use PDO or mysqli prepared statements with bound parameters.", severity: "high", expression: /\b(?:mysqli_query|mysql_query|->query|->exec)\s*\([^\n;]*\$_(?:GET|POST|REQUEST|COOKIE)\b/g },
      { id: "php.echo-input", title: "request input is printed without escaping", why: "Printing request input into the page is cross-site scripting.", remedy: "Escape output with htmlspecialchars (or the template engine's escaping).", severity: "high", expression: /\b(?:echo|print)\s+[^\n;]*\$_(?:GET|POST|REQUEST|COOKIE)\b/g },
    ],
  },
  {
    language: "Ruby",
    extensions: /\.(rb|erb|rake)$/,
    family: "hash",
    rules: [
      { id: "ruby.eval", title: "eval runs a string as code", why: "If any part of the string comes from input, an attacker can run arbitrary code.", remedy: "Remove eval; dispatch through a fixed list of allowed methods.", severity: "high", expression: /(?<![\w.:])eval\s*\(/g },
      { id: "ruby.shell-interpolation", title: "a shell command interpolates a value", why: SHELL_WHY, remedy: "Pass the command and its arguments separately: system(\"cmd\", arg).", severity: "high", expression: /(?:\b(?:system|exec|spawn)\s*\(?\s*"[^"\n]*#\{|`[^`\n]*#\{)/g },
      { id: "ruby.sql-interpolation", title: "SQL interpolates a value", why: SQL_WHY, remedy: "Use placeholders: where(\"name = ?\", name) or a hash condition.", severity: "high", expression: /\.(?:where|find_by_sql|order|select|joins|having|group|pluck|exists\?)\s*\(\s*"[^"\n]*#\{/g },
      { id: "ruby.unescaped-html", title: "html_safe or raw marks text as safe HTML", why: "Text marked safe is not escaped; if it holds input, that is cross-site scripting.", remedy: "Let the template escape it, or sanitize with sanitize() first.", severity: "medium", expression: /\.html_safe\b|(?<![\w.])raw\s*\(/g },
      { id: "ruby.unsafe-load", title: "YAML.load or Marshal.load on data", why: DESERIALIZE_WHY, remedy: "Use YAML.safe_load or JSON for anything that crosses a trust boundary.", severity: "medium", expression: /\b(?:YAML|Psych|Marshal)\.load\s*\(/g },
    ],
  },
  {
    language: "Rust",
    extensions: /\.rs$/,
    family: "c",
    rules: [
      { id: "rust.tls-verification-disabled", title: "TLS certificate or hostname checks are turned off", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\bdanger_accept_invalid_(?:certs|hostnames)\s*\(\s*true\s*\)/g },
    ],
  },
  {
    language: "C and C++",
    extensions: /\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/,
    family: "c",
    rules: [
      { id: "c.gets", title: "gets reads without a length limit", why: "gets cannot limit input length, so long input overflows the buffer. It was removed from C11.", remedy: "Use fgets with the buffer size.", severity: "high", expression: /(?<![\w.>:])gets\s*\(/g },
      { id: "c.system", title: "system runs a shell command", why: SHELL_WHY, remedy: "Use execv-family calls with an argument list, and validate the input.", severity: "medium", expression: /(?<![\w.>:])system\s*\(/g },
      { id: "c.unbounded-string", title: "unbounded string copy or format", why: "strcpy, strcat and sprintf do not check the destination size and can overflow it.", remedy: "Use snprintf, strlcpy/strlcat or std::string.", severity: "low", expression: /(?<![\w.>:])(?:strcpy|strcat|sprintf)\s*\(/g },
    ],
  },
  {
    language: "Dart",
    extensions: /\.dart$/,
    family: "c",
    rules: [
      { id: "dart.tls-verification-disabled", title: "every TLS certificate is accepted", why: TLS_WHY, remedy: TLS_REMEDY, severity: "high", expression: /\bbadCertificateCallback\s*=\s*\([^)]*\)\s*=>\s*true\b/g },
    ],
  },
  {
    language: "Android configuration",
    extensions: /(^|\/)AndroidManifest\.xml$/,
    family: "markup",
    rules: [
      { id: "android.debuggable", title: "the Android app is debuggable", why: "A debuggable release can be inspected and controlled by anyone with the device.", remedy: "Remove android:debuggable; the build type sets it for debug builds only.", severity: "high", expression: /android:debuggable\s*=\s*"true"/g },
      { id: "android.cleartext-traffic", title: "the Android app allows unencrypted HTTP", why: "Traffic sent over plain HTTP can be read and changed on the network.", remedy: "Use HTTPS, and allow cleartext only for specific hosts in a network security config.", severity: "medium", expression: /android:usesCleartextTraffic\s*=\s*"true"/g },
    ],
  },
  {
    language: "iOS configuration",
    extensions: /(^|\/)Info\.plist$/,
    family: "markup",
    rules: [
      { id: "ios.arbitrary-loads", title: "App Transport Security is turned off", why: "NSAllowsArbitraryLoads lets the app load anything over plain HTTP.", remedy: "Remove it, and add exceptions only for the specific domains that need them.", severity: "medium", expression: /<key>\s*NSAllowsArbitraryLoads\s*<\/key>\s*<true\s*\/>/g },
    ],
  },
];

/* 0 code, 1 string contents, 2 comment. The quote characters themselves count as code. */
export function maskLanguage(text: string, family: Family): Uint8Array {
  const state = new Uint8Array(text.length);
  if (family === "markup") {
    for (const match of text.matchAll(/<!--[\s\S]*?-->/g)) state.fill(2, match.index!, match.index! + match[0].length);
    return state;
  }
  const hashComments = family === "hash" || family === "php";
  const slashComments = family === "c" || family === "php";
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if ((slashComments && char === "/" && next === "/") || (hashComments && char === "#")) {
      const end = text.indexOf("\n", index);
      const stop = end === -1 ? text.length : end;
      state.fill(2, index, stop);
      index = stop;
      continue;
    }
    if (slashComments && char === "/" && next === "*") {
      const end = text.indexOf("*/", index + 2);
      const stop = end === -1 ? text.length : end + 2;
      state.fill(2, index, stop);
      index = stop;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const triple = text.slice(index, index + 3) === char.repeat(3) && char !== "`";
      const fence = triple ? char.repeat(3) : char;
      let cursor = index + fence.length;
      while (cursor < text.length) {
        if (text[cursor] === "\\" && char !== "`") {
          cursor += 2;
          continue;
        }
        if (text.startsWith(fence, cursor)) break;
        if (!triple && text[cursor] === "\n" && char !== "`") break;
        cursor += 1;
      }
      state.fill(1, index + fence.length, Math.min(cursor, text.length));
      index = Math.min(text.length, cursor + fence.length);
      continue;
    }
    index += 1;
  }
  return state;
}

const TEST_PATH = /(^|\/)(__tests__|tests?|spec|e2e|src\/test|androidTest)(\/|$)|_test\.(go|py)$|(^|\/)test_[^/]*\.py$|_spec\.rb$|Tests?\.(cs|java|kt|swift)$/;

export function scanLanguageRisks(snapshot: RepositorySnapshot): { findings: RepositoryFinding[]; filesScanned: number; languagesScanned: string[] } {
  const findings: RepositoryFinding[] = [];
  const languages = new Set<string>();
  let filesScanned = 0;
  for (const file of snapshot.files) {
    if (file.ignored || !file.text) continue;
    const set = LANGUAGE_RULES.find((entry) => entry.extensions.test(file.path));
    if (!set) continue;
    const text = snapshot.read(file.path);
    if (text === null) continue;
    filesScanned += 1;
    languages.add(set.language);
    const state = maskLanguage(text, set.family);
    const lines = text.split("\n");
    const lineOf = (offset: number) => {
      let line = 1;
      for (let index = text.indexOf("\n"); index !== -1 && index < offset; index = text.indexOf("\n", index + 1)) line += 1;
      return line;
    };
    const archived = ARCHIVED_PATH.test(file.path);
    const test = TEST_PATH.test(file.path);
    for (const rule of set.rules) {
      if (rule.files && !rule.files.test(file.path)) continue;
      const seen = new Set<number>();
      for (const match of text.matchAll(rule.expression)) {
        const start = match.index! + (match[0].length - match[0].trimStart().length);
        if (state[start] !== 0) continue;
        const line = lineOf(start);
        if (seen.has(line)) continue;
        seen.add(line);
        findings.push(
          createFinding({
            identity: `${file.path}\0${line}`,
            rule: `security.code.${rule.id}`,
            category: "security",
            severity: archived || test ? "low" : rule.severity,
            title: `${rule.title}${archived ? " (archived code)" : test ? " (test code)" : ""}`,
            detail: `${file.path}, line ${line}. ${rule.why}`,
            packageDirectory: null,
            evidence: [{ file: file.path, line, excerpt: excerpt(lines[line - 1] ?? "") }],
            remedy: rule.remedy,
          }),
        );
      }
    }
  }
  return { findings, filesScanned, languagesScanned: [...languages].sort() };
}

export const SCANNED_LANGUAGES = new Set(["TypeScript", "JavaScript", "Vue", "Svelte", "Astro", "Python", "Go", "Java", "Kotlin", "Scala", "C#", "PHP", "Ruby", "Rust", "C", "C++", "Dart"]);

export function unscannedLanguages(languages: readonly { language: string; files: number }[]): string[] {
  const notCode = new Set(["JSON", "Markdown", "MDX", "YAML", "TOML", "CSS", "SCSS", "Less", "HTML", "SQL", "Shell"]);
  return languages.filter((share) => share.files > 0 && !notCode.has(share.language) && !SCANNED_LANGUAGES.has(share.language)).map((share) => share.language).sort();
}


