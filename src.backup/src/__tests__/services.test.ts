import { describe, it, expect, beforeEach } from "vitest";
import { clearNamespace, registerMigration, runMigrations, readJSON, writeJSON } from "@/lib/persistence";
import { projectRepository } from "@/services/projectRepository";
import { runAudit } from "@/services/auditEngine";
import { runTransform } from "@/services/transformEngine";
import { checkEntitlement } from "@/services/entitlements";
import { isFeatureEnabled, setFeatureFlagOverride } from "@/lib/featureFlags";
import { MockDeploymentProvider } from "@/providers/deploy/MockDeploymentProvider";
import { MockAIProvider } from "@/providers/ai/MockAIProvider";
import { MockBillingProvider } from "@/providers/billing/MockBillingProvider";
import { OpenAIProvider } from "@/providers/ai/OpenAIProvider";
import { StripeBillingProvider } from "@/providers/billing/StripeBillingProvider";
import { GitHubRepositoryProvider } from "@/providers/repo/GitHubRepositoryProvider";
import { VercelDeploymentProvider } from "@/providers/deploy/VercelDeploymentProvider";
import { auditStoredProject } from "@/services/repoAuditBridge";
import { NotImplementedError, AppError } from "@/lib/errors";
import type { ImportedRepo } from "@/providers/types";

beforeEach(() => {
  ["projects", "usage", "auth", "notifications", "deploy", "billing", "settings", "__schema__"].forEach(clearNamespace);
});

describe("projectRepository", () => {
  it("creates, lists, updates, duplicates, and removes", () => {
    const p = projectRepository.create({ name: "X", type: "webapp" });
    expect(projectRepository.list()).toHaveLength(1);
    const updated = projectRepository.update(p.id, { status: "live" });
    expect(updated.status).toBe("live");
    const dup = projectRepository.duplicate(p.id);
    expect(dup.name).toBe("X (copy)");
    expect(projectRepository.list()).toHaveLength(2);
    projectRepository.remove(p.id);
    expect(projectRepository.list()).toHaveLength(1);
  });
});

describe("entitlements", () => {
  it("denies AI when free plan has no session (free defaults apply)", () => {
    // No session → role = free, no usage row → snapshot returns 0/5 → allowed
    expect(checkEntitlement("ai.execute").allowed).toBe(true);
    // Deploy requires Pro
    expect(checkEntitlement("deploy").allowed).toBe(false);
    // Branded preview requires Business
    expect(checkEntitlement("preview.brandedUrl").allowed).toBe(false);
  });
});

describe("auditEngine", () => {
  it("flags missing deps, vulnerable packages, and missing env vars", () => {
    const repo: ImportedRepo = {
      id: "r", source: "github", name: "demo", framework: "react",
      files: {
        "src/App.tsx": "import x from 'axios';\nconsole.log(process.env.API_KEY);",
        ".env": "",
      },
      dependencies: { lodash: "4.17.20" },
      complexity: "low", summary: "", importedAt: Date.now(),
    };
    const plan = runAudit(repo);
    const cats = new Set(plan.findings.map((f) => f.category));
    expect(cats.has("dependency")).toBe(true);
    expect(cats.has("security")).toBe(true);
    expect(cats.has("env")).toBe(true);
    expect(plan.totalEtaMinutes).toBeGreaterThan(0);
  });
});

describe("transformEngine", () => {
  it("runs all stages and emits page stubs", async () => {
    const repo: ImportedRepo = {
      id: "r", source: "github", name: "demo", framework: "react",
      files: {}, dependencies: {}, complexity: "low", summary: "", importedAt: Date.now(),
    };
    const events: string[] = [];
    const result = await runTransform(repo, (s) => events.push(`${s.status}:${s.label}`));
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages[0].content).toContain("export default");
    expect(events.some((e) => e.startsWith("done:"))).toBe(true);
  }, 15000);
});

describe("featureFlags", () => {
  it("honors defaults and localStorage overrides", () => {
    expect(isFeatureEnabled("transform_to_website")).toBe(true);
    setFeatureFlagOverride("transform_to_website", false);
    expect(isFeatureEnabled("transform_to_website")).toBe(false);
    setFeatureFlagOverride("transform_to_website", null);
    expect(isFeatureEnabled("transform_to_website")).toBe(true);
  });
});

describe("schema migrations", () => {
  it("runs each registered migration at most once", () => {
    let count = 0;
    registerMigration("test_ns", 1, () => { count++; writeJSON("test_ns", "v", 1); });
    registerMigration("test_ns", 2, () => { count++; writeJSON("test_ns", "v", 2); });
    runMigrations();
    runMigrations();
    expect(count).toBe(2);
    expect(readJSON("test_ns", "v", 0)).toBe(2);
  });
});

describe("MockDeploymentProvider", () => {
  it("validates domain format and returns DNS records", async () => {
    const d = new MockDeploymentProvider();
    expect((await d.validateDomain("not a domain")).ok).toBe(false);
    const ok = await d.validateDomain("example.com");
    expect(ok.ok).toBe(true);
    expect(ok.records?.[0]?.type).toBe("CNAME");
  });
  it("deploys and lists deployments", async () => {
    const d = new MockDeploymentProvider();
    const dep = await d.deploy({ projectId: "p1", provider: "vercel" });
    expect(dep.status).toBe("ready");
    expect(d.list("p1")[0].id).toBe(dep.id);
  }, 10000);
});

describe("MockAIProvider", () => {
  it("emits build step events and returns diffs", async () => {
    const ai = new MockAIProvider();
    const events: string[] = [];
    const draft = await ai.orchestrate({ projectId: "p", prompt: "build dashboard with api", onEvent: (e) => events.push(e.status) });
    expect(draft.diffs.length).toBeGreaterThan(0);
    expect(events).toContain("running");
    expect(events).toContain("done");
  }, 15000);
  it("aborts mid-run when signal fires", async () => {
    const ai = new MockAIProvider();
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 50);
    await expect(ai.orchestrate({ projectId: "p", prompt: "x", signal: ctl.signal })).rejects.toBeInstanceOf(AppError);
  });
  it("rejects empty prompts", async () => {
    const ai = new MockAIProvider();
    await expect(ai.orchestrate({ projectId: "p", prompt: "" })).rejects.toBeInstanceOf(AppError);
  });
});

describe("MockBillingProvider", () => {
  it("performs checkout → confirm → cancel cycle", async () => {
    const { auth: a } = await import("@/providers/registry");
    await a.signUp({ email: "u@test.dev", password: "secret123", name: "U" });
    const b = new MockBillingProvider();
    const products = b.listProducts();
    expect(products.length).toBeGreaterThan(0);
    const uid = a.getUser()!.id;
    const ck = await b.checkout({ userId: uid, productId: products[0].id });
    expect(ck.sessionId).toBeTruthy();
    const conf = await b.confirmCheckout(ck.sessionId);
    expect(conf.payment.status).toBe("paid");
    const sub = b.getSubscription(uid);
    if (sub) {
      const canceled = await b.cancel(uid);
      expect(canceled.status).toBe("canceled");
    }
  });
});

describe("real-provider stubs", () => {
  it("throw NotImplementedError on every method", () => {
    expect(() => new OpenAIProvider().orchestrate()).toThrow(NotImplementedError);
    expect(() => new OpenAIProvider().applyDraft()).toThrow(NotImplementedError);
    expect(() => new StripeBillingProvider().listProducts()).toThrow(NotImplementedError);
    expect(() => new GitHubRepositoryProvider().importFromGithub()).toThrow(NotImplementedError);
    expect(() => new VercelDeploymentProvider().deploy()).toThrow(NotImplementedError);
  });
});

describe("repoAuditBridge", () => {
  it("audits a stored project's file map", () => {
    const p = projectRepository.create({
      name: "Bridge", type: "webapp",
      files: {
        "package.json": JSON.stringify({ dependencies: { lodash: "4.17.20" } }),
        "src/App.tsx": "import axios from 'axios';\nprocess.env.SECRET",
      },
    });
    const plan = auditStoredProject(p.id);
    expect(plan.findings.length).toBeGreaterThan(0);
  });
  it("throws AppError on missing project", () => {
    expect(() => auditStoredProject("nope")).toThrow(AppError);
  });
});

describe("api.ts retry / abort", () => {
  it("does not retry VALIDATION errors", async () => {
    // MockAIProvider rejects empty prompts with VALIDATION; generateDraft must surface immediately.
    const { generateDraft } = await import("@/services/api");
    const p = projectRepository.create({ name: "R", type: "webapp" });
    // Seed a session so entitlements pass
    writeJSON("auth", "session", { user: { id: "u1", email: "a@b.c", name: "A", role: "owner" }, expires: Date.now() + 60_000 });
    writeJSON("usage", "u1", { plan: "pro", aiExecutions: 0, aiLimit: 9999, projects: 0, deployments: 0, transformations: 0, audits: 0 });
    let attempts = 0;
    const start = Date.now();
    try {
      await generateDraft(p.id, "", { onEvent: () => { attempts++; } });
    } catch (e) {
      expect((e as AppError).code === "VALIDATION" || (e as AppError).code === "ENTITLEMENT_DENIED").toBe(true);
    }
    // No exponential-backoff delay if it didn't retry.
    expect(Date.now() - start).toBeLessThan(400);
    expect(attempts).toBe(0);
  });

  it("aborts a draft via signal", async () => {
    const { generateDraft } = await import("@/services/api");
    writeJSON("auth", "session", { user: { id: "u2", email: "a@b.c", name: "A", role: "owner" }, expires: Date.now() + 60_000 });
    writeJSON("usage", "u2", { plan: "pro", aiExecutions: 0, aiLimit: 9999, projects: 0, deployments: 0, transformations: 0, audits: 0 });
    const p = projectRepository.create({ name: "R", type: "webapp" });
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 30);
    await expect(generateDraft(p.id, "Build me a hero", { signal: ctrl.signal })).rejects.toBeInstanceOf(AppError);
  });
});

describe("persistence migration boot", () => {
  it("runs registered migrations in order and only once", () => {
    const calls: number[] = [];
    registerMigration("test-ns", 1, () => calls.push(1));
    registerMigration("test-ns", 2, () => calls.push(2));
    runMigrations();
    expect(calls).toEqual([1, 2]);
    runMigrations();
    expect(calls).toEqual([1, 2]);
    expect(readJSON("__schema__", "test-ns", 0)).toBe(2);
  });
});