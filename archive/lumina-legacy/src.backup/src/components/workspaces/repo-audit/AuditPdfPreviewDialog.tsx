import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, X, RefreshCw } from "lucide-react";
import { AUDIT_PDF_THEMES, type AuditPdfPreview } from "@/services/repoAuditPdfService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: AuditPdfPreview | null;
  loading: boolean;
  onConfirmDownload: () => void;
  onRetryLogo?: () => void;
  retryingLogo?: boolean;
}

export function AuditPdfPreviewDialog({ open, onOpenChange, preview, loading, onConfirmDownload, onRetryLogo, retryingLogo }: Props) {
  // Revoke the blob URL when the dialog closes or the preview is replaced.
  useEffect(() => {
    return () => {
      if (preview?.blobUrl) {
        URL.revokeObjectURL(preview.blobUrl);
      }
    };
  }, [preview?.blobUrl]);

  const themeLabel = preview ? AUDIT_PDF_THEMES[preview.themeId]?.label ?? preview.themeId : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle>Preview PDF report</DialogTitle>
          <DialogDescription>
            {preview
              ? <>Theme <span className="text-foreground font-medium">{themeLabel}</span> · {preview.pageCount} page{preview.pageCount === 1 ? "" : "s"} · {preview.fileName}</>
              : "Rendering preview…"}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-surface-1 h-[70vh] w-full">
          {loading || !preview ? (
            <div className="h-full grid place-items-center text-[12px] text-muted-foreground">
              Generating preview…
            </div>
          ) : (
            <iframe
              key={preview.blobUrl}
              src={preview.blobUrl}
              title="PDF preview"
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border">
          {preview && preview.logoRequested && !preview.logoLoaded && (
            <div className="mr-auto flex items-center gap-2">
              <span className="text-[11px] text-amber-300/90">
                Logo unavailable · rendered in text-only mode
              </span>
              {onRetryLogo && (
                <button
                  onClick={onRetryLogo}
                  disabled={retryingLogo}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded border border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-200 hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <RefreshCw className={`h-3 w-3 ${retryingLogo ? "animate-spin" : ""}`} />
                  {retryingLogo ? "Retrying…" : "Retry logo"}
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface-1 text-[12px] text-foreground hover:bg-surface-2 transition"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button
            onClick={onConfirmDownload}
            disabled={!preview}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-violet-500/90 text-white text-[12px] hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}