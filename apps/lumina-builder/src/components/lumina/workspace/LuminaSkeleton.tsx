import { cn } from "@/lib/utils";

export interface LuminaSkeletonProps {
  className?: string;
}

export function LuminaSkeleton({
  className,
}: LuminaSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-white/[0.06]",
        className,
      )}
    />
  );
}

export function LuminaSkeletonCard() {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 p-5">
      <LuminaSkeleton className="h-4 w-32" />
      <LuminaSkeleton className="h-10 w-48" />
      <LuminaSkeleton className="h-3 w-full" />
      <LuminaSkeleton className="h-3 w-3/4" />
    </div>
  );
}

export function LuminaSkeletonMetric() {
  return (
    <div className="rounded-3xl border border-white/10 p-5">
      <LuminaSkeleton className="h-3 w-24" />
      <LuminaSkeleton className="mt-5 h-10 w-28" />
    </div>
  );
}

export default LuminaSkeleton;
