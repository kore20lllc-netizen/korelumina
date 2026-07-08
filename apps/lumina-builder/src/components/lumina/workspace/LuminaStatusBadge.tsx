import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LuminaStatus =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface LuminaStatusBadgeProps {
  status?: LuminaStatus;
  children: ReactNode;
  className?: string;
}

const STATUS_CLASS: Record<LuminaStatus, string> = {
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  info: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  neutral: "border-white/10 bg-white/5 text-muted-foreground",
};

export function LuminaStatusBadge({
  status = "neutral",
  children,
  className,
}: LuminaStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-medium tracking-wide",
        STATUS_CLASS[status],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export default LuminaStatusBadge;
