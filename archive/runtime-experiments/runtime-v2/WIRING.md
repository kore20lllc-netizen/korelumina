# Runtime Operations — Wiring

The Runtime Operations workspace depends on a single interface,
`RuntimeOperationsService` (see `src/services/runtime/types.ts`). Presentation
components in `parts/*` are backend-agnostic and never import the service; only
`useRuntimeOperations` and `RuntimeOperationsWorkspace` reach into
`services/runtime`.

## Swapping the mock for a real backend

1. Implement the interface against your platform:

```ts
// src/services/runtime/RealRuntimeOperationsService.ts
import type { RuntimeOperationsService, RuntimeSnapshot } from "./types";

export class RealRuntimeOperationsService implements RuntimeOperationsService {
  getSnapshot(): RuntimeSnapshot { /* return your cached snapshot */ }
  subscribe(cb) { /* wire to SSE / WebSocket / polling; return an unsubscribe */ }
  async dispatch(action, projectId) { /* POST /api/runtime/{id}/{action} */ }
}
```

2. Point the singleton at it — the only edit needed:

```ts
// src/services/runtime/index.ts
// - import { MockRuntimeOperationsService } from "./MockRuntimeOperationsService";
// + import { RealRuntimeOperationsService } from "./RealRuntimeOperationsService";
// - export const runtimeOperationsService = new MockRuntimeOperationsService();
// + export const runtimeOperationsService = new RealRuntimeOperationsService();
```

No presentation files change. `useRuntimeOperations` handles loading,
error, and pending state generically.

## Subscription contract

- `subscribe(cb)` MUST push an initial snapshot within one tick, then push a
  fresh snapshot on every meaningful change (metrics jitter, action result,
  lifecycle event). Returned function unsubscribes and, if it's the last
  listener, should stop any transport.
- `dispatch(action, projectId)` MUST resolve after the platform acknowledges
  and reject with a human-readable `Error.message`; the hook toasts it.

## Notes

- `Environment` and `HealthStatus` are enums the UI relies on for chip colors.
  Adapt your backend values to these strings inside the adapter.
- `cpuSeries` / `memSeries` should hold up to 60 most-recent samples, oldest
  first — the sparkline scales to whatever it gets, but 60 renders best.