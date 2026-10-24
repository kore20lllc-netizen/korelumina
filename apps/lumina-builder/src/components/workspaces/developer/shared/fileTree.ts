/*
 * MS-2026-0011: which project files the Developer workspace opens, how they
 * are arranged in the explorer, and which editor language each one uses.
 */

export interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
}

const TEXT_FILE_RE =
  /\.(tsx|ts|jsx|js|mjs|cjs|css|scss|sass|less|html|json|md|mdx|txt|yml|yaml|toml|svg|py|go|rs|java|kt|kts|swift|rb|php|cs|c|h|cpp|hpp|dart|vue|svelte|astro|sql|sh|gradle|xml|prisma|graphql)$/i;

const SKIP_PATH_RE =
  /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|\.turbo|\.cache|\.venv|venv|target|Pods)(\/|$)/;

const PLAIN_NAMES = new Set([
  "Dockerfile",
  "Procfile",
  "Makefile",
  "README",
  "LICENSE",
  ".gitignore",
  ".dockerignore",
  ".env.example",
]);

export function isReadableFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  if (SKIP_PATH_RE.test(normalized) || normalized.includes("\0") || normalized.endsWith("/")) return false;
  const base = normalized.split("/").pop() ?? "";
  /* Secrets stay out of the browser editor; .env.example is a template. */
  if (/^\.env(\.|$)/.test(base) && base !== ".env.example") return false;
  return TEXT_FILE_RE.test(normalized) || PLAIN_NAMES.has(base);
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes]
    .sort((a, b) => (a.type !== b.type ? (a.type === "folder" ? -1 : 1) : a.name.localeCompare(b.name)))
    .map((node) => (node.children ? { ...node, children: sortNodes(node.children) } : node));
}

export function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];
  for (const raw of files) {
    const file = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!file || !isReadableFile(file)) continue;
    const parts = file.split("/").filter(Boolean);
    let cursor = root;
    let current = "";
    parts.forEach((part, index) => {
      current = current ? `${current}/${part}` : part;
      const isFile = index === parts.length - 1;
      let node = cursor.find((candidate) => candidate.name === part);
      if (!node) {
        node = { name: part, type: isFile ? "file" : "folder", path: current, children: isFile ? undefined : [] };
        cursor.push(node);
      }
      if (!isFile) {
        node.children ??= [];
        cursor = node.children;
      }
    });
  }
  return sortNodes(root);
}

export function preferredEntryFile(files: string[]): string {
  return (
    files.find((file) => file === "app/page.tsx") ??
    files.find((file) => file === "src/App.tsx") ??
    files.find((file) => file === "src/main.tsx") ??
    files.find((file) => file.endsWith("/page.tsx")) ??
    files.find((file) => file.endsWith("/App.tsx")) ??
    files.find((file) => file === "README.md") ??
    files[0] ??
    ""
  );
}

const LANGUAGES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  html: "html",
  svg: "xml",
  xml: "xml",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  yaml: "yaml",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  cs: "csharp",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  dart: "dart",
  sql: "sql",
  sh: "shell",
  graphql: "graphql",
  toml: "ini",
};

export function detectLanguage(file?: string): string {
  const ext = file?.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGES[ext] ?? "plaintext";
}

/* A short, human reason for the codes Runtime answers with. */
export function describeRuntimeError(code: string): string {
  const [kind, detail] = code.split(":", 2);
  const where = detail ? ` (${detail})` : "";
  switch (kind) {
    case "file_changed":
      return "This file changed on disk since you opened it. Reopen it before saving, so nothing is overwritten.";
    case "project_not_found":
      return "This project is not available to your account.";
    case "forbidden":
      return "Your account may view this project but not change it.";
    case "find_not_found":
      return `The text to replace is no longer in the file${where}.`;
    case "find_not_unique":
      return `The text to replace appears more than once${where}.`;
    case "file_exists":
      return `A file it would create already exists${where}.`;
    case "file_missing":
      return `A file it would change no longer exists${where}.`;
    case "unsafe_patch_path":
      return `A change pointed outside the project${where}.`;
    case "unsafe_patch_link":
      return `A change went through a symbolic link${where}.`;
    case "file_patched_twice":
      return `Two changes targeted the same file${where}.`;
    case "changed_since_apply":
      return `You edited this file after the change was applied${where}.`;
    case "draft_no_longer_fits":
      return "The project changed since this draft was made, so nothing was written.";
    case "files_changed_since_apply":
      return "Files changed after this draft was applied, so nothing was undone.";
    case "draft_not_found":
      return "Runtime restarted and no longer holds this draft. Ask again.";
    case "missing_ANTHROPIC_API_KEY":
      return "Claude is selected but Runtime has no ANTHROPIC_API_KEY.";
    case "missing_OPENAI_API_KEY":
      return "OpenAI is selected but Runtime has no OPENAI_API_KEY.";
    case "ai_response_not_json":
      return "The model answered in a form KoreLumina could not read. Ask again, perhaps more specifically.";
    default:
      return code.replace(/_/g, " ");
  }
}
