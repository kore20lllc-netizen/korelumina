import { Sparkles, Search, Menu, ChevronDown, Terminal, Command, Droplet, Download, Rocket, Home } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { useWorkspace, type SkillMode } from "@/context/WorkspaceContext";
import { useGlassTint, type TintIntensity } from "@/context/GlassTintContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationsCenter } from "@/components/notifications/NotificationsCenter";
import { TeamSwitcher } from "./TeamSwitcher";
import luminaLogo from "@/assets/lumina.png";
import { useIsAuthenticated } from "@/hooks/use-auth";
import { toast } from "sonner";

const modes: { id: SkillMode; label: string; hint: string }[] = [
  { id: "ai", label: "AI", hint: "Non-tech" },
  { id: "designer", label: "Designer", hint: "Visual" },
  { id: "developer", label: "Dev", hint: "Code" },
];

const tints: { id: TintIntensity; label: string }[] = [
  { id: "subtle", label: "Subtle" },
  { id: "standard", label: "Standard" },
  { id: "vibrant", label: "Vibrant" },
];

export function TopBar() {
  const {
    mode, setMode, view, setView, activeProject, setSidebarOpen,
    setCommandOpen, setPublishOpen, bottomDockOpen, setBottomDockOpen,
    setImportOpen, setDeployOpen, usage,
  } = useWorkspace();
  const { intensity, setIntensity } = useGlassTint();
  const authed = useIsAuthenticated();
  const guard = (label: string, fn: () => void) => () => {
    if (!authed) {
      toast.error(`Sign in to ${label}.`);
      setView("auth");
      return;
    }
    fn();
  };
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="relative z-30 h-14 flex items-center gap-3 px-4 md:px-6 glass border-b border-border">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-2 transition"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <button onClick={() => setView("dashboard")} className="flex items-center gap-2.5 group">
        <div className="relative h-8 w-8 rounded-xl overflow-hidden grid place-items-center ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
          <img src={luminaLogo} alt="KoreLumina" className="h-full w-full object-cover" />
        </div>
        <div className="hidden sm:block leading-none">
          <div className="font-display font-bold text-[16px] tracking-tight">
            Kore<span className="text-gradient-lumina">Lumina</span>
          </div>
          <div className="text-[9px] mt-0.5 tracking-[0.18em] uppercase">
            <span className="eyebrow-lumina">Studio</span>
          </div>
        </div>
      </button>

      <div className="hidden md:block h-5 w-px bg-border mx-1" />
      <TeamSwitcher />

      {view !== "dashboard" && view !== "landing" && view !== "auth" && (
        <>
          <div className="hidden md:block h-5 w-px bg-border mx-1" />
          <button
            onClick={() => setView("dashboard")}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-1 border border-border hover:bg-surface-2 hover:border-white/15 transition text-[11px] text-muted-foreground hover:text-foreground"
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </>
      )}

      {activeProject && view === "workspace" && (
        <>
          <div className="hidden md:block h-5 w-px bg-border mx-1" />
          <button className="hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-lg hover:bg-surface-1 transition text-[13px]">
            <span className="text-muted-foreground/70">Projects</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium">{activeProject.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground/60 ml-0.5" />
          </button>
        </>
      )}

      <div className="flex-1" />

      {/* Mode switcher */}
      <div className="hidden md:flex items-center p-0.5 rounded-xl bg-surface-1 border border-border">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              if (view !== "workspace") setView("workspace");
            }}
            className={cn(
              "relative px-3 h-7 rounded-lg text-[11px] font-medium tracking-tight transition-all duration-300 ease-fluid",
              mode === m.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === m.id && (
              <span className="absolute inset-0 rounded-lg bg-brand opacity-90 ring-1 ring-white/20 shadow-[inset_0_1px_0_hsl(220_20%_100%/0.18)]" />
            )}
            <span className="relative flex items-center gap-1.5 uppercase tracking-[0.12em]">
              {m.label}
            </span>
          </button>
        ))}
      </div>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden lg:flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-1 border border-border hover:border-white/15 transition text-[11px] text-muted-foreground"
              aria-label={`Open Command Palette (${shortcutLabel})`}
              aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
              <kbd
                className="ml-3 px-1.5 py-0.5 rounded bg-surface-2 text-[9px] tracking-wider flex items-center gap-0.5 border border-border"
                aria-hidden="true"
              >
                <Command className="h-2.5 w-2.5" />K
              </kbd>
              <span className="hidden xl:inline ml-1 text-[10px] text-muted-foreground/70">
                Command Palette
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="font-medium">Command Palette</div>
            <div className="text-muted-foreground mt-0.5">
              Press <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border">⌘K</kbd> on Mac or{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border">Ctrl+K</kbd> on Windows/Linux
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button
        onClick={guard("open the console", () => setBottomDockOpen(!bottomDockOpen))}
        className={cn(
          "hidden md:grid h-8 w-8 place-items-center rounded-lg transition",
          bottomDockOpen ? "bg-surface-3 text-foreground" : "hover:bg-surface-2 text-muted-foreground"
        )}
        aria-label="Console"
        title="Console (⌘J)"
      >
        <Terminal className="h-3.5 w-3.5" />
      </button>

      {/* Glass tint intensity */}
      <div
        className="hidden xl:flex items-center p-0.5 rounded-xl bg-surface-1 border border-border"
        role="group"
        aria-label="Glass tint intensity"
      >
        <Droplet className="h-3 w-3 text-muted-foreground/60 mx-1.5" aria-hidden />
        {tints.map((t) => (
          <button
            key={t.id}
            onClick={() => setIntensity(t.id)}
            aria-pressed={intensity === t.id}
            title={`Glass tint: ${t.label}`}
            className={cn(
              "relative px-2 h-6 rounded-lg text-[10px] font-medium tracking-tight transition-all duration-300 ease-fluid",
              intensity === t.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {intensity === t.id && (
              <span className="absolute inset-0 rounded-lg bg-brand opacity-80 ring-1 ring-white/15" />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={guard("import a project", () => setImportOpen(true))}
        className="hidden md:grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 text-muted-foreground transition"
        aria-label="Import project"
        title="Import project"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={guard("deploy", () => setDeployOpen(true))}
        className="hidden md:grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 text-muted-foreground transition"
        aria-label="Deploy"
        title="Deploy"
      >
        <Rocket className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setView("pricing")}
        className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-1 border border-border text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-white/15 transition"
        title="Usage"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_hsl(255_90%_65%/0.7)]" />
        {usage.aiExecutions}/{usage.aiLimit} AI
      </button>
      <NotificationsCenter />

      <LuminaButton size="sm" variant="primary" className="hidden sm:inline-flex" onClick={guard("publish", () => setPublishOpen(true))}>
        <Sparkles className="h-3 w-3" />
        Publish
      </LuminaButton>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Profile switcher"
              className="h-8 w-8 rounded-full bg-surface-2 ring-1 ring-white/10 grid place-items-center text-[11px] font-semibold text-foreground hover:ring-white/20 transition"
            >
              K
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="text-xs">
            <div className="font-medium">Profile switcher</div>
            <div className="text-muted-foreground mt-0.5">
              Manage your account — not the Command Palette (use{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border">⌘K</kbd> /{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border">Ctrl+K</kbd> for that)
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
}
