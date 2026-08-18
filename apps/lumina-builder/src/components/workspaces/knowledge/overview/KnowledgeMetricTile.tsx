import type {
  LucideIcon,
} from "lucide-react";

import {
  LuminaMetricCard,
} from "@/components/lumina/workspace";

export interface KnowledgeMetricTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?:
    | "violet"
    | "magenta"
    | "cyan"
    | "gold";
  className?: string;
}

export function KnowledgeMetricTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: KnowledgeMetricTileProps) {
  return (
    <LuminaMetricCard
      className={className}
      label={label}
      value={value}
      icon={
        Icon ? (
          <Icon
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.75}
          />
        ) : null
      }
      footer={hint}
    />
  );
}

export default KnowledgeMetricTile;
