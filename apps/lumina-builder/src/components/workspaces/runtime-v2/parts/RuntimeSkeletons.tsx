import { Skeleton } from "@/components/ui/skeleton";
import { GlowCard } from "@/components/lumina/GlowCard";
import { cn } from "@/lib/utils";

export function TileSkeleton({ className }: { className?: string }) {
  return (
    <GlowCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full mt-3" />
    </GlowCard>
  );
}

export function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/8 bg-surface-1/60 p-3 flex items-center gap-3", className)}>
      <Skeleton className="h-2 w-2 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="py-2.5 px-3 flex items-start gap-3">
          <Skeleton className="h-3.5 w-3.5 rounded-full mt-0.5" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-2.5 w-6" />
        </div>
      ))}
    </div>
  );
}

export function InspectorSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}