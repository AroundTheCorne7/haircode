/**
 * Color Season Rules — Layer 4
 *
 * Maps each colour season + contrast score to recommended techniques and tones.
 * Based on the classic 4-season system: Spring | Summer | Autumn | Winter.
 * Contrast score 1–5 (1=very_low → 5=extreme) refines technique selection.
 */
const SEASON_BASE = {
    spring: {
        recommendedTones: [
            "warm golden blonde",
            "strawberry blonde",
            "peach highlights",
            "caramel",
            "copper",
            "warm honey",
        ],
        avoidTones: ["ash blonde", "cool platinum", "blue-black", "cool burgundy"],
        baseTechniques: [
            "balayage",
            "babylights",
            "face-framing highlights",
            "toning with warm gloss",
        ],
        avoidTechniques: ["cool ash toning", "full-head bleach to platinum"],
        contraindications: ["avoid metallic cool tones — they dull the complexion"],
    },
    summer: {
        recommendedTones: [
            "ash blonde",
            "cool beige blonde",
            "dusty rose",
            "soft platinum",
            "cool brown",
            "mushroom blonde",
        ],
        avoidTones: [
            "warm copper",
            "golden honey",
            "bright orange-red",
            "warm caramel",
        ],
        baseTechniques: [
            "foilyage",
            "cool toning gloss",
            "baby highlights",
            "root smudge",
        ],
        avoidTechniques: ["warm balayage", "coppering"],
        contraindications: [
            "avoid warm/orange undertones — they clash with cool skin",
        ],
    },
    autumn: {
        recommendedTones: [
            "auburn",
            "rich copper",
            "mahogany",
            "warm chestnut",
            "burnt sienna",
            "golden brown",
            "deep red",
        ],
        avoidTones: ["platinum", "ash blonde", "cool grey", "icy highlights"],
        baseTechniques: [
            "balayage",
            "colour melting",
            "gloss treatment (warm)",
            "highlight + tone",
        ],
        avoidTechniques: ["bleach to platinum", "cool toning"],
        contraindications: [
            "avoid lifting to very light levels — warm tones require depth",
        ],
    },
    winter: {
        recommendedTones: [
            "blue-black",
            "cool dark brown",
            "cool dark red",
            "espresso",
            "icy platinum",
            "bright white",
            "vivid cool tones",
        ],
        avoidTones: ["warm golden blonde", "copper", "caramel", "warm brown"],
        baseTechniques: [
            "full bleach + cool toner",
            "vivid colour",
            "sleek blowout gloss",
            "colour blocking",
        ],
        avoidTechniques: ["warm balayage", "honey toning"],
        contraindications: [
            "avoid mid-level warm tones — they look muddy against cool deep skin",
        ],
    },
};
/**
 * Contrast score modifies the number and placement of techniques:
 * 1 (very low) → minimal contrast, soft blending, no bold placement
 * 5 (extreme)  → maximum contrast allowed, bold placements, vivid colour ok
 */
function applyContrastModifiers(base, contrastScore) {
    const techniques = [...base.baseTechniques];
    const avoid = [...base.avoidTechniques];
    if (contrastScore <= 2) {
        techniques.push("root shadow", "shadow root", "soft root blend");
        avoid.push("high-contrast highlighting", "chunky highlights", "bold colour blocking");
    }
    else if (contrastScore === 3) {
        techniques.push("mid-placement highlights", "balayage with moderate lift");
    }
    else if (contrastScore >= 4) {
        techniques.push("high-contrast placement", "bold highlights", "vivid accent pieces");
    }
    return { recommendedTechniques: techniques, avoidTechniques: avoid };
}
/**
 * Evaluates colour identity and returns a ColorStrategy.
 * Returns null when colorSeason is missing or unrecognised.
 */
export function evaluateColorIdentity(input) {
    const season = input.colorSeason?.toLowerCase();
    if (!season || !(season in SEASON_BASE))
        return null;
    const base = SEASON_BASE[season];
    const { recommendedTechniques, avoidTechniques } = applyContrastModifiers(base, input.contrastScore);
    return {
        season,
        contrastScore: input.contrastScore,
        recommendedTechniques,
        avoidTechniques,
        recommendedTones: base.recommendedTones,
        avoidTones: base.avoidTones,
        contraindications: base.contraindications,
    };
}
//# sourceMappingURL=color-season-rules.js.map