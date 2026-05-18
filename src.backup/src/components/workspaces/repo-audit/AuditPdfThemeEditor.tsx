import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, RotateCcw, Upload, Link2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  AUDIT_PDF_THEMES,
  type AuditPdfThemeOverrides,
  rgbToHex,
  hexToRgb,
} from "@/services/repoAuditPdfService";

const MAX_STOPS = 6;
const LOGO_MAX_BYTES = 512 * 1024; // 512 KB
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: AuditPdfThemeOverrides;
  onSave: (next: AuditPdfThemeOverrides) => void;
  onReset: () => void;
}

function baseOverrides(): AuditPdfThemeOverrides {
  const base = AUDIT_PDF_THEMES.custom;
  return {
    headerBg: base.headerBg,
    headerStops: base.headerStops,
    headerEyebrow: base.headerEyebrow,
    accent: base.accent,
    badgeRing: base.badgeRing,
    badgeNumber: base.badgeNumber,
    footerMark: base.footerMark,
    footerMarkText: base.footerMarkText,
    footerTagline: base.footerTagline,
    showLogo: base.showLogo,
    logoDataUrl: null,
  };
}

function ColorField({ label, hex, onChange }: { label: string; hex: string; onChange: (h: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 bg-transparent border border-border rounded cursor-pointer"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-20 bg-surface-1 border border-border rounded px-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </span>
    </label>
  );
}

export function AuditPdfThemeEditor({ open, onOpenChange, value, onSave, onReset }: Props) {
  const merged: Required<AuditPdfThemeOverrides> = { ...baseOverrides(), ...value } as Required<AuditPdfThemeOverrides>;
  const [draft, setDraft] = useState<Required<AuditPdfThemeOverrides>>(merged);
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const next = { ...baseOverrides(), ...value } as Required<AuditPdfThemeOverrides>;
      setDraft(next);
      // If the stored logo is a URL (not a data URL), surface it in the URL input.
      setLogoUrlInput(
        next.logoDataUrl && !next.logoDataUrl.startsWith("data:") ? next.logoDataUrl : "",
      );
    }
  }, [open, value]);

  const setColor = (key: keyof AuditPdfThemeOverrides, hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setDraft((d) => ({ ...d, [key]: rgb }));
  };

  const setStop = (idx: number, hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setDraft((d) => {
      const next = [...d.headerStops];
      next[idx] = rgb;
      return { ...d, headerStops: next };
    });
  };

  const addStop = () =>
    setDraft((d) => (d.headerStops.length >= MAX_STOPS ? d : { ...d, headerStops: [...d.headerStops, [157, 91, 246]] }));

  const removeStop = (idx: number) =>
    setDraft((d) => ({ ...d, headerStops: d.headerStops.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    const base = baseOverrides();
    setDraft(base as Required<AuditPdfThemeOverrides>);
    setLogoUrlInput("");
    onReset();
  };

  const handleLogoFile = (file: File | null) => {
    if (!file) return;
    if (!LOGO_ACCEPT.split(",").includes(file.type)) {
      toast.error("Unsupported logo format", { description: "Use PNG, JPG, WebP, or SVG." });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("Logo too large", { description: "Maximum size is 512 KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        toast.error("Could not read the selected file");
        return;
      }
      setDraft((d) => ({ ...d, logoDataUrl: result, showLogo: true }));
      setLogoUrlInput("");
      toast.success("Logo attached to theme");
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsDataURL(file);
  };

  const applyLogoUrl = () => {
    const url = logoUrlInput.trim();
    if (!url) {
      setDraft((d) => ({ ...d, logoDataUrl: null }));
      return;
    }
    try {
      // Allow http(s) and data: URLs.
      const parsed = new URL(url);
      if (!["http:", "https:", "data:"].includes(parsed.protocol)) {
        toast.error("URL must use http(s) or data:");
        return;
      }
    } catch {
      toast.error("That doesn't look like a valid URL");
      return;
    }
    setDraft((d) => ({ ...d, logoDataUrl: url, showLogo: true }));
    toast.success("Logo URL saved", { description: "Falls back to brand mark if the image fails to load." });
  };

  const clearLogo = () => {
    setDraft((d) => ({ ...d, logoDataUrl: null }));
    setLogoUrlInput("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Live header preview
  const previewBg = rgbToHex(draft.headerBg);
  const stopsCss =
    draft.headerStops.length === 0
      ? "transparent"
      : `linear-gradient(90deg, ${draft.headerStops
          .map((s, i) => `${rgbToHex(s)} ${(i / Math.max(1, draft.headerStops.length - 1)) * 100}%`)
          .join(", ")})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Customize PDF theme</DialogTitle>
          <DialogDescription>
            Tweak the gradient header, accent color, logo visibility, and footer mark. Saved to this browser.
          </DialogDescription>
        </DialogHeader>

        {/* Live preview */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="relative h-20" style={{ background: previewBg }}>
            <div className="absolute inset-0 opacity-25" style={{ background: stopsCss }} />
            <div className="absolute inset-x-3 bottom-2 flex items-end justify-between">
              <div>
                <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color: rgbToHex(draft.headerEyebrow) }}>
                  KORELUMINA · REPO AUDIT
                </div>
                <div className="text-[16px] font-semibold text-white">Repo Audit Report</div>
              </div>
              {draft.showLogo && (
                draft.logoDataUrl ? (
                  <img
                    src={draft.logoDataUrl}
                    alt="Theme logo preview"
                    className="h-6 max-w-[64px] object-contain rounded bg-white/10 border border-white/20 p-0.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-6 w-12 rounded bg-white/10 border border-white/20 grid place-items-center text-[8px] text-white/70">
                    LOGO
                  </div>
                )
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: rgbToHex(draft.accent) }} />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-surface-1 text-[10px]">
            <span style={{ color: rgbToHex(draft.footerMark) }} className="font-semibold">
              {draft.footerMarkText || "—"}
            </span>
            <span className="text-muted-foreground">{draft.footerTagline}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-2">
          <ColorField label="Header background" hex={rgbToHex(draft.headerBg)} onChange={(h) => setColor("headerBg", h)} />
          <ColorField label="Eyebrow text" hex={rgbToHex(draft.headerEyebrow)} onChange={(h) => setColor("headerEyebrow", h)} />
          <ColorField label="Accent rule" hex={rgbToHex(draft.accent)} onChange={(h) => setColor("accent", h)} />
          <ColorField label="Step badge ring" hex={rgbToHex(draft.badgeRing)} onChange={(h) => setColor("badgeRing", h)} />
          <ColorField label="Step badge number" hex={rgbToHex(draft.badgeNumber)} onChange={(h) => setColor("badgeNumber", h)} />
          <ColorField label="Footer mark" hex={rgbToHex(draft.footerMark)} onChange={(h) => setColor("footerMark", h)} />
        </div>

        {/* Logo source */}
        <div className="mt-2 rounded-lg border border-border bg-surface-1 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Theme logo</span>
            {draft.logoDataUrl && (
              <button
                onClick={clearLogo}
                className="inline-flex items-center gap-1 h-6 px-2 rounded border border-border bg-background text-[11px] hover:bg-surface-2"
              >
                <ImageOff className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Upload a file or paste a URL. A per-workspace uploaded logo (set in the toolbar) always takes precedence.
            If the image fails to load, the report falls back to the default brand mark.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={LOGO_ACCEPT}
              className="hidden"
              onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-[12px] hover:bg-surface-2"
            >
              <Upload className="h-3.5 w-3.5" /> Upload logo
            </button>
            <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG · max 512 KB</span>
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="url"
              value={logoUrlInput}
              onChange={(e) => setLogoUrlInput(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-8 flex-1 min-w-0 bg-background border border-border rounded px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={applyLogoUrl}
              className="h-8 px-3 rounded-md border border-border bg-background text-[12px] hover:bg-surface-2"
            >
              Use URL
            </button>
          </div>
          {draft.logoDataUrl && (
            <div className="flex items-center gap-2 pt-1">
              <img
                src={draft.logoDataUrl}
                alt="Current theme logo"
                className="h-8 max-w-[120px] object-contain rounded border border-border bg-background p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <span className="text-[11px] text-muted-foreground truncate">
                {draft.logoDataUrl.startsWith("data:") ? "Embedded image" : draft.logoDataUrl}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Gradient stops</span>
            <button
              onClick={addStop}
              disabled={draft.headerStops.length >= MAX_STOPS}
              className="inline-flex items-center gap-1 h-6 px-2 rounded border border-border bg-surface-1 text-[11px] hover:bg-surface-2 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {draft.headerStops.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No gradient — solid header background.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {draft.headerStops.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-1 pl-1 pr-1.5 py-1">
                  <input
                    type="color"
                    value={rgbToHex(s)}
                    onChange={(e) => setStop(i, e.target.value)}
                    className="h-6 w-8 bg-transparent border-0 cursor-pointer"
                  />
                  <button
                    onClick={() => removeStop(i)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove gradient stop ${i + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-2">
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">Footer mark text</span>
            <input
              type="text"
              value={draft.footerMarkText}
              onChange={(e) => setDraft((d) => ({ ...d, footerMarkText: e.target.value.slice(0, 40) }))}
              className="h-8 bg-surface-1 border border-border rounded px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="KoreLumina"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-muted-foreground">Footer tagline</span>
            <input
              type="text"
              value={draft.footerTagline}
              onChange={(e) => setDraft((d) => ({ ...d, footerTagline: e.target.value.slice(0, 80) }))}
              className="h-8 bg-surface-1 border border-border rounded px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="· Repo Audit · confidential"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] col-span-full">
            <input
              type="checkbox"
              checked={draft.showLogo}
              onChange={(e) => setDraft((d) => ({ ...d, showLogo: e.target.checked }))}
              className="accent-violet-500"
            />
            <span className="text-muted-foreground">Show logo in header (custom uploaded logo always overrides)</span>
          </label>
        </div>

        <DialogFooter className="mt-2">
          <button
            onClick={handleReset}
            className="mr-auto inline-flex items-center gap-1 h-9 px-3 rounded-md border border-border bg-surface-1 text-[12px] hover:bg-surface-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-3 rounded-md border border-border bg-surface-1 text-[12px] hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-md bg-violet-500/90 text-white text-[12px] hover:bg-violet-500"
          >
            Save theme
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}