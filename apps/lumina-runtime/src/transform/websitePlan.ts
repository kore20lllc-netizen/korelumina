import fs from "node:fs";
import path from "node:path";

import type { TextGenerationClient } from "../ai/model/index.js";
import { patchProblem } from "../drafts/patchSafety.js";
import { componentNameFor, pageFileFor, type WebsiteAnalysis } from "./websiteAnalysis.js";

/*
 * MS-2026-0011 (Transform App -> Website, step 2): the model proposes the
 * website's pages from what the project is; KoreLumina decides where each
 * file goes and refuses routes the app already uses or files that exist,
 * so a plan can never overwrite the app. The owner picks the pages.
 */

export interface WebsitePlanPage {
  id: string;
  title: string;
  route: string;
  file: string;
  componentName: string;
  purpose: string;
  sections: string[];
  reuses: string[];
}

export interface WebsitePlan {
  summary: string;
  pages: WebsitePlanPage[];
  rejected: string[];
}

const MAX_PAGES = 10;
const ROUTE = /^\/[a-z0-9-]*(\/[a-z0-9-]+)*$/;
const ID = /^[a-z][a-z0-9-]{0,39}$/;

function readText(file: string, limit: number): string {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile()) return "";
    return fs.readFileSync(file, "utf8").slice(0, limit);
  } catch {
    return "";
  }
}

export function buildPlanPrompt(analysis: WebsiteAnalysis, projectPath: string): string {
  const readme = readText(path.join(projectPath, "README.md"), 10_000);
  return [
    "You are the KoreLumina AI. The owner of this application wants a marketing website added to it, inside the same app, reusing its components and styles.",
    "Propose the website's pages. Answer with one JSON object and nothing else:",
    '{ "summary": "<two plain sentences: what the product is and what the website will say>", "pages": [ { "id": "pricing", "title": "Pricing", "route": "/pricing", "purpose": "<one sentence>", "sections": ["<section>", "..."], "reuses": ["<existing component file path>", "..."] } ] }',
    "",
    "Rules:",
    "- Propose the pages a product website needs, drawn from: home, features, pricing, about, contact, docs, faq, privacy, terms. Include docs only if the README has real usage or setup content.",
    "- Routes are lowercase paths like /pricing. Never use a route the app already has (listed below). If / is taken, put the website's home at /home.",
    "- \"reuses\" lists only files from the components list below that genuinely fit (buttons, cards, layout pieces). Leave it empty when none fit.",
    `- At most ${MAX_PAGES} pages.`,
    "",
    `Product: ${analysis.productName}`,
    `Description: ${analysis.description ?? "(none given)"}`,
    `Framework: ${analysis.frameworkLabel}; styling: ${analysis.styling.join(", ") || "plain CSS"}`,
    `Routes the app already has: ${analysis.existingRoutes.join(", ") || "(none found)"}`,
    "Existing components:",
    analysis.components.join("\n") || "(none)",
    "",
    "README:",
    readme || "(no README)",
  ].join("\n");
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("ai_response_not_json");
  try {
    return JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("ai_response_not_json");
  }
}

function strings(value: unknown, limit: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
}

export function parsePlan(text: string, analysis: WebsiteAnalysis, projectPath: string): WebsitePlan {
  const parsed = extractJson(text);
  const raw = Array.isArray(parsed.pages) ? parsed.pages : [];
  const taken = new Set(analysis.existingRoutes);
  const knownComponents = new Set(analysis.components);
  const seenIds = new Set<string>();
  const pages: WebsitePlanPage[] = [];
  const rejected: string[] = [];

  for (const item of raw.slice(0, MAX_PAGES)) {
    if (!item || typeof item !== "object") continue;
    const page = item as Record<string, unknown>;
    const id = typeof page.id === "string" ? page.id.trim().toLowerCase() : "";
    const route = typeof page.route === "string" ? page.route.trim().toLowerCase().replace(/\/$/, "") || "/" : "";
    const title = typeof page.title === "string" ? page.title.trim().slice(0, 60) : "";
    if (!ID.test(id) || seenIds.has(id)) {
      rejected.push(`invalid_page_id:${String(page.id)}`);
      continue;
    }
    if (!ROUTE.test(route)) {
      rejected.push(`invalid_route:${route || String(page.route)}`);
      continue;
    }
    if (taken.has(route)) {
      rejected.push(`route_taken:${route}`);
      continue;
    }
    const file = pageFileFor(analysis, route, id);
    const problem = patchProblem(projectPath, { type: "create-file", file, content: "", diffPreview: "" });
    if (problem) {
      rejected.push(problem);
      continue;
    }
    seenIds.add(id);
    taken.add(route);
    pages.push({
      id,
      title: title || id,
      route,
      file,
      componentName: componentNameFor(id),
      purpose: typeof page.purpose === "string" ? page.purpose.trim().slice(0, 300) : "",
      sections: strings(page.sections, 10),
      reuses: strings(page.reuses, 6).filter((file) => knownComponents.has(file)),
    });
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 800) : "",
    pages,
    rejected,
  };
}

export async function planWebsite(
  analysis: WebsiteAnalysis,
  projectPath: string,
  client: TextGenerationClient,
): Promise<WebsitePlan> {
  if (!analysis.supported) throw new Error("project_not_supported");
  const generated = await client.generateText({ prompt: buildPlanPrompt(analysis, projectPath) });
  return parsePlan(generated.text, analysis, projectPath);
}

/*
 * The owner may rename a page or change its route before building. Every
 * page sent back is checked again here; nothing from the browser is
 * trusted about where files go.
 */
export function revalidatePages(
  input: unknown,
  analysis: WebsiteAnalysis,
  projectPath: string,
): { pages: WebsitePlanPage[]; problems: string[] } {
  const parsed = parsePlan(JSON.stringify({ pages: Array.isArray(input) ? input : [] }), analysis, projectPath);
  return { pages: parsed.pages, problems: parsed.rejected };
}
