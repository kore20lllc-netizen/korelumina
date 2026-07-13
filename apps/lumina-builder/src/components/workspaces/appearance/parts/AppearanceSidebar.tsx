import { cn } from "@/lib/utils";

import { LuminaButton } from "@/components/lumina/LuminaButton";
import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";

import {
  appearanceNavigationRegistry,
} from "../navigation";

export function AppearanceSidebar() {
  return (
    <LuminaSurface
      variant="sidebar"
      className="w-72 p-4"
    >
      <nav className="space-y-2">
        {appearanceNavigationRegistry.map((item) => {
          const Icon = item.icon;

          return (
            <LuminaSurface
              key={item.id}
              variant="interactive"
              asChild
            >
              <LuminaButton
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start rounded-2xl px-3 py-3",
                  "gap-3",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <div className="min-w-0 text-left">
                  <div className="text-sm font-medium">
                    {item.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </LuminaButton>
            </LuminaSurface>
          );
        })}
      </nav>
    </LuminaSurface>
  );
}
