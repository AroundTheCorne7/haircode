import type { ClientProfile, FieldNormalizer, WeightConfig, ModuleScores } from "./types.js";
import { normalizeField } from "./normalizer.js";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function computeModuleScores(
  profile: ClientProfile,
  normalizers: FieldNormalizer[],
  weights: WeightConfig
): ModuleScores {
  const moduleKeys = ["hair", "scalp", "body", "morphology"] as const;
  const scores: ModuleScores = { hair: 50, scalp: 50, body: 50, morphology: 50 };

  for (const module of moduleKeys) {
    const moduleData = profile[module] ?? {};
    const fieldWeights = weights.fields[module] ?? {};
    const moduleNormalizers = normalizers.filter((n) => n.fieldPath.startsWith(`${module}.`));

    if (moduleNormalizers.length === 0) continue;

    // Spec §5.3 — "fields absent from the profile default to 50".
    // For every normalizer in the provided normalizers array:
    //   • If the field has a value  → normalise and weight it.
    //   • If the field is absent    → substitute a neutral score of 50.
    // This prevents a single healthy field (e.g. biotype=normal:90) from
    // inflating the module score when the rest of the profile is missing.
    // The denominator is always the sum of the weights of all normalizers
    // present in the array, so the ratio is preserved correctly.
    let weightedSum = 0;
    let totalWeight = 0;

    for (const normalizer of moduleNormalizers) {
      const fieldName = normalizer.fieldPath.split(".").slice(1).join(".");
      const weight = fieldWeights[fieldName] ?? 1;
      const rawValue = getNestedValue(moduleData as Record<string, unknown>, fieldName);

      if (rawValue === undefined || rawValue === null) {
        // Field absent — substitute neutral 50 so the weight still anchors the denominator
        weightedSum += 50 * weight;
      } else {
        const score = normalizeField(rawValue, normalizer);
        weightedSum += score * weight;
      }
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      scores[module] = weightedSum / totalWeight;
    }
  }

  return scores;
}

export function computeCompositeScore(
  moduleScores: ModuleScores,
  moduleWeights: Record<string, number>
): number {
  let total = 0;
  let weightSum = 0;

  for (const [module, score] of Object.entries(moduleScores)) {
    const weight = moduleWeights[module] ?? 0;
    total += score * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? total / weightSum : 50;
}
