import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { TextGenerationClient } from "../ai/model/index.js";
import { createDraft } from "../drafts/draftStore.js";
import { patchProblem, previewPatch } from "../drafts/patchSafety.js";
import type { DraftPatch, FixDraft } from "../drafts/types.js";
import { importPath, siteLayoutFile, type WebsiteAnalysis } from "./websiteAnalysis.js";
import type { WebsitePlanPage } from "./websitePlan.js";

/*
 * MS-2026-0011 (Transform App -> Website, step 3): the model writes a
 * shared site layout, then each chosen page, then (React Router only) the
 * route wiring. Everything becomes one draft; nothing is written until the
 * owner applies it, all or nothing, with undo. Anything the model does not
 * know is left as a visible [placeholder]: no invented prices, customers,
 * quotes or figures.
 *
 * The build runs as a job so the interface can show each step as it
 * really happens.
 */

export type BuildStepStatus = "pending" | "running" | "done" | "failed";

export interface BuildStep {
  id: string;
  label: string;
  file: string | null;
  status: BuildStepStatus;
  error: string | null;
}

export interface WebsiteBuildJob {
  jobId: string;
  projectId: string;
  status: "running" | "done" | "failed";
  steps: BuildStep[];
  draft: FixDraft | null;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
}

const jobs = new Map<string, WebsiteBuildJob>();
const CONCURRENCY = 3;

export function getBuildJob(jobId: string): WebsiteBuildJob | undefined {
  return jobs.get(jobId);
}

function readText(projectPath: string, file: string, limit: number): string {
  try {
    const full = path.join(projectPath, file);
    const stat = fs.lstatSync(full);
    if (!stat.isFile()) return "";
    return fs.readFileSync(full, "utf8").slice(0, limit);
  } catch {
    return "";
  }
}

const CONTENT_RULES = [
  "Content rules:",
  "- Write real copy from what the project actually is (README, description, code). Be specific and plain.",
  "- Never invent facts: no prices, plan names, customer or company names, testimonials, quotes, statistics, team members, addresses or phone numbers. Where one belongs, write a clearly visible placeholder in square brackets, e.g. [Your monthly price], [Customer quote], [Support email].",
  "- Never add dependencies. Use only what the project already has.",
  "- Keep it accessible: real headings in order, alt text, labelled form fields, sufficient contrast.",
];

function frameworkRules(analysis: WebsiteAnalysis): string {
  if (analysis.framework === "next-app") {
    return "Next.js App Router: the page file default-exports a React component. Add \"use client\" at the top only if it uses state or effects. Use next/link for internal links.";
  }
  if (analysis.framework === "next-pages") {
    return "Next.js Pages Router: the page file default-exports a React component. Use next/link for internal links.";
  }
  return "React Router: the page file default-exports a React component. Use Link from react-router-dom for internal links.";
}

function styleContext(analysis: WebsiteAnalysis, projectPath: string): string {
  const parts = analysis.styleFiles.map((file) => `--- ${file}\n${readText(projectPath, file, 4_000)}`);
  return [`Styling: ${analysis.styling.join(", ") || "plain CSS"}`, ...parts].join("\n");
}

function extractCode(text: string): string {
  const block = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  const code = (block ? block[1] : text).trim();
  if (!code || !/export\s+default|export\s+(function|const)/.test(code)) throw new Error("ai_response_not_code");
  return `${code}\n`;
}

function layoutPrompt(analysis: WebsiteAnalysis, projectPath: string, pages: WebsitePlanPage[], file: string, summary: string): string {
  return [
    "You are the KoreLumina AI, adding a marketing website inside an existing application.",
    `Write the shared website layout component at ${file}: a header with the product name and navigation to every website page, the page content (children), and a footer.`,
    "It must look like it belongs to this app: reuse its styling approach and design tokens.",
    `Export it as: export function SiteLayout({ children }) (typed props if TypeScript). ${frameworkRules(analysis)}`,
    "Answer with the complete file in one fenced code block and nothing else.",
    "",
    ...CONTENT_RULES,
    "",
    `Product: ${analysis.productName}`,
    `What the website says: ${summary || analysis.description || "(see README)"}`,
    "Website pages (title, route):",
    ...pages.map((page) => `- ${page.title}: ${page.route}`),
    "",
    styleContext(analysis, projectPath),
    "",
    "README (excerpt):",
    readText(projectPath, "README.md", 6_000) || "(no README)",
  ].join("\n");
}

function pagePrompt(
  analysis: WebsiteAnalysis,
  projectPath: string,
  page: WebsitePlanPage,
  pages: WebsitePlanPage[],
  layoutImport: string,
  summary: string,
): string {
  const reused = page.reuses.map((file) => `--- ${file} (import from "${importPath(page.file, file)}")\n${readText(projectPath, file, 6_000)}`);
  return [
    "You are the KoreLumina AI, adding a marketing website inside an existing application.",
    `Write the "${page.title}" page at ${page.file} (route ${page.route}). Purpose: ${page.purpose || page.title}.`,
    `Sections: ${page.sections.join("; ") || "as fits the purpose"}.`,
    `Wrap the page in the shared layout: import { SiteLayout } from "${layoutImport}";`,
    `Default-export a component named ${page.componentName}. ${frameworkRules(analysis)}`,
    "Reuse the existing components below where they fit, with the import paths given. Match the app's styling.",
    "Answer with the complete file in one fenced code block and nothing else.",
    "",
    ...CONTENT_RULES,
    "",
    `Product: ${analysis.productName}`,
    `What the website says: ${summary || analysis.description || "(see README)"}`,
    "Other website pages (for links): " + pages.filter((other) => other.id !== page.id).map((other) => `${other.title} ${other.route}`).join(", "),
    "",
    styleContext(analysis, projectPath),
    "",
    ...(reused.length ? ["Components to reuse:", ...reused, ""] : []),
    "README (excerpt):",
    readText(projectPath, "README.md", 8_000) || "(no README)",
  ].join("\n");
}

function wiringPrompt(analysis: WebsiteAnalysis, projectPath: string, pages: WebsitePlanPage[]): string {
  const routerFile = analysis.routerFile as string;
  return [
    `Add routes for new website pages to this React Router file (${routerFile}). Change nothing else.`,
    "Answer with one JSON object and nothing else:",
    '{ "patches": [ { "type": "replace-text", "file": "' + routerFile + '", "find": "<exact text copied from the file, occurring once>", "replace": "<that text with the additions>" } ] }',
    "Add one import per page and one route per page, in the file's existing style. Put the new routes before any catch-all (*) route.",
    "",
    "Pages to add (component, import path from the router file, route):",
    ...pages.map((page) => `- ${page.componentName} from "${importPath(routerFile, page.file)}" at ${page.route}`),
    "",
    `--- ${routerFile}`,
    readText(projectPath, routerFile, 60_000),
  ].join("\n");
}

function parseWiring(text: string, projectPath: string): DraftPatch[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("ai_response_not_json");
  const parsed = JSON.parse(body.slice(start, end + 1)) as { patches?: unknown };
  const patches: DraftPatch[] = [];
  for (const raw of Array.isArray(parsed.patches) ? parsed.patches : []) {
    const item = raw as Record<string, unknown>;
    if (item?.type !== "replace-text" || typeof item.file !== "string" || typeof item.find !== "string" || !item.find) continue;
    const patch: DraftPatch = { type: "replace-text", file: item.file, find: item.find, replace: String(item.replace ?? ""), diffPreview: "" };
    const problem = patchProblem(projectPath, patch);
    if (problem) throw new Error(problem);
    patch.diffPreview = previewPatch(patch);
    patches.push(patch);
  }
  if (patches.length === 0) throw new Error("routes_not_wired");
  return patches;
}

/*
 * Several replacements in the same router file are merged into one, in
 * order, so the draft can be applied (a draft patches each file once).
 */
function mergeSameFile(patches: DraftPatch[], projectPath: string): DraftPatch[] {
  const replacements = patches.filter((patch): patch is Extract<DraftPatch, { type: "replace-text" }> => patch.type === "replace-text");
  if (replacements.length <= 1) return patches;
  const file = replacements[0].file;
  if (replacements.some((patch) => patch.file !== file)) throw new Error("routes_not_wired");
  const before = readText(projectPath, file, 1_000_000);
  let after = before;
  for (const patch of replacements) {
    const index = after.indexOf(patch.find);
    if (index === -1 || after.indexOf(patch.find, index + 1) !== -1) throw new Error(`find_not_unique:${file}`);
    after = after.slice(0, index) + patch.replace + after.slice(index + patch.find.length);
  }
  const merged: DraftPatch = { type: "replace-text", file, find: before, replace: after, diffPreview: "" };
  merged.diffPreview = previewPatch(merged);
  return [merged];
}

async function inBatches<T>(items: T[], size: number, run: (item: T) => Promise<void>): Promise<void> {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(run));
  }
}

export function startWebsiteBuild(input: {
  projectId: string;
  projectPath: string;
  analysis: WebsiteAnalysis;
  pages: WebsitePlanPage[];
  summary: string;
  client: TextGenerationClient;
}): WebsiteBuildJob {
  const { analysis, projectPath, pages, client } = input;
  const layoutFile = siteLayoutFile(analysis);
  const layoutExists = Boolean(readText(projectPath, layoutFile, 1));
  const steps: BuildStep[] = [
    ...(layoutExists ? [] : [{ id: "layout", label: "Site layout", file: layoutFile, status: "pending" as const, error: null }]),
    ...pages.map((page) => ({ id: page.id, label: page.title, file: page.file, status: "pending" as const, error: null })),
    ...(analysis.framework === "react-router" ? [{ id: "routes", label: "Route wiring", file: analysis.routerFile, status: "pending" as const, error: null }] : []),
  ];
  const job: WebsiteBuildJob = {
    jobId: `site_${crypto.randomUUID()}`,
    projectId: input.projectId,
    status: "running",
    steps,
    draft: null,
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
  jobs.set(job.jobId, job);

  const step = (id: string) => job.steps.find((candidate) => candidate.id === id) as BuildStep;
  const created: DraftPatch[] = [];

  const create = (file: string, content: string) => {
    const patch: DraftPatch = { type: "create-file", file, content, diffPreview: "" };
    const problem = patchProblem(projectPath, patch);
    if (problem) throw new Error(problem);
    patch.diffPreview = previewPatch(patch);
    created.push(patch);
  };

  const run = async (id: string, work: () => Promise<void>) => {
    const current = step(id);
    current.status = "running";
    try {
      await work();
      current.status = "done";
    } catch (error) {
      current.status = "failed";
      current.error = error instanceof Error ? error.message : String(error);
    }
  };

  void (async () => {
    try {
      if (!layoutExists) {
        await run("layout", async () => {
          const generated = await client.generateText({ prompt: layoutPrompt(analysis, projectPath, pages, layoutFile, input.summary) });
          create(layoutFile, extractCode(generated.text));
        });
        if (step("layout").status === "failed") throw new Error("layout_failed");
      }

      await inBatches(pages, CONCURRENCY, (page) =>
        run(page.id, async () => {
          const generated = await client.generateText({
            prompt: pagePrompt(analysis, projectPath, page, pages, importPath(page.file, layoutFile), input.summary),
          });
          create(page.file, extractCode(generated.text));
        }),
      );
      if (job.steps.some((candidate) => candidate.status === "failed")) throw new Error("pages_failed");

      if (analysis.framework === "react-router") {
        await run("routes", async () => {
          const generated = await client.generateText({ prompt: wiringPrompt(analysis, projectPath, pages) });
          created.push(...mergeSameFile(parseWiring(generated.text, projectPath), projectPath));
        });
        if (step("routes").status === "failed") throw new Error("routes_failed");
      }

      job.draft = createDraft(input.projectId, created);
      job.status = "done";
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
      for (const pending of job.steps) {
        if (pending.status === "pending") pending.status = "failed";
        if (pending.status === "failed" && !pending.error) pending.error = "not_started";
      }
    } finally {
      job.finishedAt = Date.now();
    }
  })();

  return job;
}
