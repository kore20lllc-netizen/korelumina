import { readJSON, writeJSON, uid } from "@/lib/persistence";
import type { Deployment, DeploymentProvider } from "@/providers/types";

const NS = "deploy";
const all = (): Deployment[] => readJSON<Deployment[]>(NS, "all", []);
const save = (d: Deployment[]) => writeJSON(NS, "all", d);

export class MockDeploymentProvider implements DeploymentProvider {
  async deploy({ projectId, provider, customDomain, onLog }: { projectId: string; provider: Deployment["provider"]; customDomain?: string; onLog?: (line: string) => void }) {
    const dep: Deployment = { id: uid("dep"), projectId, provider, status: "building", logs: [], createdAt: Date.now(), customDomain };
    const stored = all(); stored.push(dep); save(stored);
    const logs = ["Cloning project…", "Installing dependencies…", "Running build…", "Optimizing assets…", "Uploading bundle…", "Deployment ready"];
    for (const line of logs) {
      dep.logs.push(line); onLog?.(line);
      const idx = stored.findIndex((x) => x.id === dep.id); if (idx >= 0) stored[idx] = { ...dep }; save(stored);
      await new Promise((r) => setTimeout(r, 350));
    }
    dep.status = "ready";
    dep.url = customDomain ? `https://${customDomain}` : `https://${projectId.slice(0, 6)}-${uid("h").slice(2, 8)}.lumina.app`;
    const idx = all().findIndex((x) => x.id === dep.id);
    const final = all(); if (idx >= 0) final[idx] = { ...dep }; save(final);
    return dep;
  }
  list(projectId: string) { return all().filter((d) => d.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt); }
  async validateDomain(domain: string) {
    await new Promise((r) => setTimeout(r, 250));
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return { ok: false, reason: "Invalid domain format." };
    return { ok: true, records: [{ type: "CNAME", name: domain, value: "cname.lumina.app" }] };
  }
}