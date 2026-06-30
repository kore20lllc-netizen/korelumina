
## PLAT-028 — Runtime Registry Decomposition (Phase 1)

Status: COMPLETE

Completed
- Extracted RuntimeSerializer into runtime/registry/.
- Moved runtime serialization logic out of registry.ts.
- Moved runtime log sanitization into RuntimeSerializer.
- Shared MAX_LOG_LINES through RuntimeSerializer.
- Registry now imports serializer utilities instead of implementing them.
- Restored persistRecord() and publishState() after extraction removed them inadvertently.
- Runtime build restored to green.

Validation
- npm --workspace apps/lumina-runtime run build
- Result: PASS

Architectural impact
- Registry responsibilities reduced.
- Serialization concerns separated from runtime lifecycle management.
- Registry decomposition continues without behavioral changes.


## PLAT-028 — Runtime Registry Decomposition (Phase 2)

Status: COMPLETE

Completed
- Extracted RuntimeLifecycle into runtime/registry/.
- Moved stopRuntime().
- Moved stopAllRuntimes().
- Moved wait().
- Moved killProcess().
- Registry now re-exports lifecycle APIs.
- Lifecycle module now depends only on the registry public API.
- Removed direct dependency on registry internals (runtimeMap, publishState).

Validation
- npm --workspace apps/lumina-runtime run build
- Result: PASS

Architectural impact
- Runtime shutdown lifecycle is now isolated from registry state management.
- Registry continues evolving toward a façade/coordinator.
- No runtime behavior changes.

