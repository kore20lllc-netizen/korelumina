# KoreLumina Platform Doctrine

## Core Principle

KoreLumina is one platform with multiple experiences.

The engine is shared. The user experience is not.

## Capability Classification

Every capability must be classified before implementation.

### Platform

Core infrastructure and engines. Never exposed directly to customers.

Examples:
- Runtime engine
- AI engine
- Knowledge engine
- Deployment engine
- Permission engine
- Workspace engine
- Event bus
- Storage
- Observability

### Internal

Engineering and operational tools for KoreLumina operators.

Examples:
- Runtime Operations
- Knowledge Preservation
- Architecture Explorer
- Repository Audit
- Security Center
- Diagnostics
- Admin Console

### Shared

Capabilities consumed by both internal and customer experiences.

Examples:
- Projects
- File browser
- Editor
- AI chat
- Notifications
- Search
- Settings
- Profile

### Customer

Simplified business workflows built on top of platform capabilities.

Examples:
- Website builder
- Business dashboard
- AI assistant
- Brand assets
- Analytics
- Billing
- Publishing

### Extension

Third-party, partner, vertical, or customer-specific modules.

Examples:
- Industry workspaces
- Partner integrations
- Customer modules
- Plugin workspaces

## Vocabulary Rule

Customer experiences must not expose internal platform terminology.

| Internal Term | Customer Term |
| --- | --- |
| Runtime | Website |
| Registry | Services |
| Worker | Background task |
| Deployment pipeline | Publish |
| Knowledge compiler | AI learning |
| Architecture snapshot | Version |
| Runtime logs | Activity |
| Health score | Status |
| Memory graph | AI knowledge |
| Event bus | Updates |

## Workspace Audience Rule

Every workspace must declare its audience.

```ts
workspace: {
  id: string;
  audience: "internal" | "customer" | "shared" | "experimental";
  capabilities: string[];
  featureFlags: string[];
}                                                                                       EOF
