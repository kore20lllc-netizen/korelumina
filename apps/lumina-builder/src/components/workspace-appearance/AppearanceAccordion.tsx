import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  expanded?: boolean;
  children?: ReactNode;
}

export function AppearanceAccordion({
  title,
  expanded = false,
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 px-4 py-3">
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}

        <span className="font-medium">
          {title}
        </span>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-white/10 p-4">
          {children}
        </div>
      )}
    </section>
  );
}
