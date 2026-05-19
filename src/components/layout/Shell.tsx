import { type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { PublishDialog } from "@/components/shell/PublishDialog";
import { BottomDock } from "@/components/shell/BottomDock";
import luminaBg from "@/assets/lumina.webp";

export function Shell({ children }: { children: ReactNode; blobs?: "hero" | "ambient" | "soft" }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Fixed background image */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${luminaBg})` }}
      />
      {/* Readability overlay */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, hsl(var(--background) / 0.40), hsl(var(--background) / 0.70) 80%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 45%, hsl(230 25% 2% / 0.4) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col h-screen">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <main className="relative flex-1 min-w-0 min-h-0 flex flex-col">
            {children}
            <BottomDock />
          </main>
        </div>
      </div>
      <CommandPalette />
      <PublishDialog />
    </div>
  );
}
