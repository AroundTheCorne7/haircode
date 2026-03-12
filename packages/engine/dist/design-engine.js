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
import { evaluateFaceMorphology, } from "./rules/face-morphology-rules.js";
import { evaluateBodyMorphology, } from "./rules/body-morphology-rules.js";
import { evaluateColorIdentity, } from "./rules/color-season-rules.js";
import { resolveArchetypeStyle } from "./rules/archetype-rules.js";
import { resolveLayers } from "./cross-layer-resolver.js";
/**
 * Runs the full Design Engine and returns a TransformationBlueprint.
 * Called when at least morphology data is available.
 * Returns null if no design-relevant data is present at all.
 */
export function runDesignEngine(profile, assignedPhase, analysisScore, redFlags) {
    const { morphology, color, archetype } = profile;
    // Require at least morphology to produce a meaningful blueprint
    if (!morphology)
        return null;
    // ── Layer 1: Face Morphology ───────────────────────────────────────────────
    const neckLengthFace = morphology.neckLength;
    const shouldersFace = morphology.shoulders;
    const faceMorphInput = {
        faceShape: morphology.faceShape ?? "oval",
        ...(neckLengthFace != null ? { neckLength: neckLengthFace } : {}),
        ...(shouldersFace != null ? { shoulders: shouldersFace } : {}),
    };
    const faceMorphResult = evaluateFaceMorphology(faceMorphInput);
    // ── Layer 3: Body Morphology ───────────────────────────────────────────────
    const shouldersBody = morphology.shoulders;
    const neckLengthBody = morphology.neckLength;
    const bodyMorphInput = {
        bodyType: morphology.bodyType ?? "hourglass",
        ...(shouldersBody != null ? { shoulders: shouldersBody } : {}),
        ...(neckLengthBody != null ? { neckLength: neckLengthBody } : {}),
    };
    const bodyMorphResult = evaluateBodyMorphology(bodyMorphInput);
    // ── Layer 4: Color Identity ────────────────────────────────────────────────
    let colorStrategyResult = null;
    if (color?.colorSeason) {
        const naturalHairColor = color.naturalHairColor;
        const colorInput = {
            colorSeason: color.colorSeason,
            contrastScore: color.contrastScore ?? 3,
            undertone: color.undertone ?? "neutral",
            ...(naturalHairColor != null ? { naturalHairColor } : {}),
        };
        colorStrategyResult = evaluateColorIdentity(colorInput);
    }
    // ── Layer 5: Archetype Identity ────────────────────────────────────────────
    const secondaryArchetype = archetype?.secondaryArchetype;
    const secondaryWeight = archetype?.secondaryWeight;
    const archetypeBlend = archetype
        ? {
            primary: archetype.primaryArchetype ?? "natural",
            primaryWeight: archetype.primaryWeight ?? 100,
            ...(secondaryArchetype != null
                ? { secondary: secondaryArchetype }
                : {}),
            ...(secondaryWeight != null ? { secondaryWeight } : {}),
        }
        : { primary: "natural", primaryWeight: 100 };
    const archetypeStyle = resolveArchetypeStyle(archetypeBlend);
    // ── Cross-Layer Resolver: merge all decisions ──────────────────────────────
    const blueprint = resolveLayers({
        faceMorphology: faceMorphResult,
        bodyMorphology: bodyMorphResult,
        colorStrategy: colorStrategyResult,
        archetypeStyle,
        archetypeBlend,
        redFlags,
        assignedPhase,
        analysisScore,
    });
    return blueprint;
}
//# sourceMappingURL=design-engine.js.map