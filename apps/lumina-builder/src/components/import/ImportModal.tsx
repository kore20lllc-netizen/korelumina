import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Github, Upload, FolderOpen, LayoutTemplate, Loader2, CheckCircle2, AlertCircle, X, FileArchive, Ban, Trash2, Timer, Sparkles } from "lucide-react";
import {
  ImportSuccessPanel,
  type DetectedRepo,
} from "./ImportSuccessPanel";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { importRepo as importRepositoryAction } from "@/services/actions";
import { cn } from "@/lib/utils";
import { mockTemplates } from "@/lib/mockData";

type Tab = "github" | "git" | "zip" | "local" | "templates";

const tabs: { id: Tab; label: string; Icon: any }[] = [
  { id: "github",    label: "GitHub",    Icon: Github },
  { id: "git",       label: "Git URL",   Icon: Github },
  { id: "zip",       label: "ZIP",       Icon: Upload },
  { id: "local",     label: "Local",     Icon: FolderOpen },
  { id: "templates", label: "Templates", Icon: LayoutTemplate },
];

type StageKey = "connect" | "fetch" | "analyze" | "finalize";
const STAGES: { key: StageKey; label: string; pct: number }[] = [
  { key: "connect",  label: "Connecting to source",   pct: 18 },
  { key: "fetch",    label: "Fetching files",         pct: 62 },
  { key: "analyze",  label: "Analyzing project",      pct: 88 },
  { key: "finalize", label: "Finalizing workspace",   pct: 100 },
];

interface Progress {
  stage: StageKey;
  pct: number;
  status: "running" | "success" | "error";
  message: string;
  error?: string;
  label: string;
  detected?: DetectedRepo;
}

interface FileProgress {
  id: string;
  name: string;
  size: number;
  pct: number;
  status: "queued" | "uploading" | "processing" | "success" | "error" | "cancelled";
  error?: string;
}

const formatSize = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const formatRate = (bps: number) => {
  if (!isFinite(bps) || bps <= 0) return "0 B/s";
  if (bps < 1024) return `${bps.toFixed(0)} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
  return `${(bps / 1024 / 1024).toFixed(2)} MB/s`;
};

const formatEta = (sec: number | null) => {
  if (sec == null || !isFinite(sec) || sec < 0) return "—";
  if (sec < 1) return "<1s";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}m ${s}s`;
};

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_FOLDER_FILES = 5000;

// Traverse a dropped directory using the (non-standard but widely supported)
// FileSystem entries API. Returns flat list of {file, relative path}.
async function readDirectoryEntries(
  dirReader: any
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const all: any[] = [];
    const read = () => {
      dirReader.readEntries((entries: any[]) => {
        if (entries.length === 0) resolve(all);
        else { all.push(...entries); read(); }
      }, reject);
    };
    read();
  });
}
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", ".turbo", ".cache", "__pycache__"]);
async function walkEntry(
  entry: any,
  pathPrefix: string,
  out: { file: File; path: string }[],
  cap: number,
  onProgress?: (count: number, currentPath: string, fileSize: number) => void,
  isCancelled?: () => boolean
): Promise<void> {
  if (out.length >= cap || isCancelled?.()) return;
  if (entry.isFile) {
    await new Promise<void>((resolve) => {
      entry.file(
        (file: File) => {
          if (isCancelled?.()) { resolve(); return; }
          out.push({ file, path: `${pathPrefix}${entry.name}` });
          onProgress?.(out.length, `${pathPrefix}${entry.name}`, file.size);
          resolve();
        },
        () => resolve()
      );
    });
    return;
  }
  if (entry.isDirectory) {
    if (SKIP_DIRS.has(entry.name)) return;
    const reader = entry.createReader();
    const children = await readDirectoryEntries(reader);
    for (const child of children) {
      if (out.length >= cap || isCancelled?.()) break;
      await walkEntry(child, `${pathPrefix}${entry.name}/`, out, cap, onProgress, isCancelled);
    }
  }
}

export function ImportModal() {
  const { importOpen, setImportOpen, setView, importPrefill, setImportPrefill } = useWorkspace();
  const [tab, setTab] = useState<Tab>("github");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [folder, setFolder] = useState<{ name: string; entries: { file: File; path: string }[] } | null>(null);
  const [folderHover, setFolderHover] = useState(false);
  const [folderScan, setFolderScan] = useState<{
    count: number;
    bytes: number;
    current: string;
    root: string;
    avgBps: number;
    curBps: number;
    phase: "scanning" | "finalizing" | "cancelling" | "error";
    totalBytes: number | null;
    etaSec: number | null;
  } | null>(null);
  const scanCancelRef = useRef(false);
  const scanStartRef = useRef<number>(0);
  const scanSampleRef = useRef<{ t: number; bytes: number }>({ t: 0, bytes: 0 });
  const lastScanRef = useRef<
    | { kind: "picker"; arr: File[] }
    | { kind: "drop"; root: any; rootName: string }
    | null
  >(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [filesProgress, setFilesProgress] = useState<FileProgress[] | null>(null);
  const timers = useRef<Map<string, number[]>>(new Map());
  const startedAtRef = useRef<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);

  const busy = progress?.status === "running"
    || filesProgress?.some((f) => f.status === "uploading" || f.status === "processing" || f.status === "queued");

  useEffect(() => () => {
    timers.current.forEach((arr) => arr.forEach(clearTimeout));
    timers.current.clear();
  }, []);

  // Apply pre-fill payload (e.g. from the global drop zone) when the modal opens.
  useEffect(() => {
    if (!importOpen || !importPrefill) return;
    if (importPrefill.tab === "github") {
      setTab("github");
      setUrl(importPrefill.url);
    } else if (importPrefill.tab === "zip") {
      setTab("zip");
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
        const merged = [...prev];
        for (const f of importPrefill.files) {
          const k = `${f.name}:${f.size}`;
          if (!seen.has(k)) { merged.push(f); seen.add(k); }
        }
        return merged;
      });
    }
    setImportPrefill(null);
  }, [importOpen, importPrefill, setImportPrefill]);

  const clearTimersFor = (key: string) => {
    const arr = timers.current.get(key);
    if (arr) { arr.forEach(clearTimeout); timers.current.delete(key); }
  };

  const clearAllTimers = () => {
    timers.current.forEach((arr) => arr.forEach(clearTimeout));
    timers.current.clear();
  };

  const reset = () => {
    clearAllTimers();
    setProgress(null);
    setFilesProgress(null);
    startedAtRef.current = null;
    setCompletedAt(null);
  };

  const close = () => {
    if (busy) return;
    scanCancelRef.current = true;
    setImportOpen(false);
    setUrl("");
    setFiles([]);
    setFolder(null);
    setFolderScan(null);
    reset();
  };

  const scheduleFor = (key: string, delay: number, fn: () => void) => {
    const id = window.setTimeout(fn, delay);
    const arr = timers.current.get(key) ?? [];
    arr.push(id);
    timers.current.set(key, arr);
  };
  const schedule = (delay: number, fn: () => void) => scheduleFor("_global", delay, fn);

  const isValidGitUrl = (u: string) => /^https?:\/\/.+\..+\/.+/.test(u.trim());

  const runUrlImport = (label: string, shouldFail = false) => {
    reset();
    setProgress({ stage: "connect", pct: 4, status: "running", message: STAGES[0].label, label });

    schedule(450, () => setProgress((p) => p && { ...p, stage: "connect", pct: STAGES[0].pct, message: STAGES[0].label }));
    schedule(1100, () => setProgress((p) => p && { ...p, stage: "fetch", pct: STAGES[1].pct, message: STAGES[1].label }));
    schedule(1900, () => {
      if (shouldFail) {
        const err = "Repository not found or access denied.";
        setProgress((p) => p && { ...p, status: "error", message: "Import failed", error: err });
        toast.error("Import failed", { description: err });
        return;
      }
      setProgress((p) => p && { ...p, stage: "analyze", pct: STAGES[2].pct, message: STAGES[2].label });
    });
    if (!shouldFail) {
      schedule(2500, () => setProgress((p) => p && { ...p, stage: "finalize", pct: STAGES[3].pct, message: STAGES[3].label }));
      schedule(2900, () => {
        setProgress((p) => p && { ...p, status: "success", pct: 100, message: "Import complete" });
        toast.success("Import complete", { description: label });
      });
      // Keep the dialog open and show the premium success screen.
      // Users explicitly continue from there (Go to imports / Transform / Open in Builder…).
    }
  };

  const runFilesImport = (sourceFiles: File[]) => {
    reset();
    startedAtRef.current = Date.now();
    setCompletedAt(null);
    const initial: FileProgress[] = sourceFiles.map((f, i) => ({
      id: `${i}-${f.name}`,
      name: f.name,
      size: f.size,
      pct: 0,
      status: i === 0 ? "uploading" : "queued",
      error: f.size > MAX_BYTES
        ? `File exceeds 50MB limit (${formatSize(f.size)})`
        : !/\.zip$/i.test(f.name)
        ? "Unsupported file type — .zip required"
        : undefined,
    }));
    setFilesProgress(initial);

    // Process each file sequentially
    let cursor = 0;
    sourceFiles.forEach((f, i) => {
      const willFail = !!initial[i].error;
      const startDelay = cursor;
      const uploadDuration = willFail ? 600 : 1400;
      const processDuration = willFail ? 0 : 700;
      const fileKey = initial[i].id;

      // animate upload progress in 5 ticks
      if (!willFail) {
        for (let t = 1; t <= 5; t++) {
          scheduleFor(fileKey, startDelay + (uploadDuration * t) / 5, () => {
            setFilesProgress((prev) => prev && prev.map((fp, idx) =>
              idx === i ? { ...fp, status: "uploading", pct: Math.min(80, t * 16) } : fp
            ));
          });
        }
        // processing
        scheduleFor(fileKey, startDelay + uploadDuration, () => {
          setFilesProgress((prev) => prev && prev.map((fp, idx) =>
            idx === i ? { ...fp, status: "processing", pct: 90 } : fp
          ));
        });
        scheduleFor(fileKey, startDelay + uploadDuration + processDuration, () => {
          setFilesProgress((prev) => prev && prev.map((fp, idx) => {
            if (idx === i) return { ...fp, status: "success", pct: 100 };
            if (idx === i + 1 && fp.status === "queued") return { ...fp, status: "uploading", pct: 0 };
            return fp;
          }));
        });
      } else {
        // fail mid-upload
        scheduleFor(fileKey, startDelay + uploadDuration / 2, () => {
          setFilesProgress((prev) => prev && prev.map((fp, idx) =>
            idx === i ? { ...fp, status: "uploading", pct: 35 } : fp
          ));
        });
        scheduleFor(fileKey, startDelay + uploadDuration, () => {
          setFilesProgress((prev) => prev && prev.map((fp, idx) => {
            if (idx === i) return { ...fp, status: "error", pct: 35 };
            if (idx === i + 1 && fp.status === "queued") return { ...fp, status: "uploading", pct: 0 };
            return fp;
          }));
          toast.error(`${f.name} failed`, { description: initial[i].error });
        });
      }

      cursor += uploadDuration + processDuration + 200;
    });

    // Final summary
    schedule(cursor + 400, () => {
      setCompletedAt(Date.now());
      setFilesProgress((prev) => {
        if (!prev) return prev;
        const ok = prev.filter((fp) => fp.status === "success").length;
        const failed = prev.filter((fp) => fp.status === "error").length;
        if (ok > 0 && failed === 0) {
          toast.success(`Imported ${ok} file${ok > 1 ? "s" : ""}`);
        } else if (ok > 0 && failed > 0) {
          toast.warning(`${ok} imported · ${failed} failed`);
        } else if (failed > 0) {
          toast.error(`All ${failed} file${failed > 1 ? "s" : ""} failed`);
        }
        return prev;
      });
    });
  };

  const submitUrl = async () => {
    const value = url.trim();

    if (!value) {
      return;
    }

    if (!isValidGitUrl(value)) {
      const err = "Repository not found or access denied.";

      setProgress({
        stage: "connect",
        pct: STAGES[0].pct,
        status: "error",
        message: "Import failed",
        error: err,
        label: value,
      });

      toast.error("Import failed", {
        description: err,
      });

      return;
    }

    reset();

    setProgress({
      stage: "connect",
      pct: STAGES[0].pct,
      status: "running",
      message: STAGES[0].label,
      label: value,
    });

    try {
      setProgress((current) =>
        current && {
          ...current,
          stage: "fetch",
          pct: STAGES[1].pct,
          message: STAGES[1].label,
        },
      );

      const imported =
        await importRepositoryAction(value);

      setProgress((current) =>
        current && {
          ...current,
          stage: "analyze",
          pct: STAGES[2].pct,
          message: STAGES[2].label,
        },
      );

      setProgress((current) =>
        current && {
          ...current,
          stage: "finalize",
          pct: STAGES[3].pct,
          message: STAGES[3].label,
        },
      );

      const framework =
        imported.framework && imported.framework !== "unknown"
          ? imported.framework
          : "Unknown";

      setProgress((current) =>
        current && {
          ...current,
          status: "success",
          pct: 100,
          message: "Import complete",
          label: imported.name || value,
          detected: {
            framework,
            appType: "Imported repository",
            pages: 0,
            components: 0,
            designScore: 0,
          },
        },
      );

      toast.success("Import complete", {
        description: imported.name || value,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Import failed";

      setProgress((current) =>
        current && {
          ...current,
          status: "error",
          message: "Import failed",
          error: message,
        },
      );

      toast.error("Import failed", {
        description: message,
      });
    }
  };

  const submitZip = () => {
    if (files.length === 0) return;
    runFilesImport(files);
  };

  const submitFolder = () => {
    if (!folder || folder.entries.length === 0) return;
    runUrlImport(`${folder.name}/ · ${folder.entries.length} files`);
  };

  const runPickerScan = (arr: File[]) => {
    if (arr.length === 0) return;
    lastScanRef.current = { kind: "picker", arr };
    const rootGuess =
      ((arr[0] as any).webkitRelativePath as string | undefined)?.split("/")[0] || "folder";
    scanCancelRef.current = false;
    scanStartRef.current = performance.now();
    scanSampleRef.current = { t: scanStartRef.current, bytes: 0 };
    // Pre-compute the total accepted byte count so we can show real ETA.
    let totalBytes = 0;
    for (const f of arr) {
      const rel = (f as any).webkitRelativePath as string | undefined;
      const segs = (rel || f.name).split("/");
      if (!segs.some((s) => SKIP_DIRS.has(s))) totalBytes += f.size;
    }
    setFolderScan({
      count: 0, bytes: 0, current: "", root: rootGuess,
      avgBps: 0, curBps: 0, phase: "scanning",
      totalBytes, etaSec: null,
    });
    // Process in chunks so the progress UI can paint between batches.
    const CHUNK = 250;
    const accepted: { file: File; path: string }[] = [];
    let skipped = 0;
    let bytes = 0;
    let i = 0;
    const step = () => {
      if (scanCancelRef.current) {
        setFolderScan((prev) => prev && { ...prev, phase: "cancelling" });
        window.setTimeout(() => setFolderScan(null), 250);
        toast("Folder scan cancelled");
        return;
      }
      const end = Math.min(arr.length, i + CHUNK);
      for (; i < end; i++) {
        if (accepted.length >= MAX_FOLDER_FILES) { i = arr.length; break; }
        const f = arr[i];
        const rel = (f as any).webkitRelativePath as string | undefined;
        const path = rel || f.name;
        const segs = path.split("/");
        if (segs.some((s) => SKIP_DIRS.has(s))) { skipped++; continue; }
        accepted.push({ file: f, path });
        bytes += f.size;
      }
      const last = accepted[accepted.length - 1];
      const now = performance.now();
      const totalSec = Math.max(0.001, (now - scanStartRef.current) / 1000);
      const dt = Math.max(0.001, (now - scanSampleRef.current.t) / 1000);
      const dBytes = bytes - scanSampleRef.current.bytes;
      const curBps = dt > 0.05 ? dBytes / dt : scanSampleRef.current.bytes ? dBytes / dt : 0;
      scanSampleRef.current = { t: now, bytes };
      const finishing = i >= arr.length;
      const blendedBps = curBps > 0 ? curBps * 0.6 + (bytes / totalSec) * 0.4 : bytes / totalSec;
      const remaining = Math.max(0, totalBytes - bytes);
      const etaSec = blendedBps > 0 ? remaining / blendedBps : null;
      setFolderScan({
        count: accepted.length,
        bytes,
        current: last?.path ?? "",
        root: rootGuess,
        avgBps: bytes / totalSec,
        curBps,
        phase: finishing ? "finalizing" : "scanning",
        totalBytes,
        etaSec: finishing ? 0 : etaSec,
      });
      if (i < arr.length) {
        window.setTimeout(step, 0);
      } else {
        setFolderScan(null);
        if (accepted.length === 0) {
          toast.error("Folder is empty after filtering");
          return;
        }
        setFolder({ name: rootGuess, entries: accepted });
        if (skipped > 0) toast(`Skipped ${skipped} files (build/vendor dirs)`);
      }
    };
    step();
  };

  const onPickDirectoryInput = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    runPickerScan(Array.from(list));
  };

  const runDropScan = async (root: any, rootName: string) => {
    lastScanRef.current = { kind: "drop", root, rootName };
    const collected: { file: File; path: string }[] = [];
    scanCancelRef.current = false;
    scanStartRef.current = performance.now();
    scanSampleRef.current = { t: scanStartRef.current, bytes: 0 };
    setFolderScan({
      count: 0, bytes: 0, current: "", root: rootName,
      avgBps: 0, curBps: 0, phase: "scanning",
      totalBytes: null, etaSec: null,
    });
    let lastPaint = 0;
    let scannedBytes = 0;
    try {
      await walkEntry(root, "", collected, MAX_FOLDER_FILES, (count, currentPath, fileSize) => {
        scannedBytes += fileSize;
        const now = performance.now();
        if (now - lastPaint > 30 || count === 1) {
          lastPaint = now;
          const totalSec = Math.max(0.001, (now - scanStartRef.current) / 1000);
          const dt = Math.max(0.001, (now - scanSampleRef.current.t) / 1000);
          const dBytes = scannedBytes - scanSampleRef.current.bytes;
          const curBps = dBytes / dt;
          scanSampleRef.current = { t: now, bytes: scannedBytes };
          setFolderScan({
            count,
            bytes: scannedBytes,
            current: currentPath,
            root: rootName,
            avgBps: scannedBytes / totalSec,
            curBps,
            phase: scanCancelRef.current ? "cancelling" : "scanning",
            totalBytes: null,
            etaSec: null,
          });
        }
      }, () => scanCancelRef.current);
    } catch {
      setFolderScan((prev) => prev && { ...prev, phase: "error" });
      toast.error("Couldn't read folder contents");
      return;
    }
    setFolderScan((prev) => prev && { ...prev, phase: "finalizing" });
    window.setTimeout(() => setFolderScan(null), 150);
    if (scanCancelRef.current) {
      toast("Folder scan cancelled");
      return;
    }
    if (collected.length === 0) {
      setFolderScan(null);
      toast.error("Folder is empty");
      return;
    }
    const truncated = collected.length >= MAX_FOLDER_FILES;
    setFolder({ name: rootName, entries: collected });
    toast.success(
      `Loaded “${rootName}” · ${collected.length} file${collected.length === 1 ? "" : "s"}`,
      truncated ? { description: `Capped at ${MAX_FOLDER_FILES} files` } : undefined
    );
  };

  const retryFolderScan = () => {
    const last = lastScanRef.current;
    if (!last) {
      setFolderScan(null);
      return;
    }
    if (last.kind === "picker") runPickerScan(last.arr);
    else runDropScan(last.root, last.rootName);
  };

  const dismissFolderScan = () => {
    setFolderScan(null);
  };

  const onDropFolder = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setFolderHover(false);
    const dt = e.dataTransfer;
    if (!dt) return;
    const items = Array.from(dt.items ?? []);

    const dirEntries = items
      .map((it) => (typeof (it as any).webkitGetAsEntry === "function" ? (it as any).webkitGetAsEntry() : null))
      .filter(Boolean);

    if (dirEntries.length === 0) {
      // Fallback: plain files dropped without folder context.
      const files = Array.from(dt.files ?? []);
      if (files.length === 0) {
        toast.error("No folder detected in drop");
        return;
      }
      // Plain files: run picker scan with the file list.
      runPickerScan(files);
      return;
    }
    const dirs = dirEntries.filter((e: any) => e.isDirectory);
    if (dirs.length === 0) {
      toast.error("Drop a folder, not a file");
      return;
    }
    if (dirs.length > 1) {
      toast.error("Drop a single folder at a time");
      return;
    }
    const root = dirs[0];
    await runDropScan(root, root.name);
  };

  const retryFile = (id: string) => {
    const fp = filesProgress?.find((f) => f.id === id);
    if (!fp) return;
    const wouldStillFail = fp.size > MAX_BYTES || !/\.zip$/i.test(fp.name);
    clearTimersFor(id);
    setFilesProgress((prev) => prev && prev.map((f) =>
      f.id === id ? { ...f, status: "uploading", pct: 0, error: undefined } : f
    ));
    if (wouldStillFail) {
      scheduleFor(id, 700, () => {
        setFilesProgress((prev) => prev && prev.map((f) =>
          f.id === id ? { ...f, status: "error", pct: 35, error: fp.error } : f
        ));
        toast.error(`${fp.name} failed again`, { description: fp.error });
      });
    } else {
      [25, 55, 85].forEach((p, idx) => scheduleFor(id, 300 * (idx + 1), () => {
        setFilesProgress((prev) => prev && prev.map((f) =>
          f.id === id ? { ...f, status: "uploading", pct: p } : f
        ));
      }));
      scheduleFor(id, 1300, () => {
        setFilesProgress((prev) => prev && prev.map((f) =>
          f.id === id ? { ...f, status: "success", pct: 100 } : f
        ));
        toast.success(`${fp.name} imported`);
      });
    }
  };

  const cancelFile = (id: string) => {
    const fp = filesProgress?.find((f) => f.id === id);
    if (!fp) return;
    clearTimersFor(id);
    setFilesProgress((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((f) => f.id === id);
      const next = prev.map((f, i) => {
        if (f.id === id) return { ...f, status: "cancelled" as const, error: "Cancelled by user" };
        // promote the next queued file if we cancelled the active one
        if (i === idx + 1 && f.status === "queued") return { ...f, status: "uploading" as const, pct: 0 };
        return f;
      });
      return next;
    });
    toast(`${fp.name} cancelled`);
  };

  const removeFile = (id: string) => {
    const fp = filesProgress?.find((f) => f.id === id);
    if (!fp) return;
    clearTimersFor(id);
    setFilesProgress((prev) => prev && prev.filter((f) => f.id !== id));
  };

  const finishMulti = () => {
    const ok = filesProgress?.filter((f) => f.status === "success").length ?? 0;
    setImportOpen(false);
    setUrl(""); setFiles([]);
    reset();
    if (ok > 0) setView("imports");
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
  };

  return (
    <Dialog open={importOpen} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="glass-strong border-border max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="font-display text-xl">Import project</DialogTitle>
          <p className="text-[12px] text-muted-foreground mt-1">Bring an existing codebase into KoreLumina.</p>
        </DialogHeader>

        {!progress && !filesProgress && (
          <div className="px-6 pt-4 flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const I = t.Icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[12px] flex items-center gap-1.5 transition border",
                    active ? "bg-surface-3 border-white/15 text-foreground" : "bg-surface-1 border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-6 min-h-[220px]">
          {progress ? (
            progress.status === "success" ? (
              <ImportSuccessPanel
                label={progress.label}
                detected={progress.detected}
                onOpenImports={() => {
                  setImportOpen(false);
                  setUrl("");
                  setFiles([]);
                  reset();
                  setView("imports");
                }}
              />
            ) : (
              <ProgressPanel progress={progress} onRetry={submitUrl} onCancel={reset} onClose={close} />
            )
          ) : filesProgress ? (
            <FilesProgressPanel
              items={filesProgress}
              busy={!!busy}
              elapsedMs={completedAt && startedAtRef.current ? completedAt - startedAtRef.current : null}
              onRetry={retryFile}
              onCancelFile={cancelFile}
              onRemoveFile={removeFile}
              onCancel={reset}
              onClose={finishMulti}
            />
          ) : (
            <>
              {(tab === "github" || tab === "git") && (
                <div className="space-y-3">
                  <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">
                    {tab === "github" ? "GitHub URL" : "Public Git URL"}
                  </label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={tab === "github" ? "https://github.com/owner/repo" : "https://git.example.com/owner/repo.git"}
                    className="w-full h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition"
                  />
                  <div className="flex justify-end pt-3">
                    <LuminaButton size="md" onClick={submitUrl} disabled={!url.trim()}>
                      <Github className="h-3.5 w-3.5" />
                      Import
                    </LuminaButton>
                  </div>
                </div>
              )}

              {tab === "zip" && (
                <div className="space-y-3">
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onPickFiles(e.dataTransfer.files); }}
                    className="flex flex-col items-center justify-center gap-2 h-36 rounded-xl border border-dashed border-white/15 bg-surface-1/40 hover:border-violet/40 transition cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[13px]">Drop ZIP files here or click to browse</span>
                    <span className="text-[11px] text-muted-foreground">.zip up to 50MB · multiple allowed</span>
                    <input type="file" accept=".zip" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
                  </label>
                  {files.length > 0 && (
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                      {files.map((f, i) => (
                        <li key={`${i}-${f.name}`} className="flex items-center gap-2.5 px-3 h-9 rounded-lg bg-surface-1 border border-border text-[12px]">
                          <FileArchive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{f.name}</span>
                          <span className="text-muted-foreground tabular-nums">{formatSize(f.size)}</span>
                          <button
                            onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="h-5 w-5 grid place-items-center rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-end">
                    <LuminaButton size="md" onClick={submitZip} disabled={files.length === 0}>
                      <Upload className="h-3.5 w-3.5" />
                      Upload {files.length > 0 ? `(${files.length})` : ""}
                    </LuminaButton>
                  </div>
                </div>
              )}

              {tab === "local" && (
                <div className="space-y-3">
                  <label
                    onDragOver={(e) => { e.preventDefault(); setFolderHover(true); }}
                    onDragLeave={() => setFolderHover(false)}
                    onDrop={onDropFolder}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 h-36 rounded-xl border border-dashed bg-surface-1/40 transition cursor-pointer",
                      folderHover ? "border-violet bg-violet/10" : "border-white/15 hover:border-violet/40",
                      folderScan && "pointer-events-none opacity-60"
                    )}
                  >
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[13px]">Drop a folder here or click to browse</span>
                    <span className="text-[11px] text-muted-foreground">
                      Skips .git, node_modules, dist · up to {MAX_FOLDER_FILES.toLocaleString()} files
                    </span>
                    <input
                      type="file"
                      // @ts-expect-error — non-standard but supported in Chromium/WebKit/Firefox
                      webkitdirectory=""
                      directory=""
                      multiple
                      className="hidden"
                      onChange={(e) => onPickDirectoryInput(e.target.files)}
                      disabled={!!folderScan}
                    />
                  </label>

                  {folderScan && (
                    <div className={cn(
                      "rounded-xl border p-3 space-y-2 anim-in",
                      folderScan.phase === "error"
                        ? "border-rose-500/40 bg-rose-500/5"
                        : "border-violet/40 bg-violet/5"
                    )}>
                      <div className="flex items-center gap-2">
                        {folderScan.phase === "error" ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <Loader2 className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            folderScan.phase === "scanning" && "text-violet animate-spin",
                            folderScan.phase === "finalizing" && "text-cyan animate-spin",
                            folderScan.phase === "cancelling" && "text-muted-foreground animate-spin",
                          )} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium truncate">
                            {folderScan.phase === "scanning" && `Scanning “${folderScan.root}”…`}
                            {folderScan.phase === "finalizing" && `Finalizing “${folderScan.root}”…`}
                            {folderScan.phase === "cancelling" && `Cancelling…`}
                            {folderScan.phase === "error" && `Failed to scan “${folderScan.root}”`}
                          </div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            {folderScan.count.toLocaleString()} file{folderScan.count === 1 ? "" : "s"} · {formatSize(folderScan.bytes)} read
                          </div>
                        </div>
                        {folderScan.phase === "scanning" && (
                          <button
                            onClick={() => { scanCancelRef.current = true; }}
                            className="h-7 px-2 rounded-md text-[11px] border border-border bg-surface-1 hover:bg-surface-2 hover:text-foreground text-muted-foreground inline-flex items-center gap-1 shrink-0"
                            aria-label="Cancel folder scan"
                          >
                            <Ban className="h-3 w-3" />
                            Cancel
                          </button>
                        )}
                        {folderScan.phase === "error" && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={retryFolderScan}
                              className="h-7 px-2 rounded-md text-[11px] border border-violet/40 bg-violet/10 hover:bg-violet/20 text-violet inline-flex items-center gap-1"
                              aria-label="Retry folder scan"
                            >
                              <Loader2 className="h-3 w-3" />
                              Retry
                            </button>
                            <button
                              onClick={dismissFolderScan}
                              className="h-7 w-7 grid place-items-center rounded-md border border-border bg-surface-1 hover:bg-surface-2 text-muted-foreground hover:text-foreground"
                              aria-label="Dismiss scan error"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet via-magenta to-cyan transition-all duration-200"
                          style={{
                            width: `${Math.min(95, (folderScan.count / MAX_FOLDER_FILES) * 100 + 5)}%`,
                          }}
                        />
                      </div>
                      {folderScan.current && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <span className="truncate flex-1">{folderScan.current}</span>
                          <span className="tabular-nums shrink-0">{formatSize(folderScan.bytes)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 text-[11px] tabular-nums pt-0.5">
                        <span className="text-muted-foreground">
                          Now <span className="text-foreground">{formatRate(folderScan.curBps)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Avg <span className="text-foreground">{formatRate(folderScan.avgBps)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          ETA{" "}
                          <span className="text-foreground">
                            {folderScan.totalBytes != null
                              ? formatEta(folderScan.etaSec)
                              : "estimating…"}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {folder && (
                    <div className="rounded-xl border border-border bg-surface-1 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5 text-violet shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium truncate">{folder.name}/</div>
                          <div className="text-[11px] text-muted-foreground">
                            {folder.entries.length.toLocaleString()} file{folder.entries.length === 1 ? "" : "s"}
                            {" · "}
                            {formatSize(folder.entries.reduce((n, e) => n + e.file.size, 0))}
                          </div>
                        </div>
                        <button
                          onClick={() => setFolder(null)}
                          className="h-6 w-6 grid place-items-center rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground"
                          aria-label="Clear folder"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <ul className="max-h-32 overflow-y-auto space-y-0.5 text-[11px] text-muted-foreground font-mono">
                        {folder.entries.slice(0, 8).map((e, i) => (
                          <li key={i} className="truncate">{e.path}</li>
                        ))}
                        {folder.entries.length > 8 && (
                          <li className="text-muted-foreground/60 italic">
                            … +{folder.entries.length - 8} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <LuminaButton size="md" onClick={submitFolder} disabled={!folder || folder.entries.length === 0}>
                      <FolderOpen className="h-3.5 w-3.5" />
                      Import folder
                    </LuminaButton>
                  </div>
                </div>
              )}

              {tab === "templates" && (
                <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
                  {mockTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setImportOpen(false); setView("templates"); }}
                      className="text-left p-3 rounded-xl glass hover:bg-surface-1 transition"
                    >
                      <div className="text-[12px] font-medium">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressPanel({
  progress, onRetry, onCancel, onClose,
}: { progress: Progress; onRetry: () => void; onCancel: () => void; onClose: () => void }) {
  const { status, pct, message, label, error, stage } = progress;
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-9 w-9 rounded-lg grid place-items-center shrink-0",
          status === "success" && "bg-cyan/15 text-cyan",
          status === "error" && "bg-rose/15 text-rose-400",
          status === "running" && "bg-violet/15 text-violet",
        )}>
          {status === "success" ? <CheckCircle2 className="h-4 w-4" />
            : status === "error" ? <AlertCircle className="h-4 w-4" />
            : <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-[14px] truncate">{message}</div>
          <div className="text-[12px] text-muted-foreground truncate mt-0.5">{label}</div>
        </div>
        <div className="text-[11px] tabular-nums text-muted-foreground">{Math.round(pct)}%</div>
      </div>

      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            status === "error"
              ? "bg-gradient-to-r from-rose-500 to-magenta"
              : status === "success"
              ? "bg-gradient-to-r from-cyan to-violet"
              : "bg-gradient-to-r from-violet via-magenta to-cyan",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="space-y-2">
        {STAGES.map((s, i) => {
          const done = status === "success" || (status === "running" && i < stageIndex) || (status === "error" && i < stageIndex);
          const active = status === "running" && i === stageIndex;
          const failed = status === "error" && i === stageIndex;
          return (
            <li key={s.key} className="flex items-center gap-2.5 text-[12px]">
              <span className={cn(
                "h-4 w-4 rounded-full grid place-items-center border",
                done && "bg-cyan/15 border-cyan/40 text-cyan",
                active && "bg-violet/15 border-violet/40 text-violet",
                failed && "bg-rose/15 border-rose-500/40 text-rose-400",
                !done && !active && !failed && "bg-surface-1 border-border text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-2.5 w-2.5" />
                  : failed ? <X className="h-2.5 w-2.5" />
                  : active ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  : <span className="h-1 w-1 rounded-full bg-current" />}
              </span>
              <span className={cn(
                done && "text-foreground",
                active && "text-foreground",
                failed && "text-rose-400",
                !done && !active && !failed && "text-muted-foreground",
              )}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {status === "error" && error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-[12px] text-rose-300">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {status === "running" && (
          <LuminaButton variant="ghost" size="md" onClick={onCancel}>Cancel</LuminaButton>
        )}
        {status === "error" && (
          <>
            <LuminaButton variant="ghost" size="md" onClick={onCancel}>Back</LuminaButton>
            <LuminaButton size="md" onClick={onRetry}>Try again</LuminaButton>
          </>
        )}
        {status === "success" && (
          <LuminaButton size="md" onClick={onClose}>Open imports</LuminaButton>
        )}
      </div>
    </div>
  );
}

function FilesProgressPanel({
  items, busy, elapsedMs, onRetry, onCancelFile, onRemoveFile, onCancel, onClose,
}: {
  items: FileProgress[];
  busy: boolean;
  elapsedMs: number | null;
  onRetry: (id: string) => void;
  onCancelFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const total = items.length;
  const done = items.filter((f) => f.status === "success").length;
  const failed = items.filter((f) => f.status === "error").length;
  const cancelled = items.filter((f) => f.status === "cancelled").length;
  const overall = Math.round(items.reduce((sum, f) => sum + f.pct, 0) / Math.max(1, total));
  const isComplete = !busy && elapsedMs != null;
  const allFailed = isComplete && done === 0 && (failed + cancelled) > 0;
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s - m * 60);
    return `${m}m ${rem}s`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-semibold text-[14px]">
            {isComplete ? `Imported ${total} file${total > 1 ? "s" : ""}` : `Uploading ${total} file${total > 1 ? "s" : ""}`}
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {done} done{failed > 0 ? ` · ${failed} failed` : ""}{cancelled > 0 ? ` · ${cancelled} cancelled` : ""} · {overall}%
          </div>
        </div>
        {failed > 0 && !busy && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border border-rose-500/30 bg-rose-500/10 text-rose-300">
            <AlertCircle className="h-3 w-3" />
            {failed} failed
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet via-magenta to-cyan transition-all duration-500"
          style={{ width: `${overall}%` }}
        />
      </div>

      {isComplete && (
        <div className={cn(
          "rounded-xl border p-4 anim-in",
          allFailed
            ? "border-rose-500/30 bg-rose-500/5"
            : failed + cancelled > 0
            ? "border-gold/30 bg-gold/5"
            : "border-cyan/30 bg-cyan/5",
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg grid place-items-center shrink-0",
              allFailed ? "bg-rose-500/15 text-rose-400"
                : failed + cancelled > 0 ? "bg-gold/15 text-gold"
                : "bg-cyan/15 text-cyan",
            )}>
              {allFailed ? <AlertCircle className="h-4 w-4" />
                : failed + cancelled > 0 ? <CheckCircle2 className="h-4 w-4" />
                : <Sparkles className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-semibold text-[13px]">
                {allFailed ? "Import finished with errors"
                  : failed + cancelled > 0 ? "Import finished with issues"
                  : "Import complete"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Processed {total} file{total > 1 ? "s" : ""} in {formatDuration(elapsedMs!)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <SummaryStat label="Succeeded" value={done} tone="cyan" Icon={CheckCircle2} />
            <SummaryStat label="Failed" value={failed} tone="rose" Icon={AlertCircle} />
            <SummaryStat label="Cancelled" value={cancelled} tone="muted" Icon={Ban} />
            <SummaryStat label="Time" value={formatDuration(elapsedMs!)} tone="violet" Icon={Timer} />
          </div>
        </div>
      )}

      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {items.map((f) => (
          <li key={f.id} className="rounded-lg border border-border bg-surface-1 p-3">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "h-7 w-7 rounded-md grid place-items-center shrink-0",
                f.status === "success" && "bg-cyan/15 text-cyan",
                f.status === "error" && "bg-rose/15 text-rose-400",
                f.status === "cancelled" && "bg-surface-2 text-muted-foreground",
                (f.status === "uploading" || f.status === "processing") && "bg-violet/15 text-violet",
                f.status === "queued" && "bg-surface-2 text-muted-foreground",
              )}>
                {f.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : f.status === "error" ? <AlertCircle className="h-3.5 w-3.5" />
                  : f.status === "cancelled" ? <Ban className="h-3.5 w-3.5" />
                  : f.status === "queued" ? <FileArchive className="h-3.5 w-3.5" />
                  : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{f.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {formatSize(f.size)} ·{" "}
                  {f.status === "queued" && "Queued"}
                  {f.status === "uploading" && "Uploading…"}
                  {f.status === "processing" && "Processing…"}
                  {f.status === "success" && "Done"}
                  {f.status === "error" && (f.error || "Failed")}
                  {f.status === "cancelled" && "Cancelled"}
                </div>
              </div>
              <div className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">
                {f.pct}%
              </div>
              <div className="flex items-center gap-1">
                {(f.status === "error" || f.status === "cancelled") && (
                  <button
                    onClick={() => onRetry(f.id)}
                    className="text-[11px] px-2 h-7 rounded-md border border-border hover:border-white/20 hover:bg-surface-2 transition"
                  >
                    Retry
                  </button>
                )}
                {(f.status === "queued" || f.status === "uploading" || f.status === "processing") && (
                  <button
                    onClick={() => onCancelFile(f.id)}
                    aria-label={`Cancel ${f.name}`}
                    className="h-7 w-7 grid place-items-center rounded-md border border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/40 transition"
                  >
                    <Ban className="h-3 w-3" />
                  </button>
                )}
                {(f.status === "success" || f.status === "error" || f.status === "cancelled") && (
                  <button
                    onClick={() => onRemoveFile(f.id)}
                    aria-label={`Remove ${f.name}`}
                    className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  f.status === "error" ? "bg-rose-500"
                    : f.status === "cancelled" ? "bg-muted-foreground/40"
                    : f.status === "success" ? "bg-cyan"
                    : "bg-gradient-to-r from-violet to-magenta",
                )}
                style={{ width: `${f.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-2">
        {busy ? (
          <LuminaButton variant="ghost" size="md" onClick={onCancel}>Cancel</LuminaButton>
        ) : (
          <>
            <LuminaButton variant="ghost" size="md" onClick={onCancel}>Back</LuminaButton>
            <LuminaButton size="md" onClick={onClose}>
              {done > 0 ? "Open imports" : "Close"}
            </LuminaButton>
          </>
        )}
      </div>
    </div>
  );
}

function Detected({ label, value, Icon }: { label: string; value: string; Icon: any }) {
  return (
    <div className="rounded-lg bg-surface-1 border border-border p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-[12px] font-medium truncate">{value}</div>
    </div>
  );
}

function SummaryStat({ label, value, tone, Icon }: { label: string; value: number | string; tone: "cyan" | "rose" | "muted" | "violet"; Icon: any }) {
  const toneClass = {
    cyan: "text-cyan",
    rose: "text-rose-400",
    muted: "text-muted-foreground",
    violet: "text-violet",
  }[tone];
  return (
    <div className="rounded-lg bg-surface-1/60 border border-border/60 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        <Icon className={cn("h-3 w-3", toneClass)} /> {label}
      </div>
      <div className={cn("text-[15px] font-display font-semibold tabular-nums mt-0.5", toneClass)}>{value}</div>
    </div>
  );
}
