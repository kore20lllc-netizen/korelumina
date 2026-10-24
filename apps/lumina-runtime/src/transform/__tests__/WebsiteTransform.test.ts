import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { TextGenerationClient } from "../../ai/model/index.js";
import { applyDraft } from "../../drafts/applyDraft.js";
import type { ProjectMetadata } from "../../projects/projectMetadataStore.js";
import { decideTransformAccess } from "../../routes/websiteTransform.js";
import type { RuntimeCaller, RuntimeCallerRole } from "../../routes/runtimeCaller.js";
import { analyzeWebsiteTarget, importPath, pageFileFor } from "../websiteAnalysis.js";
import { getBuildJob, startWebsiteBuild } from "../websiteBuild.js";
import { buildPlanPrompt, parsePlan } from "../websitePlan.js";

function project(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

const pkg = (deps: Record<string, string>) => JSON.stringify({ name: "acme-app", description: "Invoices for freelancers.", dependencies: deps });

const reactRouterApp = () =>
  project({
    "package.json": pkg({ react: "18", "react-router-dom": "6", tailwindcss: "3" }),
    "tsconfig.json": "{}",
    "README.md": "# Acme\n\nAcme sends invoices for freelancers and tracks who has paid.\n",
    "src/App.tsx": [
      'import { Routes, Route } from "react-router-dom";',
      'import Dashboard from "./pages/Dashboard";',
      "",
      "export default function App() {",
      "  return (",
      "    <Routes>",
      '      <Route path="/" element={<Dashboard />} />',
      '      <Route path="/settings" element={<Dashboard />} />',
      "    </Routes>",
      "  );",
      "}",
      "",
    ].join("\n"),
    "src/pages/Dashboard.tsx": "export default function Dashboard() { return null; }\n",
    "src/components/ui/button.tsx": "export function Button() { return null; }\n",
  });

test("Next.js App Router: routes from page files, route groups hidden", () => {
  const root = project({
    "package.json": pkg({ next: "15", react: "19" }),
    "tsconfig.json": "{}",
    "app/page.tsx": "",
    "app/(dash)/billing/page.tsx": "",
    "app/api/route.ts": "",
  });
  const analysis = analyzeWebsiteTarget(root);
  assert.equal(analysis.framework, "next-app");
  assert.deepEqual(analysis.existingRoutes.sort(), ["/", "/billing"]);
  assert.equal(pageFileFor(analysis, "/pricing", "pricing"), "app/pricing/page.tsx");
});

test("Next.js Pages Router and React Router are recognised; their routes read", () => {
  const pages = analyzeWebsiteTarget(project({ "package.json": pkg({ next: "13" }), "pages/index.jsx": "", "pages/about.jsx": "", "pages/_app.jsx": "", "pages/api/x.js": "" }));
  assert.equal(pages.framework, "next-pages");
  assert.deepEqual(pages.existingRoutes.sort(), ["/", "/about"]);
  assert.equal(pageFileFor(pages, "/pricing", "pricing"), "pages/pricing.jsx");

  const router = analyzeWebsiteTarget(reactRouterApp());
  assert.equal(router.framework, "react-router");
  assert.equal(router.routerFile, "src/App.tsx");
  assert.deepEqual(router.existingRoutes, ["/", "/settings"]);
  assert.deepEqual(router.styling, ["Tailwind CSS"]);
  assert.equal(pageFileFor(router, "/pricing", "pricing"), "src/pages/site/PricingPage.tsx");
});

test("unsupported projects are refused with the reason", () => {
  assert.match(analyzeWebsiteTarget(project({ "package.json": pkg({ vue: "3" }) })).reason ?? "", /Vue projects are not supported/);
  assert.match(analyzeWebsiteTarget(project({ "package.json": pkg({ react: "18" }) })).reason ?? "", /no router/);
  assert.match(analyzeWebsiteTarget(project({ "main.py": "" })).reason ?? "", /no package.json/);
});

test("a plan never takes an existing route or file, and KoreLumina decides the file", () => {
  const root = reactRouterApp();
  const analysis = analyzeWebsiteTarget(root);
  assert.match(buildPlanPrompt(analysis, root), /Routes the app already has: \/, \/settings/);
  const plan = parsePlan(
    JSON.stringify({
      summary: "Acme sends invoices.",
      pages: [
        { id: "home", title: "Home", route: "/", purpose: "x" },
        { id: "home", title: "Home", route: "/home", file: "../../etc/passwd", reuses: ["src/components/ui/button.tsx", "src/secret.ts"] },
        { id: "pricing", title: "Pricing", route: "/Pricing/" },
        { id: "bad id", title: "x", route: "/x" },
        { id: "evil", title: "x", route: "/../x" },
      ],
    }),
    analysis,
    root,
  );
  assert.deepEqual(plan.pages.map((page) => [page.id, page.route, page.file]), [
    ["home", "/home", "src/pages/site/HomePage.tsx"],
    ["pricing", "/pricing", "src/pages/site/PricingPage.tsx"],
  ]);
  assert.deepEqual(plan.pages[0].reuses, ["src/components/ui/button.tsx"]);
  assert.deepEqual(plan.rejected, ["route_taken:/", "invalid_page_id:bad id", "invalid_route:/../x"]);
});

test("import paths between project files", () => {
  assert.equal(importPath("src/pages/site/HomePage.tsx", "src/components/site/SiteLayout.tsx"), "../../components/site/SiteLayout");
  assert.equal(importPath("src/App.tsx", "src/pages/site/HomePage.tsx"), "./pages/site/HomePage");
});

test("a build writes nothing, becomes one draft, and that draft applies cleanly", async () => {
  const root = reactRouterApp();
  const analysis = analyzeWebsiteTarget(root);
  const plan = parsePlan(
    JSON.stringify({ pages: [{ id: "home", title: "Home", route: "/home" }, { id: "pricing", title: "Pricing", route: "/pricing" }] }),
    analysis,
    root,
  );
  const prompts: string[] = [];
  const client: TextGenerationClient = {
    generateText: async ({ prompt }) => {
      prompts.push(prompt);
      if (prompt.startsWith("Add routes")) {
        return {
          model: "fake",
          text: JSON.stringify({
            patches: [
              { type: "replace-text", file: "src/App.tsx", find: 'import Dashboard from "./pages/Dashboard";', replace: 'import Dashboard from "./pages/Dashboard";\nimport HomePage from "./pages/site/HomePage";\nimport PricingPage from "./pages/site/PricingPage";' },
              { type: "replace-text", file: "src/App.tsx", find: '      <Route path="/settings" element={<Dashboard />} />', replace: '      <Route path="/settings" element={<Dashboard />} />\n      <Route path="/home" element={<HomePage />} />\n      <Route path="/pricing" element={<PricingPage />} />' },
            ],
          }),
        };
      }
      const name = prompt.includes("shared website layout") ? "SiteLayout" : prompt.includes('"Pricing" page') ? "PricingPage" : "HomePage";
      return { model: "fake", text: "```tsx\nexport default function " + name + "() { return <p>[Your monthly price]</p>; }\n```" };
    },
  };

  const started = startWebsiteBuild({ projectId: "acme", projectPath: root, analysis, pages: plan.pages, summary: "Invoices.", client });
  assert.deepEqual(started.steps.map((step) => step.id), ["layout", "home", "pricing", "routes"]);
  for (let i = 0; i < 50 && getBuildJob(started.jobId)?.status === "running"; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const job = getBuildJob(started.jobId);
  assert.equal(job?.status, "done", job?.error ?? "");
  assert.ok(prompts.some((prompt) => prompt.includes("Never invent facts")));
  assert.ok(prompts.some((prompt) => prompt.includes('import { SiteLayout } from "../../components/site/SiteLayout"')));
  assert.equal(fs.existsSync(path.join(root, "src/pages/site/HomePage.tsx")), false, "nothing is written by the build");

  const draft = job!.draft!;
  assert.deepEqual(draft.patches.map((patch) => `${patch.type} ${patch.file}`), [
    "create-file src/components/site/SiteLayout.tsx",
    "create-file src/pages/site/HomePage.tsx",
    "create-file src/pages/site/PricingPage.tsx",
    "replace-text src/App.tsx",
  ]);
  const applied = applyDraft(root, draft);
  assert.equal(applied.refused, false, applied.errors.join(", "));
  const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
  assert.match(app, /import PricingPage from "\.\/pages\/site\/PricingPage";/);
  assert.match(app, /<Route path="\/pricing" element=\{<PricingPage \/>\} \/>/);
});

test("a build whose model fails on a page produces no draft", async () => {
  const root = project({ "package.json": pkg({ next: "15" }), "app/page.tsx": "" });
  const analysis = analyzeWebsiteTarget(root);
  const plan = parsePlan(JSON.stringify({ pages: [{ id: "pricing", title: "Pricing", route: "/pricing" }] }), analysis, root);
  const client: TextGenerationClient = {
    generateText: async ({ prompt }) => ({ model: "fake", text: prompt.includes("shared website layout") ? "```jsx\nexport function SiteLayout(){return null}\n```" : "Sorry, I cannot." }),
  };
  const started = startWebsiteBuild({ projectId: "p", projectPath: root, analysis, pages: plan.pages, summary: "", client });
  for (let i = 0; i < 50 && getBuildJob(started.jobId)?.status === "running"; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const job = getBuildJob(started.jobId)!;
  assert.equal(job.status, "failed");
  assert.equal(job.draft, null);
  assert.equal(job.steps.find((step) => step.id === "pricing")?.error, "ai_response_not_code");
});

const caller = (role: RuntimeCallerRole, userId = "alice"): RuntimeCaller => ({
  role,
  userId,
  supportAccess: role === "inhouse-dev" || role === "admin" || role === "super_admin",
  adminTools: role === "admin" || role === "super_admin",
});
const owned: ProjectMetadata = { projectId: "acme", ownerId: "alice", visibility: "private", createdAt: 1, updatedAt: 1 };

test("Transform is for the project's manager on Pro and above; Free waits for the paid unlock", () => {
  assert.deepEqual(decideTransformAccess(caller("pro"), owned), { ok: true });
  assert.deepEqual(decideTransformAccess(caller("business"), owned), { ok: true });
  assert.deepEqual(decideTransformAccess(caller("user"), owned), { ok: false, status: 402, error: "transform_requires_pro" });
  assert.deepEqual(decideTransformAccess(caller("pro", "mallory"), owned), { ok: false, status: 404, error: "project_not_found" });
  assert.deepEqual(decideTransformAccess(caller("inhouse-dev", "staff"), owned), { ok: true });
});
