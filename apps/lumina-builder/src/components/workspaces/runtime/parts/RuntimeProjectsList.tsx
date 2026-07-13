import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RuntimeProjectRow } from "./RuntimeProjectRow";
import { RuntimeEmptyState } from "./RuntimeEmptyState";
import type { RuntimeProject } from "@/services/runtime/types";

export interface RuntimeProjectsListProps {
  projects: RuntimeProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  onOpenInspector?: () => void;
}

export function RuntimeProjectsList({ projects, selectedId, onSelect, onOpenInspector, className }: RuntimeProjectsListProps) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndex = Math.max(0, projects.findIndex((p) => p.id === selectedId));

  useEffect(() => {
    // Ensure the selected row is scrolled into view when it changes via keyboard.
    btnRefs.current[focusIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusIndex, selectedId]);

  if (projects.length === 0) {
    return <RuntimeEmptyState variant="projects" className={className} />;
  }

  const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = i;
    if (e.key === "ArrowDown") next = Math.min(projects.length - 1, i + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = projects.length - 1;
    else if (e.key === "Enter") { onOpenInspector?.(); return; }
    else return;
    e.preventDefault();
    onSelect(projects[next].id);
    btnRefs.current[next]?.focus();
  };

  return (
    <ScrollArea className={cn("h-full pr-2", className)}>
      <div
        role="listbox"
        aria-label="Runtime projects"
        aria-activedescendant={selectedId ? `runtime-project-${selectedId}` : undefined}
        className="flex flex-col gap-3 px-1 pb-8 pt-1"
      >
        {projects.map((p, i) => (
          <div key={p.id} id={`runtime-project-${p.id}`} role="option" aria-selected={p.id === selectedId}>
            <RuntimeProjectRow
              ref={(el) => (btnRefs.current[i] = el)}
              project={p}
              selected={p.id === selectedId}
              tabIndex={i === focusIndex ? 0 : -1}
              onSelect={() => onSelect(p.id)}
              onKeyDown={(e) => handleKey(e, i)}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}