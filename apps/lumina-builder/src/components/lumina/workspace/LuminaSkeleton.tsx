import { cn } from "@/lib/utils";

export interface LuminaSkeletonProps {
  className?: string;
}

function SkeletonLine({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl",
        "[background:var(--lumina-surface-interactive)]",
        className,
      )}
    />
  );
}

export function LuminaSkeleton({
  className,
}: LuminaSkeletonProps) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-3xl border p-5",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        className,
      )}
    >
      <SkeletonLine className="h-6 w-1/3" />
      <SkeletonLine className="h-4 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
    </div>
  );
}

export function LuminaSkeletonCard() {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-card)]",
      )}
    >
      <div className="space-y-4">
        <SkeletonLine className="h-5 w-1/2" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default LuminaSkeleton;
