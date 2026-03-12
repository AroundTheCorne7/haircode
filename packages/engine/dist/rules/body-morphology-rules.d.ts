/**
 * Body Morphology Rules — Layer 3
 *
 * Adjusts hair length and volume recommendations based on body proportions.
 * Priority is lower than face morphology (Layer 1) — body rules refine,
 * they do not override face shape decisions.
 */
import type { BodyType } from "../types.js";
export interface BodyMorphologyInput {
    bodyType: BodyType;
    shoulders?: "narrow" | "balanced" | "wide";
    neckLength?: "short" | "medium" | "long";
}
export interface BodyStyleModifiers {
    lengthBias: string[];
    forbiddenLengths: string[];
    volumeBias: string[];
    forbiddenVolume: string[];
    rationale: string;
}
/**
 * Evaluates body morphology and returns style modifiers.
 * These are applied after face morphology rules by the cross-layer resolver.
 */
export declare function evaluateBodyMorphology(input: BodyMorphologyInput): BodyStyleModifiers | null;
//# sourceMappingURL=body-morphology-rules.d.ts.map