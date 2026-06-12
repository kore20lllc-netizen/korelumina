# KoreLumina Continuation Context

## Current Branch
feature/lumina-runtime-hardening

## Current Phase
Production Runtime Lifecycle Hardening

## Stable Systems
- Lumina Builder UI rendering
- WorkspaceContext stabilized
- Preview iframe rendering restored
- Runtime backend running on :4100
- Runtime auto-start working
- Runtime reuse layer added
- Duplicate runtime spawn prevented
- Runtime registry hardened
- Graceful SIGTERM cleanup added

## Current Runtime Architecture
Frontend:
- apps/lumina-builder
- PreviewFrame.tsx
- useRuntimeBoot.ts
- runtimeService.ts

Backend:
- apps/lumina-runtime

Runtime APIs:
- /api/runtime/start
- /api/runtime/status
- /api/runtime/restart
- /api/runtime/logs
- /api/runtime/stop

## Current Goal
Move from unstable runtime spawning into Lovable-grade persistent runtime sessions.

## Next Tasks
1. Runtime reconnect without iframe reload
2. Heartbeat monitoring
3. Runtime auto-recovery
4. Runtime ownership locking
5. Runtime memory cleanup
6. Hot reload preservation
7. Preview websocket channel
8. Multi-runtime orchestration
9. Runtime process supervisor
10. Production deployment runtime manager

## Important Existing Rules
- One task at a time
- Production-grade only
- No regression
- Full-file rewrites preferred
- Exact placement only
- Builder and preview must never break
- Runtime must reuse existing ports
- Never spawn duplicate runtimes

## Current Known Good State
- Preview renders
- Builder loads
- Runtime reuse functioning
- No infinite React loops
- No duplicate preview URL overlays
- Device switcher restored
- Runtime backend compiling

## Current Validation Commands

### Runtime build
npm --workspace apps/lumina-runtime run build

### Runtime dev
npm --workspace apps/lumina-runtime run dev

### Builder dev
npm --workspace apps/lumina-builder run dev

### Runtime status
curl "http://localhost:4100/api/runtime/status?projectId=elegance-sync-app"

### Start runtime
curl -X POST http://localhost:4100/api/runtime/start \
  -H "Content-Type: application/json" \
  -d '{"projectId":"elegance-sync-app"}'

