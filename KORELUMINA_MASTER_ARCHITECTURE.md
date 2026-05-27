cd /Users/erictouko/dev/korelumina

cat > KORELUMINA_MASTER_ARCHITECTURE.md <<'EOF'
# KoreLumina — Master Architecture Roadmap

> Persistent architecture tracker for KoreLumina.
> Use this file across conversations to preserve execution state, avoid drift, and continue from the next incomplete production-critical item.

---

## Operating Rule

- Mark completed work with `[x]`
- Leave pending work as `[ ]`
- Never delete completed items
- Append notes under milestone logs instead of rewriting history
- Every new conversation should begin by reading this file

Recommended continuation prompt:

```txt
Read KORELUMINA_MASTER_ARCHITECTURE.md and continue from the first incomplete production-critical item.

CORE FOUNDATION

Builder + Runtime Integration

* Lumina Builder connected to KoreLumina runtime backend
* Runtime auto-start from builder
* Runtime status polling
* Embedded iframe preview rendering
* Device preview modes
* Fullscreen preview
* Runtime lifecycle registry
* Runtime logs API
* Runtime restart support
* Runtime shutdown cleanup
* Runtime crash auto-recovery
* Runtime memory monitoring
* Runtime CPU monitoring
* Zombie process cleanup daemon
* Runtime sandboxing hardening

⸻

MULTI-FRAMEWORK ENGINE

Framework Support

* Vite detection
* Next.js detection
* Remix support
* Nuxt support
* Astro support
* Electron support
* React Native support
* Monorepo workspace detection
* Turborepo support
* Nx workspace support

⸻

PROJECT IMPORT SYSTEM

Repo Import

* GitHub repo import
* Branch selector
* Dependency auto-install
* Lockfile detection
* Environment variable mapper
* Missing dependency repair
* Import diagnostics panel
* Repo structure visualization
* Multi-entrypoint detection
* App router auto-detection

⸻

BUILDER ENGINE

Visual Builder

* Production drag/drop editor
* Design schema engine
* AI design mutation layer
* Live layout inspector
* Tailwind visual controls
* Responsive breakpoint editor
* Animation timeline editor

⸻

AI ORCHESTRATION

AI Core

* Planner engine stabilization
* Diff generation engine
* Safe apply engine
* Multi-file AI edits
* Repo-wide semantic understanding
* AI rollback system
* AI execution audit trail
* Context window optimization
* Streaming AI responses

⸻

PRODUCTION HARDENING

Stability

* Runtime readiness checks
* Runtime structured logs
* Runtime process registry
* Runtime status endpoints
* Centralized error system
* Structured telemetry
* Health monitoring dashboard
* Rate limiting
* Runtime isolation boundaries
* Production deployment pipeline
* Distributed runtime orchestration

⸻

MASTER OS

Command Center

* Master OS dashboard
* Global orchestration panel
* AI execution timeline
* Runtime fleet management
* Project fleet management
* Workspace analytics
* Admin controls
* Production monitoring

Validation Commands
Runtime

npm --workspace apps/lumina-runtime run build
npm --workspace apps/lumina-runtime run dev
curl http://localhost:4100/health
curl http://localhost:4100/api/runtime/status
curl -X POST http://localhost:4100/api/runtime/start \
  -H "Content-Type: application/json" \
  -d '{"projectId":"elegance-sync-app"}'
curl http://localhost:4100/api/runtime/status/elegance-sync-app
curl "http://localhost:4100/api/runtime/logs?projectId=elegance-sync-app"

Builder

npm --workspace apps/lumina-builder run build
npm --workspace apps/lumina-builder run dev

Runtime Reuse

curl -X POST http://localhost:4100/api/runtime/start \
  -H "Content-Type: application/json" \
  -d '{"projectId":"elegance-sync-app"}'

curl -X POST http://localhost:4100/api/runtime/start \
  -H "Content-Type: application/json" \
  -d '{"projectId":"elegance-sync-app"}'

curl http://localhost:4100/api/runtime/status/elegance-sync-app

Last known green state:

* apps/lumina-builder production build passes
* apps/lumina-runtime TypeScript build passes
* Runtime health endpoint returns ok
* Runtime start works for elegance-sync-app
* Runtime status by project works
* Runtime logs endpoint works
* Runtime renders Vite project on localhost:4200
* PreviewFrame renders runtime iframe
* No duplicate floating URL in preview
* Device controls visible
* Runtime logs include Vite ready output
⸻

BUSINESS LAYER

SaaS Platform

* Authentication hardening
* Team workspaces
* Billing integration
* Subscription enforcement
* Free-tier execution limits
* Enterprise access control
* Audit logs
* Usage metering

⸻

DEPLOYMENT SYSTEM

Hosting

* Vercel deployment integration
* Netlify deployment integration
* Cloudflare deployment integration
* Docker deployment support
* Kubernetes deployment support
* BYO domain system
* SSL provisioning
* Production rollback system

⸻

LONG-TERM VISION

KoreLumina OS

* Full website generation
* Full app generation
* Native app generation
* AI autonomous engineering agents
* Multi-agent collaboration
* Self-healing runtime infrastructure
* Designer + developer unified workflow
* First-class production AI software factory

⸻

MILESTONE LOG

2026-05 Runtime Lifecycle Hardening

* Added runtime registry
* Added runtime logs endpoint
* Added runtime restart support
* Added runtime status serialization
* Added runtime readiness validation
* Added runtime structured lifecycle states

