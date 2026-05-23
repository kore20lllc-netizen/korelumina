const NAME_KEY = "korelumina:project-name";
const SLUG_KEY = "korelumina:project-slug";

export const RESERVED_SLUGS = ["preview", "builder", "api", "admin", "settings"];
export const PREVIEW_HOST = "preview.korelumina.app";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Lowercase letters, numbers, hyphens only";
  if (slug.startsWith("-") || slug.endsWith("-")) return "Cannot start or end with a hyphen";
  if (RESERVED_SLUGS.includes(slug)) return `"${slug}" is a reserved word`;
  if (slug.length < 2) return "Slug must be at least 2 characters";
  if (slug.length > 48) return "Slug must be 48 characters or fewer";
  return null;
}

export function getProjectName(): string {
  if (typeof window === "undefined") return "Untitled Project";
  return window.localStorage.getItem(NAME_KEY) || "Untitled Project";
}

export function getProjectSlug(): string {
  if (typeof window === "undefined") return "untitled-project";
  const stored = window.localStorage.getItem(SLUG_KEY);
  if (stored) return stored;
  const fromName = slugify(getProjectName());
  return fromName || "untitled-project";
}

export function setProjectName(name: string) {
  try { window.localStorage.setItem(NAME_KEY, name); } catch {}
  window.dispatchEvent(new CustomEvent("korelumina:project-settings-changed"));
}

export function setProjectSlug(slug: string) {
  try { window.localStorage.setItem(SLUG_KEY, slug); } catch {}
  window.dispatchEvent(new CustomEvent("korelumina:project-settings-changed"));
}

export function getPreviewUrl(slug = getProjectSlug()): string {
  return `https://${PREVIEW_HOST}/${slug}`;
}

export function subscribeProjectSettings(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("korelumina:project-settings-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("korelumina:project-settings-changed", handler);
    window.removeEventListener("storage", handler);
  };
}