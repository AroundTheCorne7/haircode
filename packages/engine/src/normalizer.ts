import type { FieldNormalizer } from "./types.js";

export function normalizeField(
  value: unknown,
  normalizer: FieldNormalizer
): number {
  switch (normalizer.type) {
    case "ENUM_MAP": {
      if (typeof value !== "string" || !normalizer.map) return 50;
      return normalizer.map[value] ?? 50;
    }
    case "RANGE_SCALE": {
      if (typeof value !== "number" || !isFinite(value)) return 50;
      const min = normalizer.inputMin ?? 0;
      const max = normalizer.inputMax ?? 100;
      const outMin = normalizer.outputMin ?? 0;
      const outMax = normalizer.outputMax ?? 100;
      if (max === min) return (outMin + outMax) / 2;
      const clamped = Math.max(min, Math.min(max, value));
      return outMin + ((clamped - min) / (max - min)) * (outMax - outMin);
    }
    case "INVERTED_LINEAR": {
      if (typeof value !== "number" || !isFinite(value)) return 50;
      const min = normalizer.inputMin ?? 0;
      const max = normalizer.inputMax ?? 100;
      const outMin = normalizer.outputMin ?? 0;
      const outMax = normalizer.outputMax ?? 100;
      if (max === min) return (outMin + outMax) / 2;
      const clamped = Math.max(min, Math.min(max, value));
      const linear = (clamped - min) / (max - min);
      return outMin + (1 - linear) * (outMax - outMin);
    }
    case "BOOLEAN_SCORE": {
      return value === true ? 100 : 0;
    }
    default:
      return 50;
  }
}
