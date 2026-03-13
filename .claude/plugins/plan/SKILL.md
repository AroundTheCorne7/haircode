---
name: plan
description: Read a loose idea or notes markdown file and produce a structured HairCode feature spec, then wait for approval before any code is written.
triggers:
  - "/plan"
  - "create a spec"
  - "write a spec for"
  - "plan this feature"
---

# HairCode Feature Planning Skill

When invoked with `/plan <path-to-file.md>`:

## Step 1 — Read the input
Read the provided markdown file. If no path is given, ask the user for one.

## Step 2 — Explore affected areas
Based on the feature described, quickly explore relevant code:
- If it touches the engine → read `packages/engine/src/index.ts`, `types.ts`, relevant rules
- If it touches the DB → read affected schema files in `packages/db/src/schema/`
- If it touches the wizard → read `apps/web/src/components/consultation/wizard.tsx` and affected step files
- If it touches the API → read affected route and service files in `apps/api/src/`

Use the Explore agent for this — run explorations in parallel.

## Step 3 — Write the spec
Create a spec file at `docs/specs/<kebab-case-feature-name>.md` using this template:

```markdown
# Spec: [Feature Name]

**Status:** Draft
**Created:** [today's date]

## Summary
One paragraph — what this feature does and why.

## Problem
What gap or pain point does this address?

## Goals
- [ ] ...

## Non-Goals
- Not doing ...

## User Stories
- As a **[stylist / salon owner / client]**, I want **[action]** so that **[benefit]**

## Technical Design

### DB Changes
_Which tables/columns are added or modified. Use `/db-change` to implement._

### Engine Changes
_New rules, layers, types, or pipeline steps._

### API Changes
_New or modified Fastify routes / services._

### UI Changes
_Wizard steps, dashboard pages, components affected._

## Implementation Phases

### Phase 1 — [Name] (~X days)
- [ ] Task

### Phase 2 — [Name] (~X days)
- [ ] Task

## Acceptance Criteria
- [ ] ...

## Open Questions
- ?
```

## Step 4 — Present and wait
Show the user the spec file path and a brief summary of what was written.
Enter plan mode (use EnterPlanMode) so the user can review and approve before any implementation begins.
Do NOT write any code until the user explicitly approves the spec.
