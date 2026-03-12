/**
 * Body Morphology Rules — Layer 3
 *
 * Adjusts hair length and volume recommendations based on body proportions.
 * Priority is lower than face morphology (Layer 1) — body rules refine,
 * they do not override face shape decisions.
 */
const BODY_RULES = {
    hourglass: {
        // Well-proportioned — most lengths work; avoid extremes that disrupt balance
        lengthBias: ["collarbone", "shoulder", "mid-back"],
        forbiddenLengths: [],
        volumeBias: ["balanced volume", "mid-length layers"],
        forbiddenVolume: [],
        rationale: "Hourglass: balanced proportions suit most lengths; emphasise symmetry",
    },
    rectangle: {
        // Goal: add curves and break vertical line
        lengthBias: ["chin", "shoulder", "collarbone"],
        forbiddenLengths: ["waist"],
        volumeBias: ["volume at sides", "textured layers", "waves for width"],
        forbiddenVolume: ["flat, sleek styles that accentuate the vertical line"],
        rationale: "Rectangle: add volume/width; avoid very long straight styles",
    },
    triangle: {
        // Wider hips, narrower shoulders — draw attention upward
        lengthBias: ["pixie", "ear", "chin", "shoulder"],
        forbiddenLengths: ["mid-back", "waist"],
        volumeBias: [
            "volume at crown",
            "volume at temples",
            "height-adding styles",
        ],
        forbiddenVolume: ["volume at ends", "heavy layers below jaw"],
        rationale: "Triangle: draw eye upward; avoid length and volume that fall at hip level",
    },
    inverted_triangle: {
        // Wider shoulders, narrower hips — draw attention downward, soften shoulders
        lengthBias: ["shoulder", "collarbone", "mid-back"],
        forbiddenLengths: ["pixie", "ear"],
        volumeBias: [
            "volume at ends",
            "length past shoulders to soften shoulder width",
        ],
        forbiddenVolume: ["volume at crown", "very full crown styles"],
        rationale: "Inverted triangle: add length to balance shoulders; avoid crown volume",
    },
};
/**
 * Evaluates body morphology and returns style modifiers.
 * These are applied after face morphology rules by the cross-layer resolver.
 */
export function evaluateBodyMorphology(input) {
    const bodyType = input.bodyType?.toLowerCase();
    if (!bodyType || !(bodyType in BODY_RULES))
        return null;
    const base = { ...BODY_RULES[bodyType] };
    // Wide shoulders modifier: avoid styles that amplify shoulder width
    if (input.shoulders === "wide") {
        base.forbiddenLengths = [...new Set([...base.forbiddenLengths, "ear"])];
        base.volumeBias = base.volumeBias.filter((v) => !v.includes("crown"));
        base.rationale += "; wide shoulders: prefer length past jaw";
    }
    // Narrow shoulders modifier: add structured volume to broaden
    if (input.shoulders === "narrow") {
        base.volumeBias = [
            ...base.volumeBias,
            "volume at temples",
            "structured crown",
        ];
        base.rationale +=
            "; narrow shoulders: structured volume at crown or temples helps";
    }
    return base;
}
//# sourceMappingURL=body-morphology-rules.js.map