import { describe, it, expect } from "vitest";
import { computeModuleScores, computeCompositeScore } from "../scorer.js";
import type { WeightConfig, FieldNormalizer } from "../types.js";

const WEIGHTS: WeightConfig = {
  modules: { hair: 0.40, scalp: 0.30, body: 0.20, morphology: 0.10 },
  fields: {
    hair: { damageIndex: 0.40, elasticity: 0.30, porosity: 0.20, density: 0.10 },
    scalp: { phLevel: 0.30, sebumProduction: 0.30, sensitivity: 0.20, microbiomeBalance: 0.20 },
    body: { nutritionalScore: 0.30, stressIndex: 0.30, hormonalIndex: 0.20, hydrationPct: 0.20 },
    morphology: { symmetryScore: 0.60, undertone: 0.20, faceShape: 0.20 },
  },
};

const NORMALIZERS: FieldNormalizer[] = [
  { fieldPath: "hair.damageIndex", type: "INVERTED_LINEAR", inputMin: 0, inputMax: 10, outputMin: 0, outputMax: 100 },
  { fieldPath: "scalp.phLevel", type: "RANGE_SCALE", optimalMin: 4.5, optimalMax: 5.5, inputMin: 3, inputMax: 9, outputMin: 0, outputMax: 100 },
  { fieldPath: "body.nutritionalScore", type: "RANGE_SCALE", optimalMin: 7, optimalMax: 10, inputMin: 0, inputMax: 10, outputMin: 0, outputMax: 100 },
  { fieldPath: "morphology.symmetryScore", type: "RANGE_SCALE", optimalMin: 70, optimalMax: 100, inputMin: 0, inputMax: 100, outputMin: 0, outputMax: 100 },
];

const HEALTHY_PROFILE = {
  hair: { damageIndex: 1, elasticity: "EXCELLENT", porosity: "NORMAL", density: "THICK" },
  scalp: { phLevel: 4.8, sebumProduction: 5, sensitivity: 2, microbiomeBalance: 9 },
  body: { nutritionalScore: 9, stressIndex: 2, hormonalIndex: 2, hydrationPct: 80 },
  morphology: { symmetryScore: 85, undertone: "NEUTRAL", faceShape: "OVAL" },
};

const DAMAGED_PROFILE = {
  ...HEALTHY_PROFILE,
  hair: { damageIndex: 9, elasticity: "POOR", porosity: "HIGH", density: "FINE" },
};

describe("computeModuleScores", () => {
  it("returns numeric scores for all modules", () => {
    const scores = computeModuleScores(HEALTHY_PROFILE as any, NORMALIZERS, WEIGHTS);
    expect(scores).toHaveProperty("hair");
    expect(scores).toHaveProperty("scalp");
    expect(scores.hair).toBeGreaterThanOrEqual(0);
    expect(scores.hair).toBeLessThanOrEqual(100);
  });
});

describe("computeCompositeScore", () => {
  it("returns a score between 0 and 100", () => {
    const scores = computeModuleScores(HEALTHY_PROFILE as any, NORMALIZERS, WEIGHTS);
    const composite = computeCompositeScore(scores, WEIGHTS.modules);
    expect(composite).toBeGreaterThanOrEqual(0);
    expect(composite).toBeLessThanOrEqual(100);
  });

  it("healthy profile scores higher than damaged profile", () => {
    const healthyScores = computeModuleScores(HEALTHY_PROFILE as any, NORMALIZERS, WEIGHTS);
    const damagedScores = computeModuleScores(DAMAGED_PROFILE as any, NORMALIZERS, WEIGHTS);
    const healthyComposite = computeCompositeScore(healthyScores, WEIGHTS.modules);
    const damagedComposite = computeCompositeScore(damagedScores, WEIGHTS.modules);
    expect(healthyComposite).toBeGreaterThan(damagedComposite);
  });
});
