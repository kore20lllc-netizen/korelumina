mkdir -p docs/architecture
# KORELUMINA CORE ENGINEERING RULES

## RULE #1 — PRODUCTION-FIRST ONLY

Every implementation, refactor, provider, route, component, hook, runtime module, preview engine, AI orchestration layer, and UI system MUST be built production-grade from day one.

NO:
- temporary hacks
- duplicate logic
- dead code
- mock leakage into production
- unstable state flow
- mixed provider patterns
- circular dependencies
- random inline fixes
- hidden side effects
- experimental shortcuts in core systems

ALL CODE MUST:
- compile cleanly
- hot reload safely
- support scaling
- support modular replacement
- support multi-project isolation
- support enterprise-grade debugging
- fail safely
- maintain strict typing
- avoid regressions
- be chunk-safe
- be lazy-load optimized
- be provider-isolated
- be hydration-safe
- be production deploy-safe

## KORELUMINA STANDARDS

### Architecture
- Single responsibility per module
- No duplicated workspace declarations
- No duplicated lazy imports
- No provider recursion
- No nested provider conflicts
- No UI/business logic coupling
- No auth state duplication

### Runtime
- Multi-project safe
- No stale preview cache
- Deterministic rendering
- Real repo rendering only
- Hot reload isolated per workspace

### Auth
- Single source of truth
- Centralized auth state
- Stable session restoration
- No local auth drift
- Protected route continuity

### Providers
- Registry-driven
- Runtime switchable
- Production-safe guards
- Mock providers blocked in production unless explicitly enabled

### Performance
- Aggressive lazy loading
- Proper code splitting
- Manual chunk strategy where needed
- No megachunk regressions
- Avoid static imports of admin-only systems

### UI/UX
- Premium aesthetic only
- Consistent glass system
- Animation performance optimized
- No layout flashing
- No hydration mismatch
- No visual regressions

### Safety
- Overwrite-only file operations
- Explicit environment validation
- Clear runtime logging
- No silent failures

## ENFORCEMENT

If implementation is not production-grade:
- STOP
- REFACTOR
- STABILIZE
- VERIFY
- THEN CONTINUE

KoreLumina is a first-in-class AI operating system.
Everything must reflect that standard.
