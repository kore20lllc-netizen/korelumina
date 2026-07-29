import { AlertOctagon } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";

export function RuntimeErrorState({
  title = "Runtime is unreachable",
  message = "The runtime service didn't respond. Retry to reconnect.",
  onRetry, className,
}: { title?: string; message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn("h-full min-h-[200px] grid place-items-center p-8", className)}
    >
      <div className="text-center max-w-sm">
        <div className="h-11 w-11 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/25 grid place-items-center text-rose-300">
          <AlertOctagon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="mt-3 font-display text-lg font-semibold">{title}</div>
        <p className="text-[12.5px] text-muted-foreground mt-1">{message}</p>
        {onRetry && (
          <div className="mt-4">
            <LuminaButton variant="glow" onClick={onRetry}>Retry</LuminaButton>
          </div>
        )}
      </div>
    </div>
  );
}