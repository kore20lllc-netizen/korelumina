import { useEffect } from "react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutGrid, Sparkles, Wand2, Palette, Code2, Rocket, Plus, Search, Settings, Terminal, MessageSquare, Download, LayoutTemplate, CreditCard, LogIn, FolderGit2, Globe, Activity, FileCode,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useTransform } from "@/context/TransformContext";
import { toast } from "sonner";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { track } from "@/lib/analytics";
import { openTransformAnalytics } from "@/components/transform/TransformAnalyticsMount";

export function CommandPalette() {
  const {
    commandOpen, setCommandOpen,
    setView, setMode, setPublishOpen, setBottomDockOpen, bottomDockOpen,
    setImportOpen, setDeployOpen,
    projects, setActiveProject,
  } = useWorkspace();
  const { openTransform } = useTransform();
  const transformEnabled = isFeatureEnabled("transform_to_website");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setBottomDockOpen(!bottomDockOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, bottomDockOpen, setCommandOpen, setBottomDockOpen]);

  const run = (fn: () => void) => { setCommandOpen(false); fn(); };
  const recentProjects = projects.slice(0, 6);

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search commands, files, projects…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run(() => setView("dashboard"))}>
            <LayoutGrid className="mr-2 h-4 w-4" /> Go to Projects
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("entry"))}>
            <Plus className="mr-2 h-4 w-4" /> New Build
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("workspace"))}>
            <Sparkles className="mr-2 h-4 w-4" /> Open Studio
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("templates"))}>
            <LayoutTemplate className="mr-2 h-4 w-4" /> Browse Templates
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("imports"))}>
            <FolderGit2 className="mr-2 h-4 w-4" /> Go to Imports
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("settings"))}>
            <Settings className="mr-2 h-4 w-4" /> Open Settings
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("pricing"))}>
            <CreditCard className="mr-2 h-4 w-4" /> Pricing & Usage
          </CommandItem>
          <CommandItem onSelect={() => run(() => setView("auth"))}>
            <LogIn className="mr-2 h-4 w-4" /> Sign in / Sign up
          </CommandItem>
        </CommandGroup>
        {recentProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jump to project">
              {recentProjects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.name} ${p.type}`}
                  onSelect={() => run(() => { setActiveProject(p); setView("workspace"); })}
                >
                  <FileCode className="mr-2 h-4 w-4" /> {p.name}
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">{p.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Switch mode">
          <CommandItem onSelect={() => run(() => { setMode("ai"); toast.success("Switched to AI mode"); })}>
            <Wand2 className="mr-2 h-4 w-4" /> AI mode
          </CommandItem>
          <CommandItem onSelect={() => run(() => { setMode("designer"); toast.success("Switched to Designer mode"); })}>
            <Palette className="mr-2 h-4 w-4" /> Designer mode
          </CommandItem>
          <CommandItem onSelect={() => run(() => { setMode("developer"); toast.success("Switched to Dev mode"); })}>
            <Code2 className="mr-2 h-4 w-4" /> Developer mode
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setImportOpen(true))}>
            <Download className="mr-2 h-4 w-4" /> Import Project
          </CommandItem>
          {transformEnabled && (
            <CommandItem onSelect={() => run(() => {
              track("transform.opened", { source: "command" });
              openTransform({ source: "command" });
            })}>
              <Globe className="mr-2 h-4 w-4 text-gold" /> Transform App → Website
            </CommandItem>
          )}
          {transformEnabled && (
            <CommandItem onSelect={() => run(() => openTransformAnalytics())}>
              <Activity className="mr-2 h-4 w-4 text-gold" /> Transform Funnel · Analytics
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(() => setDeployOpen(true))}>
            <Rocket className="mr-2 h-4 w-4" /> Deploy Project
          </CommandItem>
          <CommandItem onSelect={() => run(() => setPublishOpen(true))}>
            <Rocket className="mr-2 h-4 w-4" /> Publish project
          </CommandItem>
          <CommandItem onSelect={() => run(() => setBottomDockOpen(true))}>
            <Terminal className="mr-2 h-4 w-4" /> Toggle console (⌘J)
          </CommandItem>
          <CommandItem onSelect={() => run(() => toast("AI assistant opened"))}>
            <MessageSquare className="mr-2 h-4 w-4" /> Ask AI assistant
          </CommandItem>
          <CommandItem onSelect={() => run(() => toast("Search coming online…"))}>
            <Search className="mr-2 h-4 w-4" /> Search project
          </CommandItem>
          <CommandItem onSelect={() => run(() => toast("Settings"))}>
            <Settings className="mr-2 h-4 w-4" /> Open settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}