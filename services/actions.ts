import { toast } from "sonner";
import { importRepo as apiImportRepo, importZip as apiImportZip } from "./api";

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
  toast.success(`Deploying ${projectId} to ${provider}…`);
  return { ok: true };
}

export function openSettings(setView: (v: "settings") => void) { setView("settings"); }
export function upgradePlan(setView: (v: "pricing") => void) { setView("pricing"); }
export function switchMode(setMode: (m: "ai" | "designer" | "developer") => void, m: "ai" | "designer" | "developer") { setMode(m); }
export function openCommandPalette(setCommandOpen: (b: boolean) => void) { setCommandOpen(true); }