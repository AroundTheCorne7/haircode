/**
 * Color Season Rules — Layer 4
 *
 * Maps each colour season + contrast score to recommended techniques and tones.
 * Based on the classic 4-season system: Spring | Summer | Autumn | Winter.
 * Contrast score 1–5 (1=very_low → 5=extreme) refines technique selection.
 */
import type { ColorSeason, ColorStrategy, ContrastScore } from "../types.js";
export interface ColorIdentityInput {
    colorSeason: ColorSeason;
    contrastScore: ContrastScore;
    undertone: "warm" | "neutral" | "cool";
    naturalHairColor?: string;
}
/**
 * Evaluates colour identity and returns a ColorStrategy.
 * Returns null when colorSeason is missing or unrecognised.
 */
export declare function evaluateColorIdentity(input: ColorIdentityInput): ColorStrategy | null;
//# sourceMappingURL=color-season-rules.d.ts.map