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

import type {
  ClientProfile,
  PhaseType,
  RedFlag,
  TransformationBlueprintOutput,
  ArchetypeBlend,
  ArchetypeType,
  ColorSeason,
  ContrastScore,
  FaceShapeType,
  BodyType,
} from "./types.js";
import {
  evaluateFaceMorphology,
  type FaceMorphologyInput,
} from "./rules/face-morphology-rules.js";
import {
  evaluateBodyMorphology,
  type BodyMorphologyInput,
} from "./rules/body-morphology-rules.js";
import {
  evaluateColorIdentity,
  type ColorIdentityInput,
} from "./rules/color-season-rules.js";
import { resolveArchetypeStyle } from "./rules/archetype-rules.js";
import { resolveLayers } from "./cross-layer-resolver.js";

/**
 * Runs the full Design Engine and returns a TransformationBlueprint.
 * Called when at least morphology data is available.
 * Returns null if no design-relevant data is present at all.
 */
export function runDesignEngine(
  profile: ClientProfile,
  assignedPhase: PhaseType,
  analysisScore: number,
  redFlags: RedFlag[],
): TransformationBlueprintOutput | null {
  const { morphology, color, archetype } = profile;

  // Require at least morphology to produce a meaningful blueprint
  if (!morphology) return null;

  // ── Layer 1: Face Morphology ───────────────────────────────────────────────
  const neckLengthFace = morphology.neckLength as
    | "short"
    | "medium"
    | "long"
    | undefined;
  const shouldersFace = morphology.shoulders as
    | "narrow"
    | "balanced"
    | "wide"
    | undefined;
  const faceMorphInput: FaceMorphologyInput = {
    faceShape: (morphology.faceShape as FaceShapeType) ?? "oval",
    ...(neckLengthFace != null ? { neckLength: neckLengthFace } : {}),
    ...(shouldersFace != null ? { shoulders: shouldersFace } : {}),
  };
  const faceMorphResult = evaluateFaceMorphology(faceMorphInput);

  // ── Layer 3: Body Morphology ───────────────────────────────────────────────
  const shouldersBody = morphology.shoulders as
    | "narrow"
    | "balanced"
    | "wide"
    | undefined;
  const neckLengthBody = morphology.neckLength as
    | "short"
    | "medium"
    | "long"
    | undefined;
  const bodyMorphInput: BodyMorphologyInput = {
    bodyType: (morphology.bodyType as BodyType) ?? "hourglass",
    ...(shouldersBody != null ? { shoulders: shouldersBody } : {}),
    ...(neckLengthBody != null ? { neckLength: neckLengthBody } : {}),
  };
  const bodyMorphResult = evaluateBodyMorphology(bodyMorphInput);

  // ── Layer 4: Color Identity ────────────────────────────────────────────────
  let colorStrategyResult = null;
  if (color?.colorSeason) {
    const naturalHairColor = color.naturalHairColor as string | undefined;
    const colorInput: ColorIdentityInput = {
      colorSeason: color.colorSeason as ColorSeason,
      contrastScore: (color.contrastScore as ContrastScore) ?? 3,
      undertone: (color.undertone as "warm" | "neutral" | "cool") ?? "neutral",
      ...(naturalHairColor != null ? { naturalHairColor } : {}),
    };
    colorStrategyResult = evaluateColorIdentity(colorInput);
  }

  // ── Layer 5: Archetype Identity ────────────────────────────────────────────
  const secondaryArchetype = archetype?.secondaryArchetype as
    | ArchetypeType
    | undefined;
  const secondaryWeight = archetype?.secondaryWeight as number | undefined;
  const archetypeBlend: ArchetypeBlend = archetype
    ? {
        primary: (archetype.primaryArchetype as ArchetypeType) ?? "natural",
        primaryWeight: (archetype.primaryWeight as number) ?? 100,
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
