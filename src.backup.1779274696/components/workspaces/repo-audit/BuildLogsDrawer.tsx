import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Copy, Download, Loader2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBuildLogs, type BuildLogLine } from "@/services/repoAuditService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function BuildLogsDrawer({ open, onOpenChange, projectId }: Props) {
  const [logs, setLogs] = useState<BuildLogLine[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getBuildLogs(projectId)
      .then((l) => { if (active) setLogs(l); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, projectId]);

  const asText = () =>
    (logs ?? []).map((l) => `[${l.ts}] ${l.level.toUpperCase().padEnd(5)} ${l.text}`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      toast.success("Build logs copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    const blob = new Blob([asText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectId.replace(/[^a-z0-9_-]/gi, "_")}-build-logs.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Build logs downloaded");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="glass border-l border-white/10 w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-white/10">
          <SheetTitle className="font-display flex items-center gap-2">
            <Terminal className="h-4 w-4 text-gold" /> Build Logs
          </SheetTitle>
          <SheetDescription className="text-[12px]">{projectId}</SheetDescription>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={copy} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-surface-1 text-[12px] hover:bg-surface-2">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={download} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-surface-1 text-[12px] hover:bg-surface-2">
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed bg-[#0a0a12]">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading logs…</div>
          ) : logs && logs.length > 0 ? (
            <ol className="space-y-0.5">
              {logs.map((l, i) => (
                <li key={i} className={cn(
                  "whitespace-pre-wrap break-words",
                  l.level === "error" && "text-rose-300",
                  l.level === "warn" && "text-amber-300",
                  l.level === "info" && "text-muted-foreground",
                  l.level === "debug" && "text-muted-foreground/60",
                )}>
                  <span className="text-muted-foreground/40">{new Date(l.ts).toLocaleTimeString()} </span>
                  <span className="uppercase opacity-70">[{l.level}]</span>{" "}
                  {l.text}
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-muted-foreground">No logs available.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}