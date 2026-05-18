import { useEffect, useRef, useState } from "react";
import { FolderGit2, FileArchive, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkspace, type ImportPrefill } from "@/context/WorkspaceContext";

const MAX_BYTES = 50 * 1024 * 1024;

const ZIP_EXT = /\.zip$/i;
const ZIP_MIME = new Set(["application/zip", "application/x-zip-compressed", "application/x-zip", "multipart/x-zip"]);
const isZip = (f: File) => ZIP_EXT.test(f.name) || ZIP_MIME.has(f.type);

function looksLikeRepoUrl(raw: string): string | null {
  const s = raw.trim().split(/\r?\n/)[0]?.trim();
  if (!s) return null;
  if (/^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+/i.test(s)) return s;
  if (/^git@github\.com:[^/\s]+\/[^/\s]+\.git$/i.test(s)) return s;
  if (/^https?:\/\/\S+\.git(\?\S*)?$/i.test(s)) return s;
  if (/^https?:\/\/(gitlab|bitbucket)\.[^/]+\/[^/\s]+\/[^/\s]+/i.test(s)) return s;
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s)) return `https://github.com/${s}`;
  return null;
}

type PayloadKind = "files" | "text" | "unknown";
const detectKind = (types: ReadonlyArray<string>): PayloadKind => {
  if (types.includes("Files")) return "files";
  if (types.includes("text/uri-list") || types.includes("text/plain")) return "text";
  return "unknown";
};

type HoverInfo = { fileCount: number; fileTypes: string[] };
type DropPreview =
  | { kind: "zip"; names: string[]; totalBytes: number }
  | { kind: "url"; url: string };

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Window-wide drag overlay: drop a .zip or a Git repo URL anywhere to open
 * the Import modal pre-filled. Renders nothing while idle.
 */
export function GlobalImportDropZone() {
  const { setImportOpen } = useWorkspace();
  const [active, setActive] = useState(false);
  const [kind, setKind] = useState<PayloadKind>("unknown");
  const [hover, setHover] = useState<HoverInfo>({ fileCount: 0, fileTypes: [] });
  const [preview, setPreview] = useState<DropPreview | null>(null);
  const depth = useRef(0);
  const previewTimer = useRef<number | null>(null);

  const openWithPreview = (p: DropPreview, prefill: ImportPrefill) => {
    setPreview(p);
    setActive(true);
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      setImportOpen(true, prefill);
      setPreview(null);
      setActive(false);
      previewTimer.current = null;
    }, 800);
  };

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      depth.current += 1;
      setKind(detectKind(Array.from(e.dataTransfer.types)));
      const items = Array.from(e.dataTransfer.items ?? []);
      const fileItems = items.filter((it) => it.kind === "file");
      setHover({
        fileCount: fileItems.length,
        fileTypes: fileItems.map((it) => it.type).filter(Boolean),
      });
      setActive(true);
    };
    const onDragOver = (e: DragEvent) => {
      // Required to receive `drop`. Show copy cursor.
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = (_e: DragEvent) => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0 && !preview) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      if (!e.dataTransfer) return;

      // Files first (ZIP).
      const incoming = Array.from(e.dataTransfer.files ?? []);
      if (incoming.length > 0) {
        const zips = incoming.filter(isZip);
        const skipped = incoming.length - zips.length;
        if (zips.length === 0) {
          setActive(false);
          toast.error("Only .zip files can be dropped here");
          return;
        }
        const total = zips.reduce((n, f) => n + f.size, 0);
        if (total > MAX_BYTES) {
          setActive(false);
          toast.error(`Dropped ZIPs exceed the 50 MB limit`);
          return;
        }
        const prefill: ImportPrefill = { tab: "zip", files: zips };
        openWithPreview(
          { kind: "zip", names: zips.map((f) => f.name), totalBytes: total },
          prefill
        );
        toast.success(
          zips.length === 1
            ? `Importing “${zips[0].name}”`
            : `Importing ${zips.length} ZIP files`,
          skipped > 0 ? { description: `${skipped} non-ZIP file${skipped === 1 ? "" : "s"} skipped` } : undefined
        );
        return;
      }

      // Text payload (URL).
      const text =
        e.dataTransfer.getData("text/uri-list") ||
        e.dataTransfer.getData("text/plain") ||
        "";
      const repoUrl = looksLikeRepoUrl(text);
      if (repoUrl) {
        openWithPreview({ kind: "url", url: repoUrl }, { tab: "github", url: repoUrl });
        toast.success("Repo URL detected", { description: repoUrl });
        return;
      }
      setActive(false);
      if (text.trim()) toast.error("Dropped text isn't a recognized repo URL");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) {
        depth.current = 0;
        if (previewTimer.current) { window.clearTimeout(previewTimer.current); previewTimer.current = null; }
        setPreview(null);
        setActive(false);
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("keydown", onKey);
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, [setImportOpen, active, preview]);

  if (!active) return null;

  const filesActive = kind === "files";
  const textActive = kind === "text";
  const hoverFileLabel =
    hover.fileCount > 0
      ? `${hover.fileCount} file${hover.fileCount === 1 ? "" : "s"}${
          hover.fileTypes[0] ? ` · ${hover.fileTypes[0]}` : ""
        }`
      : null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center bg-background/70 backdrop-blur-md animate-fade-in"
    >
      <div className="pointer-events-none rounded-3xl border-2 border-dashed border-violet/60 bg-surface-1/80 px-10 py-8 shadow-[0_0_60px_-10px_hsl(var(--violet)/0.4)] max-w-lg w-[90%]">
        <div className="flex items-center justify-center gap-2 mb-3 text-violet">
          <Upload className="h-5 w-5" />
          <span className="text-[11px] uppercase tracking-[0.22em] font-medium">
            {preview ? "Detected" : "Drop to import"}
          </span>
        </div>
        {preview ? (
          <DropPreviewPanel preview={preview} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Side
                Icon={FileArchive}
                title="ZIP archive"
                hint={filesActive && hoverFileLabel ? hoverFileLabel : "Up to 50 MB"}
                active={filesActive}
              />
              <Side
                Icon={FolderGit2}
                title="Git repo URL"
                hint="FolderGit2, GitLab, Bitbucket"
                active={textActive}
              />
            </div>
            <div className="mt-4 text-center text-[11px] text-muted-foreground">
              {kind === "files"
                ? "File names appear after release · Esc to cancel"
                : "Release to open the Import dialog · Esc to cancel"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DropPreviewPanel({ preview }: { preview: DropPreview }) {
  if (preview.kind === "url") {
    return (
      <div className="rounded-2xl border border-violet bg-violet/10 p-4">
        <div className="flex items-center gap-2 mb-2 text-violet">
          <FolderGit2 className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium">Repo URL</span>
        </div>
        <div className="text-[13px] font-mono break-all text-foreground">{preview.url}</div>
        <div className="mt-3 text-[11px] text-muted-foreground">Opening import dialog…</div>
      </div>
    );
  }
  const max = 6;
  const shown = preview.names.slice(0, max);
  const extra = preview.names.length - shown.length;
  return (
    <div className="rounded-2xl border border-violet bg-violet/10 p-4">
      <div className="flex items-center justify-between mb-2 text-violet">
        <div className="flex items-center gap-2">
          <FileArchive className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium">
            {preview.names.length === 1 ? "ZIP archive" : `${preview.names.length} ZIP archives`}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{formatBytes(preview.totalBytes)}</span>
      </div>
      <ul className="space-y-1 max-h-40 overflow-hidden">
        {shown.map((n) => (
          <li key={n} className="text-[12px] font-mono text-foreground truncate">{n}</li>
        ))}
        {extra > 0 && (
          <li className="text-[11px] text-muted-foreground">… +{extra} more</li>
        )}
      </ul>
      <div className="mt-3 text-[11px] text-muted-foreground">Opening import dialog…</div>
    </div>
  );
}

function Side({
  Icon, title, hint, active,
}: { Icon: any; title: string; hint: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-center transition",
        active
          ? "border-violet bg-violet/15 text-foreground"
          : "border-border bg-surface-2/40 text-muted-foreground"
      )}
    >
      <Icon className={cn("h-6 w-6 mx-auto mb-2", active ? "text-violet" : "text-muted-foreground")} />
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}