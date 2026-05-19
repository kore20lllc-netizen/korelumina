import {
  LayoutGrid, Sparkles, Palette, Code2, FolderGit2, Settings, X,
  Layers, FileCode2, Wand2, Image as ImageIcon, MessageSquare, Plus, Box, Home,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

interface NavItemDef { icon: any; label: string; active?: boolean; badge?: string }

export function Sidebar() {
  const { mode, view, setView, sidebarOpen, setSidebarOpen, activeProject, setImportOpen } = useWorkspace();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const items: NavItemDef[] =
    view !== "workspace"
      ? [
          { icon: LayoutGrid, label: "Projects", active: view === "dashboard" },
          { icon: Sparkles, label: "New Build", active: view === "entry" },
          { icon: FolderGit2, label: "Imports", active: view === "imports" },
          { icon: Box, label: "Templates" },
          { icon: Settings, label: "Settings" },
        ]
      : mode === "ai"
      ? [
          { icon: Wand2, label: "Prompt", active: true },
          { icon: MessageSquare, label: "History", badge: "12" },
          { icon: ImageIcon, label: "Assets" },
          { icon: Box, label: "Templates" },
          { icon: Settings, label: "Settings" },
        ]
      : mode === "designer"
      ? [
          { icon: Layers, label: "Layers", active: true },
          { icon: Palette, label: "Styles" },
          { icon: Box, label: "Components" },
          { icon: ImageIcon, label: "Assets" },
          { icon: Settings, label: "Settings" },
        ]
      : [
          { icon: FileCode2, label: "Files", active: true },
          { icon: Code2, label: "Search" },
          { icon: FolderGit2, label: "Source" },
          { icon: Wand2, label: "AI Assist" },
          { icon: Settings, label: "Settings" },
        ];

  // Keep focusIndex within bounds when items change (mode/view switch)
  useEffect(() => {
    setFocusIndex((i) => Math.min(i, items.length - 1));
  }, [items.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === "ArrowDown") next = (index + 1) % items.length;
    else if (e.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    setFocusIndex(next);
    itemRefs.current[next]?.focus();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-[64px] md:w-[64px] flex flex-col items-center gap-1 py-3 px-2",
          "glass border-r border-border transition-transform duration-300 ease-fluid",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden self-end h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        <button
          onClick={() => setView("landing")}
          className="group relative h-10 w-10 rounded-xl grid place-items-center transition-all duration-300 ease-fluid text-muted-foreground hover:text-foreground hover:bg-surface-2"
          aria-label="Home"
        >
          <Home className="h-[17px] w-[17px]" strokeWidth={1.75} />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg glass-strong text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition translate-x-1 group-hover:translate-x-0 z-50">
            Home
          </span>
        </button>

        <button
          onClick={() => setView("entry")}
          className="group relative h-10 w-10 rounded-xl bg-button-lumina grid place-items-center shadow-[0_4px_16px_-4px_hsl(255_90%_65%/0.6),inset_0_1px_0_hsl(220_20%_100%/0.18)] hover:brightness-110 transition-all mb-1"
          aria-label="New project"
        >
          <Plus className="h-4 w-4 text-white" />
        </button>

        <div className="w-8 h-px bg-border my-1" />

        <nav
          className="flex flex-col gap-1 w-full items-center"
          role="toolbar"
          aria-orientation="vertical"
          aria-label="Sidebar navigation"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                title={item.label}
                ref={(el) => (itemRefs.current[index] = el)}
                tabIndex={focusIndex === index ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => {
                  if (item.label === "Projects") {
                    setView("dashboard");
                  } else if (item.label === "New Build") {
                    setView("entry");
                  } else if (item.label === "Templates") {
                    setView("templates");
                  } else if (item.label === "Settings") {
                    setView("settings");
                  } else if (item.label === "Imports") {
                    setView("imports");
                  } else {
                    toast(item.label, { description: "Panel coming soon" });
                  }
                  setActiveLabel(item.label);
                  setFocusIndex(index);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "group relative h-10 w-10 rounded-xl grid place-items-center transition-all duration-300 ease-fluid active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  (activeLabel ? activeLabel === item.label : item.active)
                    ? "bg-surface-2 text-foreground ring-1 ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                )}
              >
                {(activeLabel ? activeLabel === item.label : item.active) && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-brand" />
                )}
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-semibold grid place-items-center bg-brand text-white">
                    {item.badge}
                  </span>
                )}
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg glass-strong text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition translate-x-1 group-hover:translate-x-0 z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {activeProject && (
          <div
            className="h-9 w-9 rounded-lg grid place-items-center text-xs font-semibold text-white"
            style={{ background: "var(--gradient-button)" }}
            title={activeProject.name}
          >
            {activeProject.name.charAt(0)}
          </div>
        )}
      </aside>
    </>
  );
}
