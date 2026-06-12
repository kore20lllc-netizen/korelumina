import { useEffect } from "react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutGrid, Sparkles, Wand2, Palette, Code2, Rocket, Plus, Search, Settings, Terminal, MessageSquare,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { toast } from "sonner";

export function CommandPalette() {
  const {
    commandOpen, setCommandOpen,
    setView, setMode, setPublishOpen, setBottomDockOpen, bottomDockOpen,
  } = useWorkspace();

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
        </CommandGroup>
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