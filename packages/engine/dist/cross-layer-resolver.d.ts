/**
 * Cross-Layer Resolver
 *
 * Resolves conflicts between layer recommendations using a strict priority order:
 *   1. Face Morphology (highest)
 *   2. Hair Structure
 *   3. Body Morphology
 *   4. Color Identity
 *   5. Archetype Identity
 *   6. Scalp Condition (lowest)
 *
 * When Layer A says "avoid X" and Layer B says "recommend X", the higher
 * priority layer wins. All conflicts are recorded in conflictResolution[].
 */
import type { HairDesign, ColorStrategy, ArchetypeBlend, TransformationBlueprintOutput, PhaseType, RedFlag } from "./types.js";
import type { ArchetypeStyleProfile } from "./rules/archetype-rules.js";
import type { BodyStyleModifiers } from "./rules/body-morphology-rules.js";
export interface LayerDecisions {
    faceMorphology: HairDesign | null;
    bodyMorphology: BodyStyleModifiers | null;
    colorStrategy: ColorStrategy | null;
    archetypeStyle: ArchetypeStyleProfile | null;
    archetypeBlend: ArchetypeBlend;
    redFlags: RedFlag[];
    assignedPhase: PhaseType;
    analysisScore: number;
}
/**
 * Merges all layer decisions into a single TransformationBlueprintOutput.
 * Higher-priority layers override lower-priority ones on conflicts.
 */
export declare function resolveLayers(decisions: LayerDecisions): TransformationBlueprintOutput;
//# sourceMappingURL=cross-layer-resolver.d.ts.map