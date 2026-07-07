import { Skeleton } from "@/components/ui/skeleton";
import { GlowCard } from "@/components/lumina/GlowCard";

export function KnowledgeOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <GlowCard className="p-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </GlowCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <GlowCard key={index} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
