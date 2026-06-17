import { Check, ChevronDown, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useActiveTeam } from "@/context/ActiveTeamContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CreateWorkspaceDialog } from "@/components/layout/dialogs/CreateWorkspaceDialog";

export function TeamSwitcher() {
  const { teams, activeTeam, setActiveTeam, createTeam } = useActiveTeam();
  const [creating, setCreating] = useState(false);

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [workspaceName, setWorkspaceName] =
    useState("");

  if (!activeTeam) return null;

  const handleCreate = () => {
    if (creating) return;

    setWorkspaceName("");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!workspaceName.trim()) {
      return;
    }

    setCreating(true);

    try {
      createTeam(
        workspaceName.trim(),
      );

      setDialogOpen(false);
      setWorkspaceName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-surface-1 border border-border hover:border-white/15 transition text-[12px]"
          aria-label="Switch workspace"
          title="Switch workspace"
        >
          <Users className="h-3 w-3 text-muted-foreground/70" />
          <span className="font-medium max-w-[140px] truncate">{activeTeam.name}</span>
          <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-surface-2 text-muted-foreground/80">
            {activeTeam.plan}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {teams.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => setActiveTeam(t.id)}
            className="flex items-center gap-2"
          >
            <div className="h-6 w-6 rounded-md bg-surface-2 grid place-items-center text-[10px] font-semibold">
              {t.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-[13px]">{t.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {t.personal ? "Personal" : "Team"} · {t.plan}
              </div>
            </div>
            <Check
              className={cn(
                "h-3.5 w-3.5",
                activeTeam.id === t.id ? "opacity-100 text-brand" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleCreate} className="text-[13px]">
          <Plus className="h-3.5 w-3.5 mr-2" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CreateWorkspaceDialog
        open={dialogOpen}
        value={workspaceName}
        onValueChange={setWorkspaceName}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </DropdownMenu>
  );
}
