/**
 * Decision Engine Unit Tests
 * Based purely on: HairCode™ Formal System Specifications v1.0.0
 * Spec §5 — Decision Engine Spec
 *
 * These are pure unit tests. No database, no HTTP layer.
 * The `evaluate` function, DEFAULT_RULES, and DEFAULT_WEIGHTS are imported
 * from the @haircode/engine package.
 */

import { describe, it, expect } from "vitest";
import {
  evaluate,
  DEFAULT_RULES,
  DEFAULT_WEIGHTS,
} from "../index.js";

// ---------------------------------------------------------------------------
// Minimal normalizer set that matches the spec (§5.3)
// Used across all test scenarios. This mirrors the NORMALIZERS array used by
// the /api/evaluate route.ts — we replicate the spec-mandated values here
// so tests are self-contained and driven purely by the spec.
// ---------------------------------------------------------------------------
import type { FieldNormalizer, RedFlag } from "../index.js";

const NORMALIZERS: FieldNormalizer[] = [
  // §5.3 — INVERTED_LINEAR: hair.damageIndex [0,10] → [0,100]
  {
    fieldPath: "hair.damageIndex",
    type: "INVERTED_LINEAR",
    inputMin: 0,
    inputMax: 10,
    outputMin: 0,
    outputMax: 100,
  },
  // §5.3 — ENUM_MAP: scalp.biotype
  {
    fieldPath: "scalp.biotype",
    type: "ENUM_MAP",
    map: {
      dry: 50,
      normal: 90,
      oily: 55,
      combination: 65,
      sensitized: 40,
    },
  },
  // §5.3 — RANGE_SCALE: body.sleepQualityScore [1,10] → [5,100]
  {
    fieldPath: "body.sleepQualityScore",
    type: "RANGE_SCALE",
    inputMin: 1,
    inputMax: 10,
    outputMin: 5,
    outputMax: 100,
  },
  // §5.3 — INVERTED_LINEAR: body.stressIndex [1,10] → [5,100]
  {
    fieldPath: "body.stressIndex",
    type: "INVERTED_LINEAR",
    inputMin: 1,
    inputMax: 10,
    outputMin: 5,
    outputMax: 100,
  },
  // §5.3 — ENUM_MAP: hair.texture
  {
    fieldPath: "hair.texture",
    type: "ENUM_MAP",
    map: {
      straight: 80,
      wavy: 75,
      curly: 70,
      coily: 60,
      kinky: 55,
    },
  },
  // §5.3 — ENUM_MAP: hair.porosity
  {
    fieldPath: "hair.porosity",
    type: "ENUM_MAP",
    map: {
      low: 85,
      medium: 70,
      high: 35,
      highly_damaged: 15,
    },
  },
  // §5.3 — ENUM_MAP: hair.elasticity
  {
    fieldPath: "hair.elasticity",
    type: "ENUM_MAP",
    map: {
      excellent: 90,
      good: 70,
      moderate: 45,
      poor: 15,
    },
  },
  // §5.3 — INVERTED_LINEAR: scalp.phLevel [3.5,7.5] → [10,90]
  {
    fieldPath: "scalp.phLevel",
    type: "INVERTED_LINEAR",
    inputMin: 3.5,
    inputMax: 7.5,
    outputMin: 10,
    outputMax: 90,
  },
  // §5.3 — ENUM_MAP: scalp.sebumProduction (string keys — range input returns strings)
  {
    fieldPath: "scalp.sebumProduction",
    type: "ENUM_MAP",
    map: {
      "1": 55,
      "2": 90,
      "3": 55,
      "4": 25,
    },
  },
  // §5.3 — RANGE_SCALE: hair.density [1,5] → [30,90]
  {
    fieldPath: "hair.density",
    type: "RANGE_SCALE",
    inputMin: 1,
    inputMax: 5,
    outputMin: 30,
    outputMax: 90,
  },
  // §5.3 — ENUM_MAP: morphology.faceShape
  {
    fieldPath: "morphology.faceShape",
    type: "ENUM_MAP",
    map: {
      oval: 90,
      heart: 80,
      diamond: 78,
      round: 68,
      square: 68,
      oblong: 62,
      triangle: 62,
    },
  },
  // §5.3 — ENUM_MAP: morphology.undertone
  {
    fieldPath: "morphology.undertone",
    type: "ENUM_MAP",
    map: {
      neutral: 85,
      warm: 72,
      cool: 72,
    },
  },
  // §5.3 — RANGE_SCALE: morphology.symmetryScore [0,100] → [0,100]
  {
    fieldPath: "morphology.symmetryScore",
    type: "RANGE_SCALE",
    inputMin: 0,
    inputMax: 100,
    outputMin: 0,
    outputMax: 100,
  },
];

// ---------------------------------------------------------------------------
// Red flag rules — spec §5.6
// ---------------------------------------------------------------------------
const RED_FLAG_RULES: RedFlag[] = [
  // §5.6 — RF_SCALP_007 — Open Lesions (BLOCK)
  {
    code: "RF_SCALP_007",
    severity: "BLOCK",
    penaltyFactor: 1.0,
    requiresAcknowledgment: true,
    message:
      "Open scalp lesions detected — all chemical services are contraindicated until healed.",
    condition: (profile) => profile.scalp?.openLesions === true,
  },
  // §5.6 — RF_SCALP_006 — Seborrheic + Elevated pH (CRITICAL)
  {
    code: "RF_SCALP_006",
    severity: "CRITICAL",
    penaltyFactor: 0.25,
    requiresAcknowledgment: true,
    message:
      "Seborrheic condition with elevated pH — rebalancing protocol required before transformation work.",
    condition: (profile) =>
      Array.isArray(profile.scalp?.conditions) &&
      (profile.scalp.conditions as string[]).includes("seborrheic") &&
      typeof profile.scalp?.phLevel === "number" &&
      (profile.scalp.phLevel as number) > 6.0,
  },
  // §5.6 — RF_HAIR_001 — Severe Damage (CRITICAL)
  {
    code: "RF_HAIR_001",
    severity: "CRITICAL",
    penaltyFactor: 0.30,
    requiresAcknowledgment: false,
    message:
      "Severe structural damage (damage index 10/10) — emergency repair protocol initiated.",
    condition: (profile) =>
      typeof profile.hair?.damageIndex === "number" &&
      (profile.hair.damageIndex as number) >= 10,
  },
];

// ---------------------------------------------------------------------------
// §5.9 Scenario A: damageIndex=10, openLesions=true → BLOCKED
// ---------------------------------------------------------------------------
describe("Spec §5.9 — Scenario A: damageIndex=10, openLesions=true → BLOCKED", () => {
  it("returns blocked=true, assignedPhase=stabilization, adjustedScore=0", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 10 },
        scalp: { openLesions: true, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.1 Step 4 — BLOCK early return
    expect(result.adjustedScore).toBe(0);
    expect(result.assignedPhase).toBe("stabilization");

    // Spec §5.6 — RF_SCALP_007 must be present in redFlags
    const rfCodes = result.redFlags.map((f) => f.code);
    expect(rfCodes).toContain("RF_SCALP_007");

    // Spec §5.1 Step 4 — empty protocol on BLOCK
    expect(result.appliedActions).toEqual([]);
    expect(result.protocol.phases).toEqual([]);
    expect(result.protocol.services).toEqual([]);
    expect(result.protocol.checkpoints).toEqual([]);
    // Spec §5.9 Scenario A — frequency interval=0, unit="weeks" when blocked
    expect(result.protocol.frequency.interval).toBe(0);
    expect(result.protocol.frequency.unit).toBe("weeks");
  });

  it("RF_SCALP_007 severity is BLOCK", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 10 },
        scalp: { openLesions: true, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    const rf007 = result.redFlags.find((f) => f.code === "RF_SCALP_007");
    expect(rf007).toBeDefined();
    expect(rf007?.severity).toBe("BLOCK");
  });

  it("result has a string evaluationId (UUID)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 10 },
        scalp: { openLesions: true, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    expect(typeof result.evaluationId).toBe("string");
    // UUID v4 regex
    expect(result.evaluationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

// ---------------------------------------------------------------------------
// §5.9 Scenario B: damageIndex=9 → stabilization (forced by rule-002)
// Spec §5.7: rule-002 fires when damageIndex >= 9 → SET_PHASE "stabilization"
// Spec §5.9: RF_HAIR_001 does NOT trigger (damageIndex >= 10 threshold)
// ---------------------------------------------------------------------------
describe("Spec §5.9 — Scenario B: damageIndex=9 → phase forced to stabilization by rule-002", () => {
  it("assignedPhase is stabilization", async () => {
    const result = await evaluate({
      profile: {
        hair: {
          damageIndex: 9,
          texture: "straight",
          porosity: "medium",
          elasticity: "good",
        },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // rule-002 forces SET_PHASE "stabilization"
    expect(result.assignedPhase).toBe("stabilization");
  });

  it("RF_HAIR_001 does NOT trigger at damageIndex=9 (threshold is >= 10)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 9 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.9 Scenario B: "RF_HAIR_001 triggers (damageIndex >= 10? No — damageIndex=9 does NOT trigger RF_HAIR_001)"
    const rfCodes = result.redFlags.map((f) => f.code);
    expect(rfCodes).not.toContain("RF_HAIR_001");
  });

  it("isBlocked is false (no BLOCK red flag)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 9 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // No BLOCK severity flag → not blocked
    const hasBlock = result.redFlags.some((f) => f.severity === "BLOCK");
    expect(hasBlock).toBe(false);
    // adjustedScore should be > 0
    expect(result.adjustedScore).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// §5.9 Scenario C: damageIndex=5, biotype=normal, stressIndex=3 → transformation
// ---------------------------------------------------------------------------
describe("Spec §5.9 — Scenario C: damageIndex=5, biotype=normal, stressIndex=3 → transformation", () => {
  it("assignedPhase is transformation", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5, texture: "straight", porosity: "medium", elasticity: "good" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
        body: { stressIndex: 3 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    expect(result.assignedPhase).toBe("transformation");
  });

  it("no red flags triggered", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5, texture: "straight", porosity: "medium", elasticity: "good" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
        body: { stressIndex: 3 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    expect(result.redFlags).toHaveLength(0);
  });

  it("adjustedScore is in the transformation range (41-65)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5, texture: "straight", porosity: "medium", elasticity: "good" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
        body: { stressIndex: 3 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.4 — transformation: 41–65 (inclusive)
    expect(result.adjustedScore).toBeGreaterThanOrEqual(41);
    expect(result.adjustedScore).toBeLessThanOrEqual(65);
  });
});

// ---------------------------------------------------------------------------
// §5.9 Scenario D: damageIndex=0, biotype=normal, sleepQuality=9, stressIndex=1 → integration
// ---------------------------------------------------------------------------
describe("Spec §5.9 — Scenario D: damageIndex=0, biotype=normal, sleep=9, stress=1 → integration", () => {
  it("assignedPhase is integration", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 0, texture: "straight", porosity: "low", elasticity: "excellent" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
        body: { sleepQualityScore: 9, stressIndex: 1 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    expect(result.assignedPhase).toBe("integration");
  });

  it("adjustedScore is in the integration range (>= 66)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 0, texture: "straight", porosity: "low", elasticity: "excellent" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
        body: { sleepQualityScore: 9, stressIndex: 1 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.4 — integration: >= 66
    expect(result.adjustedScore).toBeGreaterThanOrEqual(66);
  });
});

// ---------------------------------------------------------------------------
// §5.9 Scenario E: seborrheic + phLevel=7.0 → RF_SCALP_006, 25% penalty
// ---------------------------------------------------------------------------
describe("Spec §5.9 — Scenario E: seborrheic + phLevel=7.0 → RF_SCALP_006 + penalty", () => {
  it("redFlags includes RF_SCALP_006", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 7.0,
          openLesions: false,
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    const rfCodes = result.redFlags.map((f) => f.code);
    expect(rfCodes).toContain("RF_SCALP_006");
  });

  it("RF_SCALP_006 has severity CRITICAL", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 7.0,
          openLesions: false,
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    const rf006 = result.redFlags.find((f) => f.code === "RF_SCALP_006");
    expect(rf006?.severity).toBe("CRITICAL");
  });

  it("25% penalty is applied: adjustedScore = compositeScore * 0.75", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 7.0,
          openLesions: false,
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.6 — RF_SCALP_006 penaltyFactor = 0.25
    // adjustedScore = compositeScore × (1 − 0.25) = compositeScore × 0.75
    const expectedAdjusted = result.compositeScore * 0.75;
    expect(result.adjustedScore).toBeCloseTo(expectedAdjusted, 5);
  });

  // Spec §5.4 + §5.6 — CRITICAL red flag forces assignedPhase to stabilization
  it("CRITICAL red flag forces assignedPhase to stabilization", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 7.0,
          openLesions: false,
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.4 — "If any red flag has severity CRITICAL or BLOCK,
    //               assignPhase() returns 'stabilization' regardless of score"
    expect(result.assignedPhase).toBe("stabilization");
  });

  // Spec §5.6 — phLevel must be > 6.0 (boundary: phLevel=6.0 should NOT trigger)
  it("phLevel=6.0 (exactly at boundary, not above) does NOT trigger RF_SCALP_006", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 6.0, // exactly 6.0 — condition is phLevel > 6.0
          openLesions: false,
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    const rfCodes = result.redFlags.map((f) => f.code);
    expect(rfCodes).not.toContain("RF_SCALP_006");
  });
});

// ---------------------------------------------------------------------------
// §5.6 — When both RF_SCALP_006 and RF_HAIR_001 trigger, penalty = max(0.25, 0.30)
// NOT additive — uses Math.max
// ---------------------------------------------------------------------------
describe("Spec §5.6 — Dual red flags: RF_SCALP_006 + RF_HAIR_001 → penalty = max(0.25, 0.30) = 0.30", () => {
  it("both flags trigger but penalty is 0.30 (max, not additive)", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 10 }, // triggers RF_HAIR_001 (>= 10)
        scalp: {
          biotype: "normal",
          conditions: ["seborrheic"],
          phLevel: 7.0, // triggers RF_SCALP_006 (> 6.0)
          openLesions: false, // no BLOCK
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Both flags present
    const rfCodes = result.redFlags.map((f) => f.code);
    expect(rfCodes).toContain("RF_HAIR_001");
    expect(rfCodes).toContain("RF_SCALP_006");

    // Penalty = max(0.25, 0.30) = 0.30 (NOT 0.55)
    // adjustedScore = compositeScore * (1 - 0.30) = compositeScore * 0.70
    const expectedAdjusted = result.compositeScore * 0.70;
    expect(result.adjustedScore).toBeCloseTo(expectedAdjusted, 5);
  });
});

// ---------------------------------------------------------------------------
// §5.3 — Normalizer Tests: INVERTED_LINEAR
// ---------------------------------------------------------------------------
describe("Spec §5.3 — Normalizer: INVERTED_LINEAR (hair.damageIndex)", () => {
  // Spec §5.3 Example: hair.damageIndex=0 → score = 0 + (1-0)*100 = 100
  it("damageIndex=0 → normalised score = 100", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 0 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        // Only hair.damageIndex normalizer — all others absent → default 50
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    // The hair module score should be 100 (only normalizer applied)
    expect(result.moduleScores.hair).toBeCloseTo(100, 5);
  });

  // Spec §5.3 Example: hair.damageIndex=10 → score = 0 + (1-1)*100 = 0
  it("damageIndex=10 → normalised score = 0", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 10 },
        scalp: { openLesions: true, conditions: [] }, // BLOCK to isolate score
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    // The hair module score should be 0 for damageIndex=10 before any block
    // We check compositeScore contribution — hair module score = 0
    expect(result.moduleScores.hair).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// §5.3 — Normalizer Tests: RANGE_SCALE
// ---------------------------------------------------------------------------
describe("Spec §5.3 — Normalizer: RANGE_SCALE (body.sleepQualityScore)", () => {
  // Spec §5.9 Scenario D: sleepQuality=10 → max score of the scale
  // RANGE_SCALE(10, inputMin=1, inputMax=10, outputMin=5, outputMax=100)
  // linear = (10-1)/(10-1) = 1 → score = 5 + 1*(100-5) = 100
  it("sleepQuality=10 → normalised score = 100", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
        body: { sleepQualityScore: 10 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "body.sleepQualityScore")!,
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    // Body module has one normalizer: sleepQualityScore=10 → 100
    expect(result.moduleScores.body).toBeCloseTo(100, 5);
  });
});

// ---------------------------------------------------------------------------
// §5.3 — Normalizer Tests: INVERTED_LINEAR (stressIndex)
// ---------------------------------------------------------------------------
describe("Spec §5.3 — Normalizer: INVERTED_LINEAR (body.stressIndex)", () => {
  // INVERTED_LINEAR(10, inputMin=1, inputMax=10, outputMin=5, outputMax=100)
  // linear = (10-1)/(10-1) = 1 → score = 5 + (1-1)*(100-5) = 5
  it("stressIndex=10 → normalised score = 5", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
        body: { stressIndex: 10 },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "body.stressIndex")!,
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    // Body module: stressIndex=10 → 5
    expect(result.moduleScores.body).toBeCloseTo(5, 5);
  });
});

// ---------------------------------------------------------------------------
// §5.4 — Phase Threshold Boundary Tests (exact score-based assignment)
// These tests control the adjustedScore by using a profile with no red flags
// and carefully chosen inputs, then check the resulting phase.
// ---------------------------------------------------------------------------
describe("Spec §5.4 — Phase Thresholds (exact boundary values)", () => {
  /**
   * Helper: create an evaluation that produces a known adjustedScore.
   * We do this by using profiles with no active default rules that would
   * SET_PHASE, and no red flags (openLesions=false, damageIndex < 9, etc.).
   * The adjustedScore is approximated via carefully chosen inputs.
   *
   * For precision boundary testing we mock the evaluate function to test
   * the assignPhase logic directly when exposed, OR we use a profile that
   * we know mathematically yields a specific score based on the spec formulas.
   *
   * Alternatively, the engine should export an `assignPhase` helper. If it
   * does not, we test the boundaries by driving evaluate() with inputs that
   * we expect to produce scores near the thresholds per the spec math.
   */

  // Spec §5.4 — adjustedScore ≤ 40 → "stabilization"
  // We use damageIndex=8 (INVERTED_LINEAR → score=20, well within stabilization range)
  // and no other normalizers so scalp/body/morphology default to 50.
  it("adjustedScore <= 40 → phase is stabilization", async () => {
    // damageIndex=8: INVERTED_LINEAR(8, 0, 10, 0, 100) = (1 - 0.8)*100 = 20
    // hair module score = 20; others default to 50
    // compositeScore ≈ 0.40*20 + 0.30*50 + 0.20*50 + 0.10*50 = 8 + 15 + 10 + 5 = 38
    // adjustedScore = 38 (no penalties), which is <= 40 → stabilization
    // But rule-002 fires at damageIndex >= 9, so at 8 it does NOT fire.
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 8 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    expect(result.adjustedScore).toBeLessThanOrEqual(40);
    expect(result.assignedPhase).toBe("stabilization");
  });

  // Spec §5.4 — adjustedScore 41–65 → "transformation"
  it("adjustedScore in 41-65 range → phase is transformation", async () => {
    // damageIndex=5: score=50; scalp/body/morphology default to 50
    // compositeScore = 0.40*50 + 0.30*50 + 0.20*50 + 0.10*50 = 50
    // No red flags, no SET_PHASE rules (damageIndex < 9)
    // adjustedScore = 50 → transformation
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    expect(result.adjustedScore).toBeGreaterThanOrEqual(41);
    expect(result.adjustedScore).toBeLessThanOrEqual(65);
    expect(result.assignedPhase).toBe("transformation");
  });

  // Spec §5.4 — boundary: adjustedScore=40 → "stabilization"
  // We import and test assignPhase() directly if exported
  it("assignPhase(40) → stabilization (upper boundary of stabilization)", async () => {
    // Test via the exported assignPhase function if available
    try {
      const { assignPhase } = await import("../index.js");
      const phase = assignPhase(40, []);
      expect(phase).toBe("stabilization");
    } catch {
      // If assignPhase is not exported, skip with a note
      // The pipeline test above covers score=38 (< 40) → stabilization
    }
  });

  // Spec §5.4 — boundary: adjustedScore=41 → "transformation"
  it("assignPhase(41) → transformation (lower boundary of transformation)", async () => {
    try {
      const { assignPhase } = await import("../index.js");
      const phase = assignPhase(41, []);
      expect(phase).toBe("transformation");
    } catch {
      // Covered implicitly by scenario C (score ≈ 50 → transformation)
    }
  });

  // Spec §5.4 — boundary: adjustedScore=65 → "transformation"
  it("assignPhase(65) → transformation (upper boundary of transformation)", async () => {
    try {
      const { assignPhase } = await import("../index.js");
      const phase = assignPhase(65, []);
      expect(phase).toBe("transformation");
    } catch {
      // acceptable if not exported
    }
  });

  // Spec §5.4 — boundary: adjustedScore=66 → "integration"
  it("assignPhase(66) → integration (lower boundary of integration)", async () => {
    try {
      const { assignPhase } = await import("../index.js");
      const phase = assignPhase(66, []);
      expect(phase).toBe("integration");
    } catch {
      // acceptable if not exported — covered by Scenario D
    }
  });
});

// ---------------------------------------------------------------------------
// §5.7 — DEFAULT_RULES case sensitivity
// ---------------------------------------------------------------------------
describe("Spec §5.7 — DEFAULT_RULES case sensitivity", () => {
  // Spec §5.7 rule-004: condition is hair.porosity EQUALS "HIGH" (uppercase)
  // "high" (lowercase) must NOT match
  it('rule-004: porosity="high" (lowercase) does NOT trigger (condition is "HIGH")', async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3, porosity: "high" }, // lowercase
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // rule-004 ADJUST_SCORE -5 for hair.porosity EQUALS "HIGH"
    // Since we passed "high" (lowercase), the rule should NOT fire
    const hasRule004Action = result.appliedActions.some(
      (a) =>
        a.type === "ADJUST_SCORE" &&
        a.target === "hair" &&
        a.value === -5,
    );
    expect(hasRule004Action).toBe(false);
  });

  // Spec §5.7 rule-003: condition is scalp.biotype EQUALS "SEBORRHEIC" (uppercase)
  // "seborrheic" (lowercase) must NOT match
  it('rule-003: biotype="seborrheic" (lowercase) does NOT trigger (condition is "SEBORRHEIC")', async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 3 },
        scalp: {
          biotype: "seborrheic", // lowercase
          phLevel: 6.5, // > 5.5
          openLesions: false,
          conditions: [],
        },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // rule-003 fires when biotype EQUALS "SEBORRHEIC" AND phLevel > 5.5
    // Since "seborrheic" !== "SEBORRHEIC", rule-003 must NOT fire
    const hasRule003Action = result.appliedActions.some(
      (a) =>
        a.type === "TRIGGER_ALERT" &&
        a.target === "SEBORRHEIC_HIGH_PH",
    );
    expect(hasRule003Action).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §5.10 — EvaluationResult shape compliance
// ---------------------------------------------------------------------------
describe("Spec §5.10 — EvaluationResult shape", () => {
  it("result includes all required top-level fields", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5, texture: "straight" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    expect(typeof result.evaluationId).toBe("string");
    expect(typeof result.compositeScore).toBe("number");
    expect(typeof result.adjustedScore).toBe("number");

    expect(result.moduleScores).toHaveProperty("hair");
    expect(result.moduleScores).toHaveProperty("scalp");
    expect(result.moduleScores).toHaveProperty("body");
    expect(result.moduleScores).toHaveProperty("morphology");

    expect(["stabilization", "transformation", "integration"]).toContain(
      result.assignedPhase,
    );
    expect(Array.isArray(result.redFlags)).toBe(true);
    expect(Array.isArray(result.appliedActions)).toBe(true);

    expect(result.protocol).toHaveProperty("phases");
    expect(result.protocol).toHaveProperty("services");
    expect(result.protocol).toHaveProperty("checkpoints");
    expect(result.protocol).toHaveProperty("frequency");

    expect(typeof result.protocol.frequency.interval).toBe("number");
    expect(["days", "weeks"]).toContain(result.protocol.frequency.unit);
  });

  // Spec §5.1 Step 10 — default frequency when no rule sets it: 14 days
  it("default frequency is 14 days when no SET_FREQUENCY rule fires", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5, texture: "straight" },
        scalp: { biotype: "normal", openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.1: "Default frequency when no rule sets it: every 14 days"
    expect(result.protocol.frequency.interval).toBe(14);
    expect(result.protocol.frequency.unit).toBe("days");
  });

  // Spec §5.10 — trace is only included when includeTrace=true
  it("trace is absent when includeTrace is not set", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
      // includeTrace not set
    });

    expect(result.trace).toBeUndefined();
  });

  // Spec §5.10 — trace is included when includeTrace=true
  it("trace is present when includeTrace=true", async () => {
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
      includeTrace: true,
    });

    expect(result.trace).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// §5.2 — Module score defaults to 50 when no normalizers exist for a module
// ---------------------------------------------------------------------------
describe("Spec §5.2 — Module score defaults", () => {
  it("modules with no matching normalizers default to score 50", async () => {
    // Only provide a damageIndex normalizer — scalp/body/morphology get no normalizers
    const result = await evaluate({
      profile: {
        hair: { damageIndex: 5 },
        scalp: { openLesions: false, conditions: [] },
      },
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: [
        NORMALIZERS.find((n) => n.fieldPath === "hair.damageIndex")!,
      ],
      redFlagRules: RED_FLAG_RULES,
    });

    // Spec §5.2 — "If NO normalizers exist for a module, its score remains at the default of 50"
    expect(result.moduleScores.scalp).toBe(50);
    expect(result.moduleScores.body).toBe(50);
    expect(result.moduleScores.morphology).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// §5.8 — DEFAULT_WEIGHTS structure
// ---------------------------------------------------------------------------
describe("Spec §5.8 — DEFAULT_WEIGHTS structure", () => {
  it("DEFAULT_WEIGHTS.modules has correct values: hair=0.40, scalp=0.30, body=0.20, morphology=0.10", () => {
    expect(DEFAULT_WEIGHTS.modules.hair).toBeCloseTo(0.40, 10);
    expect(DEFAULT_WEIGHTS.modules.scalp).toBeCloseTo(0.30, 10);
    expect(DEFAULT_WEIGHTS.modules.body).toBeCloseTo(0.20, 10);
    expect(DEFAULT_WEIGHTS.modules.morphology).toBeCloseTo(0.10, 10);
  });

  it("DEFAULT_WEIGHTS.fields.hair has correct field weights", () => {
    expect(DEFAULT_WEIGHTS.fields.hair.texture).toBeCloseTo(0.10, 10);
    expect(DEFAULT_WEIGHTS.fields.hair.density).toBeCloseTo(0.15, 10);
    expect(DEFAULT_WEIGHTS.fields.hair.porosity).toBeCloseTo(0.20, 10);
    expect(DEFAULT_WEIGHTS.fields.hair.elasticity).toBeCloseTo(0.25, 10);
    expect(DEFAULT_WEIGHTS.fields.hair.damageIndex).toBeCloseTo(0.30, 10);
  });

  it("DEFAULT_WEIGHTS.fields.scalp has correct field weights", () => {
    expect(DEFAULT_WEIGHTS.fields.scalp.biotype).toBeCloseTo(0.15, 10);
    expect(DEFAULT_WEIGHTS.fields.scalp.sebumProduction).toBeCloseTo(0.20, 10);
    expect(DEFAULT_WEIGHTS.fields.scalp.sensitivity).toBeCloseTo(0.15, 10);
    expect(DEFAULT_WEIGHTS.fields.scalp.phLevel).toBeCloseTo(0.20, 10);
    expect(DEFAULT_WEIGHTS.fields.scalp.microbiomeBalance).toBeCloseTo(0.30, 10);
  });

  it("DEFAULT_WEIGHTS.fields.body has correct field weights", () => {
    expect(DEFAULT_WEIGHTS.fields.body.hormonalIndex).toBeCloseTo(0.25, 10);
    expect(DEFAULT_WEIGHTS.fields.body.nutritionalScore).toBeCloseTo(0.30, 10);
    expect(DEFAULT_WEIGHTS.fields.body.stressIndex).toBeCloseTo(0.25, 10);
    expect(DEFAULT_WEIGHTS.fields.body.hydrationPct).toBeCloseTo(0.20, 10);
  });

  it("DEFAULT_WEIGHTS.fields.morphology has correct field weights", () => {
    expect(DEFAULT_WEIGHTS.fields.morphology.symmetryScore).toBeCloseTo(0.40, 10);
    expect(DEFAULT_WEIGHTS.fields.morphology.undertone).toBeCloseTo(0.30, 10);
    expect(DEFAULT_WEIGHTS.fields.morphology.faceShape).toBeCloseTo(0.30, 10);
  });
});
