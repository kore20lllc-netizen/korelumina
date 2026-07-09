import {
  appearanceNavigationRegistry,
} from "../navigation";

export function AppearanceSidebar() {
  return (
    <aside className="w-72 rounded-3xl border border-white/10 p-4">
      <nav className="space-y-2">
        {appearanceNavigationRegistry.map(
          (item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
              >
                <Icon className="h-4 w-4" />

                <div>
                  <div className="text-sm font-medium">
                    {item.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          },
        )}
      </nav>
    </aside>
  );
}
