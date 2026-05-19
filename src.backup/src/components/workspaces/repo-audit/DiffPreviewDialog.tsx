import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, FileCode2, Loader2 } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import type { DiffPreview } from "@/services/repoAuditService";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: DiffPreview | null;
  loading?: boolean;
  applying?: boolean;
  onApply?: () => void;
}

export function DiffPreviewDialog({ open, onOpenChange, diff, loading, applying, onApply }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-gold/20 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-gold" /> Diff Preview
          </DialogTitle>
          <DialogDescription className="font-mono text-[12px]">
            {diff?.file ?? "—"}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-[#0a0a12] p-4 overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-[13px]"><Loader2 className="h-4 w-4 animate-spin" /> Loading diff…</div>
          ) : diff ? (
            <pre className="font-mono text-[12px] leading-relaxed whitespace-pre">
              {diff.patch.split("\n").map((line, i) => (
                <div key={i} className={cn(
                  line.startsWith("+") && !line.startsWith("+++") && "text-emerald-300",
                  line.startsWith("-") && !line.startsWith("---") && "text-rose-300",
                  line.startsWith("@@") && "text-violet",
                  (line.startsWith("+++") || line.startsWith("---")) && "text-muted-foreground",
                )}>{line || " "}</div>
              ))}
            </pre>
          ) : (
            <div className="text-muted-foreground text-[13px]">No diff available.</div>
          )}
        </div>
        {onApply && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="h-9 px-4 rounded-lg text-[12px] text-muted-foreground hover:text-foreground">
              Close
            </button>
            <LuminaButton size="md" onClick={onApply} disabled={applying || loading || !diff}>
              {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {applying ? "Applying…" : "Apply This Fix"}
            </LuminaButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}