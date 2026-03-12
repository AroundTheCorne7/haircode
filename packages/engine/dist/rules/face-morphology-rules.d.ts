/**
 * Face Morphology Rules — Layer 1 (highest priority)
 *
 * Maps each face shape to recommended/forbidden hair lengths and shapes.
 * Rules are applied first; body morphology can further refine (layer 3).
 *
 * Lengths: pixie | ear | chin | shoulder | collarbone | mid-back | waist
 * Shapes:  blunt | layered | textured | graduated | asymmetric | rounded | angular
 *
 * ## 3D Visagism — Directional Flow (НЕБЕ / БАЛАНС / ЗЕМЯ)
 * From consultant training material (BeautyPlace.bg):
 *   sky     (НЕБЕ)   — upward V movement; creates height & elongation
 *   balance (БАЛАНС) — vertical parallel lines; neutral
 *   earth   (ЗЕМЯ)   — downward A movement; softens wide upper third
 *
 * Light tones CREATE volume | Dark tones REDUCE volume
 */
import type { FaceShapeType, HairDesign } from "../types.js";
/** Directional flow from the 3D Visagism system */
export type DirectionalFlow = "sky" | "balance" | "earth";
export interface FaceMorphologyInput {
    faceShape: FaceShapeType;
    neckLength?: "short" | "medium" | "long";
    shoulders?: "narrow" | "balanced" | "wide";
}
/**
 * Directional flow per face shape:
 * - sky     → round, rectangular, square  (need upward/elongating movement)
 * - earth   → heart, diamond              (wider top; draw eye downward/outward)
 * - balance → oval                        (naturally proportioned)
 *
 * Practical colour placement rule:
 * Place LIGHT tones in the direction of the flow to amplify movement;
 * use DARK tones opposite to recede unwanted width or length.
 */
export declare const FACE_DIRECTIONAL_FLOW: Record<FaceShapeType, DirectionalFlow>;
/**
 * Evaluates face morphology and returns a HairDesign with all recommendations.
 * Returns null when faceShape is missing or unrecognised.
 */
export declare function evaluateFaceMorphology(input: FaceMorphologyInput): HairDesign | null;
//# sourceMappingURL=face-morphology-rules.d.ts.map