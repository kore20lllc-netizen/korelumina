import { useRef, useState } from "react";
import { Github, Upload, FolderGit2, FileArchive, Link2, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import type { RepoSource, AuditMode } from "@/services/repoAuditService";

interface Props {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  loading?: boolean;
  loadingMode?: AuditMode | null;
  onRun: (source: RepoSource, mode: AuditMode) => void;
}

type Tab = "project" | "github" | "zip";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "project", label: "Existing project", icon: FolderGit2 },
  { id: "github", label: "GitHub URL", icon: Github },
  { id: "zip", label: "Upload .zip", icon: Upload },
];

const GITHUB_RE = /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/i;

export function RepoSourcePicker({ projects, defaultProjectId, loading, loadingMode, onRun }: Props) {
  const [tab, setTab] = useState<Tab>("project");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validUrl = GITHUB_RE.test(url.trim());

  const submit = (mode: AuditMode) => {
    setError(null);
    if (tab === "project") {
      if (!projectId) return setError("Select a project to audit.");
      onRun({ kind: "project", projectId }, mode);
    } else if (tab === "github") {
      if (!validUrl) return setError("Enter a valid GitHub URL (https://github.com/owner/repo).");
      onRun({ kind: "github", url: url.trim(), branch: branch.trim() || "main" }, mode);
    } else {
      if (!file) return setError("Choose a .zip archive of your repository.");
      onRun({ kind: "zip", fileName: file.name, sizeBytes: file.size }, mode);
    }
  };

  const ActionButtons = ({ disabled }: { disabled?: boolean }) => (
    <div className="inline-flex items-center gap-2">
      <LuminaButton
        variant="ghost"
        onClick={() => submit("scan")}
        disabled={loading || disabled}
        title="Quick structural audit. Checks dependencies, environment variables, and project configuration."
      >
        {loadingMode === "scan" ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…</>
        ) : (
          <><Zap className="h-3.5 w-3.5" /> Fast Scan</>
        )}
      </LuminaButton>
      <LuminaButton
        onClick={() => submit("deep")}
        disabled={loading || disabled}
        className="bg-gradient-to-r from-gold to-amber-400 text-black hover:brightness-110 shadow-[0_4px_24px_-6px_hsl(45_90%_60%/0.55)]"
        title="Runs a full production build and analyzes real TypeScript and build errors. May take several minutes."
      >
        {loadingMode === "deep" ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deep auditing…</>
        ) : (
          <><ShieldCheck className="h-3.5 w-3.5" /> Deep Audit</>
        )}
      </LuminaButton>
    </div>
  );

  const onPickFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!/\.zip$/i.test(f.name)) {
      setError("Only .zip archives are supported.");
      return;
    }
    setError(null);
    setFile(f);
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">Audit Source</div>
          <div className="font-display font-semibold text-[15px] mt-0.5">Connect a repository to audit</div>
        </div>
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface-1 border border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] transition",
                  tab === t.id ? "bg-surface-2 text-foreground ring-1 ring-white/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile tab strip */}
      <div className="flex sm:hidden items-center gap-1 p-1 mb-3 rounded-lg bg-surface-1 border border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 h-7 px-2 rounded-md text-[11px] transition",
              tab === t.id ? "bg-surface-2 text-foreground" : "text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "project" && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Project"
            className="h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none hover:border-white/15 transition flex-1"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ActionButtons />
        </div>
      )}

      {tab === "github" && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2 flex-1 h-10 px-3 rounded-lg bg-surface-1 border border-border focus-within:border-white/15">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-muted-foreground/60"
            />
          </div>
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="branch"
            aria-label="Branch"
            className="h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none w-full sm:w-32"
          />
          <ActionButtons disabled={!validUrl} />
        </div>
      )}

      {tab === "zip" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onPickFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "rounded-xl border border-dashed p-5 transition",
            dragOver ? "border-violet/60 bg-violet/5" : "border-white/15 bg-surface-1/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-surface-2 grid place-items-center">
              <FileArchive className="h-4 w-4 text-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              {file ? (
                <>
                  <div className="font-medium text-[13px] truncate">{file.name}</div>
                  <div className="text-[11px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-[13px]">Drop a .zip archive here</div>
                  <div className="text-[11px] text-muted-foreground">or click to choose a file from your computer</div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LuminaButton variant="ghost" size="md" onClick={() => inputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> {file ? "Change" : "Browse"}
              </LuminaButton>
              <ActionButtons disabled={!file} />
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-3 text-[12px] text-rose-300">{error}</div>}
    </div>
  );
}