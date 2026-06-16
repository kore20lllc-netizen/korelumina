import {
  LayoutGrid, Sparkles, Palette, Code2, FolderGit2, Settings, X,
  Layers, FileCode2, Wand2, Image as ImageIcon, MessageSquare, Plus, Box, Home, Activity, ShieldCheck, Gauge, Crown, ChevronDown, LogOut, User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";
import { getCurrentRole } from "@/services/workspaceAccessService";
import { auth } from "@/providers/auth-registry";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";

interface NavItemDef { icon: any; label: string; active?: boolean; badge?: string }

export function Sidebar() {
  const { mode, view, setView, sidebarOpen, setSidebarOpen, activeProject, setImportOpen } = useWorkspace();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const role = getCurrentRole();
  const [adminOpen, setAdminOpen] = useState<boolean>(() => {
    try { return window.localStorage.getItem("korelumina:sidebarAdminOpen") !== "0"; } catch { return true; }
  });
  const toggleAdmin = () => {
    setAdminOpen((v) => {
      const next = !v;
      try { window.localStorage.setItem("korelumina:sidebarAdminOpen", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const baseItems: NavItemDef[] =
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

  // Admin-only group (Repo Audit, In-House Dev, Admin) is rendered as a
  // separate, labeled section below the main nav — visible only to admins.
  const adminItems: NavItemDef[] =
    (role === "admin" || role === "super_admin") &&
    view !== "workspace"
      ? [
          { icon: Activity, label: "Repo Audit", active: view === "repo-audit" },
          { icon: ShieldCheck, label: "In-House Dev", active: view === "inhouse-dev" },
          {
            icon: Gauge,
            label: "Deployment Diagnostics",
            active: view === "deployment-diagnostics",
          },
          { icon: Crown, label: "Admin", active: view === "admin" },
        ]
      : [];

  const visibleAdminItems = adminOpen ? adminItems : [];
  const items: NavItemDef[] = [...baseItems, ...visibleAdminItems];

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
            const isAdminHeaderSlot =
              adminOpen && adminItems.length > 0 && index === baseItems.length;
            return (
              <div key={item.label} className="flex flex-col items-center w-full">
              {isAdminHeaderSlot && (
                <button
                  type="button"
                  onClick={toggleAdmin}
                  aria-expanded={adminOpen}
                  aria-label={adminOpen ? "Collapse Admin section" : "Expand Admin section"}
                  className="group/header w-full flex flex-col items-center my-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/60 rounded-md py-0.5"
                  title={adminOpen ? "Collapse Admin" : "Expand Admin"}
                >
                  <span className="w-8 h-px bg-border" role="presentation" aria-hidden="true" />
                  <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] sm:text-[11px] md:text-[11px] font-bold tracking-[0.12em] uppercase text-foreground leading-none">
                    Admin
                    <ChevronDown
                      aria-hidden="true"
                      focusable="false"
                      className={cn(
                        "h-2.5 w-2.5 transition-transform duration-200",
                        adminOpen ? "rotate-0" : "-rotate-90"
                      )}
                      strokeWidth={2.5}
                    />
                  </span>
                </button>
              )}
              <button
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
                  } else if (item.label === "Repo Audit") {
                    setView("repo-audit");
                  } else if (item.label === "In-House Dev") {
                    setView("inhouse-dev");
                  } else if (
                    item.label === "Deployment Diagnostics"
                  ) {
                    setView("deployment-diagnostics");
                  } else if (item.label === "Admin") {
                    setView("admin");
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
              </div>
            );
          })}
          {adminItems.length > 0 && !adminOpen && (
            <button
              type="button"
              onClick={toggleAdmin}
              aria-expanded={false}
              aria-label="Expand Admin section"
              className="w-full flex flex-col items-center my-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/60 rounded-md py-0.5"
              title="Expand Admin"
            >
              <span className="w-8 h-px bg-border" role="presentation" aria-hidden="true" />
              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold tracking-[0.12em] uppercase text-foreground leading-none">
                Admin
                <ChevronDown aria-hidden="true" focusable="false" className="h-2.5 w-2.5 -rotate-90" strokeWidth={2.5} />
              </span>
            </button>
          )}
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

        <AccountMenu />
      </aside>
    </>
  );
}

function AccountMenu() {
  const { setView } = useWorkspace();
  const { user } = useAuth();
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  const handleSignOut = async () => {
  await auth.signOut();

  try {
    localStorage.removeItem("korelumina:view");
    localStorage.removeItem("korelumina:activeTeam");

    sessionStorage.removeItem(
      "korelumina:intendedView",
    );
  } catch {
    // noop
  }

  toast("Signed out");

  setView("landing");

  window.location.href = "/";
};

  if (!user) {
    return (
      <button
        onClick={() => setView("auth")}
        title="Sign in"
        aria-label="Sign in"
        className="group relative mt-2 h-9 w-9 rounded-full grid place-items-center bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-1 transition"
      >
        <UserIcon className="h-4 w-4" />
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg glass-strong text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition translate-x-1 group-hover:translate-x-0 z-50">
          Sign in
        </span>
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title={user.name || user.email}
          aria-label="Account menu"
          className="group relative mt-2 h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-white ring-1 ring-white/10 hover:ring-white/20 transition"
          style={{ background: "var(--gradient-button)" }}
        >
          {initial}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-60 p-2 glass-strong border-border">
        <div className="px-2 py-2 border-b border-border mb-1">
          <div className="text-sm font-medium truncate">{user.name || "Account"}</div>
          <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
        </div>
        <button
          onClick={() => setView("settings")}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-surface-2 transition text-left"
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-surface-2 transition text-left text-rose-300"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
