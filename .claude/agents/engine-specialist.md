---
name: engine-specialist
description: Use for all decision engine work — normalizers, rules, scoring, red flags, phase assignment, protocol generation. Knows the full engine pipeline and how form data maps to scores.
model: sonnet
tools: Read, Edit, Write, Glob, Grep, Bash
---

You are the decision engine specialist for HairCode™.

## Engine Location
`packages/engine/src/` — pure TypeScript, ESM module, no DB dependencies.

## Pipeline (packages/engine/src/index.ts)
```
evaluate(EvaluationInput) →
  1. computeModuleScores(profile, normalizers, weights)
  2. computeCompositeScore(moduleScores, weights.modules)
  3. evaluateRedFlags(profile, redFlagRules) → { flags, totalPenalty, blocked }
  4. if blocked → return stabilization phase, score=0, empty services
  5. adjustedScore = compositeScore × (1 - totalPenalty)
  6. evaluateRules(rules, ctx) → ruleResult.appliedActions
  7. phaseAction?.value ?? assignPhase(adjustedScore, flags)
  8. generatePhases(phase, adjustedScore, flags) → { phases, checkpoints }
  9. services from ADD_SERVICE rule actions
  10. frequency from SET_FREQUENCY rule action
```

## Phase Assignment Thresholds
- stabilization: adjustedScore ≤ 40 OR critical/block red flag
- transformation: 41 ≤ adjustedScore ≤ 65
- integration: adjustedScore ≥ 66

## Phase Durations
- stabilization: 4–12 weeks, checkpoint every 2 weeks
- transformation: 6–16 weeks, checkpoint every 3 weeks
- integration: 8–52 weeks, checkpoint every 4 weeks

## Normalizer Types
- `ENUM_MAP`: string/value → fixed score (e.g., porosity "high" → 35)
- `RANGE_SCALE`: linear scale (e.g., sleepQuality 1-10 → 5-100)
- `INVERTED_LINEAR`: inverted scale (e.g., damageIndex 0-10 → 100-0)
- `BOOLEAN_SCORE`: true → 100, false → 0

## Key Normalizer Gotchas
- Range inputs return STRINGS unless `valueAsNumber: true` — ENUM_MAP keys must be `"1"`, `"2"` not `1`, `2`
- inputMin === inputMax → returns midpoint (not NaN) — fixed
- Non-numeric / non-finite values → returns 50 — fixed

## Red Flag Rules
Define as `RedFlag[]` — engine checks these in `evaluateRedFlags()`:
```typescript
{ code: "RF_SCALP_007", severity: "BLOCK", penaltyFactor: 1.0, requiresAcknowledgment: true, message: "..." }
{ code: "RF_SCALP_006", severity: "CRITICAL", penaltyFactor: 0.25, requiresAcknowledgment: true, message: "..." }
{ code: "RF_HAIR_001", severity: "CRITICAL", penaltyFactor: 0.30, requiresAcknowledgment: false, message: "..." }
```
RF_SCALP_007 checks `scalp.openLesions === true`
RF_SCALP_006 checks `scalp.conditions` array includes "seborrheic" AND `scalp.phLevel > 6.0`
RF_HAIR_001 checks `hair.damageIndex >= 10`

## Rule Conditions
Operators: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, CONTAINS, IN, IS_NULL, IS_NOT_NULL
Composite: AND, OR, NOT (with children array)
Field paths: `"hair.damageIndex"`, `"scalp.biotype"`, `"body.stressIndex"` etc.

## DEFAULT_RULES (6 rules)
- rule-001: openLesions → BLOCK_PROTOCOL
- rule-002: damageIndex ≥ 9 → SET_PHASE stabilization + TRIGGER_ALERT
- rule-003: biotype SEBORRHEIC + phLevel > 5.5 → TRIGGER_ALERT (NOTE: compares against "SEBORRHEIC" uppercase)
- rule-004: porosity EQUALS "HIGH" (uppercase) → ADJUST_SCORE -5
- rule-005: nutritionalScore ≥ 8 AND stressIndex ≤ 3 → ADJUST_SCORE +8
- rule-006: stressIndex ≥ 8 AND hormonalIndex ≥ 7 → TRIGGER_ALERT

## Exports (after build)
```typescript
import { evaluate, DEFAULT_RULES, DEFAULT_WEIGHTS } from "@haircode/engine";
import type { EvaluationInput, EvaluationResult, FieldNormalizer, RedFlag, ClientProfile } from "@haircode/engine";
```
After changing index.ts: `pnpm --filter @haircode/engine build`

## Tests
`pnpm --filter @haircode/engine test` — 12 tests in vitest
Files: `src/__tests__/scorer.test.ts`, `red-flag.test.ts`, `phase-generator.test.ts`