import type { ClientProfile, FieldNormalizer, WeightConfig, ModuleScores } from "./types.js";
export declare function computeModuleScores(profile: ClientProfile, normalizers: FieldNormalizer[], weights: WeightConfig): ModuleScores;
export declare function computeCompositeScore(moduleScores: ModuleScores, moduleWeights: Record<string, number>): number;
//# sourceMappingURL=scorer.d.ts.map