/**
 * Design Engine — orchestrates the 6-layer methodology to produce a
 * TransformationBlueprintOutput from a ClientProfile.
 *
 * Called by the main evaluate() function after the Analysis Engine
 * completes its scoring pipeline (steps 1–9).
 *
 * Requires at minimum: profile.morphology.faceShape
 * Enriched by: profile.color (season, contrastScore), profile.archetype (primary, primaryWeight)
 */
import type { ClientProfile, PhaseType, RedFlag, TransformationBlueprintOutput } from "./types.js";
/**
 * Runs the full Design Engine and returns a TransformationBlueprint.
 * Called when at least morphology data is available.
 * Returns null if no design-relevant data is present at all.
 */
export declare function runDesignEngine(profile: ClientProfile, assignedPhase: PhaseType, analysisScore: number, redFlags: RedFlag[]): TransformationBlueprintOutput | null;
//# sourceMappingURL=design-engine.d.ts.map