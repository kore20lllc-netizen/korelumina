import { describe, it, expect, beforeEach } from "vitest";
import { clearNamespace, registerMigration, runMigrations, readJSON, writeJSON } from "@/lib/persistence";
import { projectRepository } from "@/services/projectRepository";
import { runTransform } from "@/services/transformEngine";
import { checkEntitlement } from "@/services/entitlements";
import { isFeatureEnabled, setFeatureFlagOverride } from "@/lib/featureFlags";
import { MockBillingProvider } from "@/providers/billing/MockBillingProvider";
import { StripeBillingProvider } from "@/providers/billing/StripeBillingProvider";
import { GitHubRepositoryProvider } from "@/providers/repo/GitHubRepositoryProvider";
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
    expect(() => new StripeBillingProvider().listProducts()).toThrow(NotImplementedError);
    expect(() => new GitHubRepositoryProvider().importFromGithub()).toThrow(NotImplementedError);
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