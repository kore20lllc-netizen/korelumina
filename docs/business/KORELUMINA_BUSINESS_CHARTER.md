# KoreLumina Business Charter

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What KoreLumina sells, to whom, how it earns revenue, its near-term business priorities, and the business boundaries the Chief Agent must respect.

Approval Date: 2026-10-17

---

## Purpose

This charter gives the Chief Agent the business context it needs for mission planning, prioritization, and decision support.

It records the founder's business intent. It does not override the Canon, the Constitution, or the Blueprint.

Current prices, plan limits, and marketing wording live in the landing page (`apps/lumina-builder/src/components/landing/`) and the Landing Contract (`docs/architecture/LANDING_CONTRACT.md`). This charter records the business model those pages express; when a price or plan detail is needed, the Chief Agent reads those sources rather than this document.

---

## What KoreLumina Is

KoreLumina is an operating system for software development. It helps customers import, build, run, repair, and deploy software with AI assistance.

**KoreLumina helps operate a customer's software. It never owns it.**

---

## What KoreLumina Sells

KoreLumina sells three kinds of offering.

### 1. The platform (workspace)

The core product is a workspace where people build, run, analyze, and improve software:

- **Repository import**: bring an existing project (ZIP, GitHub URL, or connected repo). Repository intelligence indexes it so AI works with real context.
- **AI builder**: AI, Designer, and Developer modes working on the same project.
- **Runtime preview**: run the project in an isolated runtime and preview changes before applying them.
- **Transform App → Website**: turn an imported application into a production-ready website. Included on paid plans; also sold once, per project, without a subscription.
- **Templates**: production-ready starters.

### 2. Platform capabilities

- **AI usage**: AI included with plans, with usage-based billing beyond what a plan includes.
- **Managed infrastructure**: KoreLumina runs the project for the customer.
- **Bring your own infrastructure**: the customer connects their own GitHub, Supabase, cloud, and deployment target.
- **Bring your own AI keys**: the customer connects their own AI provider account (for example OpenAI, Anthropic, or Google) and pays that provider directly.
- **Deployment** to the stack the customer already trusts.
- **Enterprise governance**: access control, SSO, audit trails, deployment governance, infrastructure control, and dedicated support.

### 3. Engineering services

When AI alone is not enough, KoreLumina engineers do the work:

- AI repository audit
- White-glove repair
- Feature sprints
- Modernization projects
- Dedicated development
- Enterprise transformation and migration
- Mobile app packaging
- Architecture consulting

The principle is: **AI when speed matters. Experts when certainty matters.** Customers can escalate a task from inside the workspace to KoreLumina engineers without losing context.

---

## Who It Serves

KoreLumina serves customers of every size, from individuals to enterprises.

Primary user groups:

- **Developers**: build, run, and repair software.
- **Designers**: shape and refine product experience.
- **Everyday users**: people without an engineering background who want to achieve their goals using the platform.

Customer segments, as reflected in the plans:

- **Free**: people testing the platform.
- **Pro**: founders, freelancers, and solo builders.
- **Business**: agencies and growing teams.
- **Enterprise**: organizations that need dedicated infrastructure, private cloud, SLAs, and in-house engineering support.

KoreLumina is built for existing software, not only new projects: inherited repositories, legacy systems, monorepos, and technical debt.

---

## How KoreLumina Earns Revenue

1. **Workspace subscriptions**: Free, Pro, Business, and Enterprise plans pay for platform access.
2. **AI usage**: AI included with plans, plus usage-based billing beyond the included amount.
3. **One-time purchases**: for example Transform App → Website for a single project.
4. **Engineering services**: fixed-scope engagements and dedicated development.

### Bring Your Own AI

Customers can connect their own AI provider keys. A customer who does so pays the AI provider directly and pays KoreLumina only for platform access.

This is a deliberate choice, not a gap: **the workspace is the product.** KoreLumina does not require customers to buy AI through it.

---

## Customer Ownership and Freedom to Leave

KoreLumina does not hold a customer's software, data, or keys hostage.

- The customer's code, infrastructure, data, keys, and deployment path stay under the customer's control.
- Customers can bring their own repository, infrastructure, database, deployment target, and AI keys.
- Projects stay portable. A customer who wants to leave can leave at any time and take their software with them.

The Chief Agent must never plan or recommend work that creates lock-in, hides a customer's assets, or makes leaving harder.

---

## Customer Spending Decisions

The customer owns every spending decision.

Before any costly operation, the customer is shown an execution plan: estimated credits, cost, time, models, infrastructure impact, expected artifacts, and how to roll back. The work proceeds only after the customer decides.

The Chief Agent must never spend a customer's money, credits, or infrastructure without that decision.

---

## Business Priorities (next 6–12 months)

1. **AI-operated engineering**: an engineering platform operated by AI under human governance, with the Chief Agent as its executive intelligence.
2. **Repository analysis and repair**: a customer brings a repository; KoreLumina analyzes it, explains exactly what the issues are, and repairs them if the customer asks.
3. **Independence as an AI provider**: KoreLumina builds its own AI so it does not depend on a single external provider. Customers keep the freedom to bring their own AI.

---

## Business Boundaries for the Chief Agent

The Chief Agent must never trade away its own continuous improvement, or the governance that makes improvement trustworthy, for speed or revenue.

In practice:

- Revenue and deadlines do not justify skipping validation, governance, or knowledge preservation.
- Customer ownership comes first: no lock-in, no holding code, data, or keys hostage, and freedom to leave at any time.
- Customer choice of AI provider must be respected; customers are never forced to buy AI usage from KoreLumina.
- The customer owns every spending decision.
- Customer-facing material describes capabilities, not internal engine names.
- Human approval remains required for high-impact business decisions.

---

## Relationship to the Canon

Vision 2050 states that KoreLumina's greatest product is enduring engineering capability, and that software is its first expression.

This charter describes how that capability is offered to customers today. Where the two appear to conflict, the Canon governs.
