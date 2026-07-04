# KoreLumina Builder Architecture v2

Status: Approved Direction

## Principle

Extract, do not copy.

The Builder must evolve from a component-folder React app into a modular feature-based platform.

## Target Structure

builder/
  core/
  features/
  shared/
  infrastructure/

## Core

Owns application infrastructure only:
- Router
- Workspace registry
- navigation
- providers
- permissions
- feature flags

## Shared

Owns reusable UI and platform primitives:
- workspace layout
- cards
- tabs
- loading states
- empty states
- status badges
- common hooks
- common utilities

## Infrastructure

Owns external communication:
- runtime API
- runtime events
- storage
- GitHub
- AI gateways
- telemetry

## Features

Each feature owns its own components, hooks, state, services, and types.

Features may depend on shared and infrastructure.

Features must not directly import other features.

## Runtime Boundary

Builder must communicate with runtime only through runtime client APIs.

Builder must not directly manipulate runtime filesystem or runtime process state.

## Workspace Rule

Every workspace must use shared workspace primitives:
- WorkspaceLayout
- WorkspaceHero
- WorkspaceTabBar
- WorkspaceGrid
- WorkspaceSection
- WorkspaceCard
- WorkspaceMetricCard
- WorkspaceLoading
- WorkspaceEmptyState
- WorkspaceStatusBadge

## Component Size Targets

Workspace: under 300 lines
Panel: under 200 lines
Card: under 120 lines
Hook: under 150 lines
Utility: under 100 lines

## Long-Term Direction

The Builder should become plugin-ready, registry-driven, and feature-owned.

New capabilities should register into the platform without requiring core rewrites.
