# Runtime Operations — Integration Report

## What was added (all additive)

```
src/services/runtime/
  types.ts
  RuntimeOperationsService.ts   (re-export of the interface)
  MockRuntimeOperationsService.ts
  index.ts                      (singleton — swap point)

src/hooks/useRuntimeOperations.ts

src/components/workspaces/runtime/
  RuntimeOperationsWorkspace.tsx
  parts/RuntimeHeader.tsx
  parts/RuntimeHealthOverview.tsx
  parts/RuntimeMetricTile.tsx
  parts/RuntimeSparkline.tsx
  parts/RuntimeHealthBadge.tsx
  parts/RuntimeStatusDot.tsx
  parts/RuntimeProjectsList.tsx
  parts/RuntimeProjectRow.tsx
  parts/RuntimeEventStream.tsx
  parts/RuntimeLifecycleTimeline.tsx
  parts/RuntimeLogsPanel.tsx
  parts/RuntimeActionsToolbar.tsx
  parts/RuntimeInspector.tsx
  parts/RuntimeSearchFilters.tsx
  parts/RuntimeEmptyState.tsx
  parts/RuntimeErrorState.tsx
  parts/RuntimeSkeletons.tsx
  WIRING.md
  INTEGRATION_REPORT.md
```

## Wiring diff (three edits, matches existing workspace pattern)

1. `src/context/WorkspaceContext.tsx` — added `"runtime"` to the `View` union
   and to the `readInitialView` allow-list.
2. `src/pages/Index.tsx` — added
   `if (view === "runtime") return <Shell blobs="ambient"><RuntimeOperationsWorkspace /></Shell>;`
3. `src/components/layout/Sidebar.tsx` — added one `{ icon: Gauge, label: "Runtime" }`
   entry plus a `setView("runtime")` handler; same NavLink pattern as the other
   base items.

No `App.tsx` React Router routes were added. No providers, dialogs, shell, or
design tokens were modified. No new npm packages.

## Reused primitives

- `components/layout/Shell` — page frame
- `components/lumina/GlowCard` — every surface / tile / panel
- `components/lumina/LuminaButton` — every button, matching existing sizes
- `components/ui/{tabs, sheet, alert-dialog, input, scroll-area, skeleton}`
- `components/ui/sonner` — dispatch toasts (via existing global `Sonner` in `App.tsx`)
- `hooks/use-mobile` — responsive collapse for toolbar / inspector
- `lib/utils.cn` — every `className` merges
- Design tokens from `src/index.css` (violet, cyan, magenta, gold, surface-*),
  no hardcoded colors, works in both themes.
- Animation classes (`anim-in`, `animate-pulse`) already defined in the project.
- `lucide-react` icons only (Activity, Cpu, MemoryStick, Gauge, Rocket, etc.).

## Verification checklist

- [x] No existing workspace files modified beyond the three wiring lines.
- [x] No duplicate primitives — everything routes through `GlowCard`,
      `LuminaButton`, and shadcn `ui/*`.
- [x] Lumina design language preserved (semantic tokens only, no hardcoded
      hex/tailwind color literals for surfaces).
- [x] Every runtime part accepts `className` and merges via `cn`.
- [x] Presentation imports zero services except `useRuntimeOperations`.
- [x] No React Router changes, no provider edits, no shell redesign, no new
      npm packages, no network calls.
- [x] Mock service is fully swappable behind the `RuntimeOperationsService`
      interface — see `WIRING.md`.

## Keyboard

- `/` focus search
- `↑ / ↓` move selection in the services rail
- `Enter` open the inspector sheet
- `R` restart selected service
- `S` shutdown selected service (toast confirms)

## States

- **Loading** — full skeleton scaffold (header, 4 tiles, rail rows, feed, inspector).
- **Empty** — per-panel via `RuntimeEmptyState` (`projects`, `events`, `logs`, `search`).
- **Error** — full-panel `RuntimeErrorState` with retry that re-subscribes.
- **Filter miss** — `search` empty variant replaces the rail while other panels
  keep global content.