import { toast } from "sonner";
import { importRepo as apiImportRepo, importZip as apiImportZip } from "./api";
import { deploy } from "@/providers/deploy-registry";
import { auth } from "@/providers/auth-registry";
import { usage } from "@/providers/usage-registry";
import { notificationService } from "@/services/notificationService";
import { requireEntitlement } from "@/services/entitlements";
import { normalizeError } from "@/lib/errors";

export async function startBuilding(prompt: string) {
  toast.success("Starting build…");
  return { ok: true, prompt };
}

export async function importRepo(repoUrl: string) {
  try {
    return await apiImportRepo(repoUrl);
  } catch (e) {
    toast.error(`Import failed: ${(e as Error).message}`);
    throw e;
  }
}

export async function uploadZip(file: File) {
  try {
    return await apiImportZip(file);
  } catch (e) {
    toast.error(`Upload failed: ${(e as Error).message}`);
    throw e;
  }
}

export async function deployProject(projectId: string, provider: string) {
  try {
    requireEntitlement("deploy");
    toast.success(`Deploying to ${provider}…`);
    const d = await deploy.deploy({ projectId, provider: provider as "vercel" | "netlify" | "custom" });
    const u = auth.getUser(); if (u) usage.recordDeployment(u.id);
    notificationService.push({ title: "Deployment ready", body: d.url ?? "Live", kind: "success" });
    return { ok: true, url: d.url };
  } catch (e) {
    const ae = normalizeError(e);
    toast.error(ae.userMessage);
    throw ae;
  }
}

export function openSettings(setView: (v: "settings") => void) { setView("settings"); }
export function upgradePlan(setView: (v: "pricing") => void) { setView("pricing"); }
export function switchMode(setMode: (m: "ai" | "designer" | "developer") => void, m: "ai" | "designer" | "developer") { setMode(m); }
export function openCommandPalette(setCommandOpen: (b: boolean) => void) { setCommandOpen(true); }
