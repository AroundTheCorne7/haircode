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
export const FACE_DIRECTIONAL_FLOW = {
    oval: "balance",
    round: "sky",
    square: "sky",
    rectangular: "sky",
    heart: "earth",
    diamond: "earth",
};
const FACE_RULES = {
    round: {
        // Goal: create length + vertical lines to elongate — flow: sky (upward V)
        recommendedLengths: ["collarbone", "mid-back", "waist"],
        recommendedShapes: ["layered", "angular", "asymmetric", "graduated"],
        forbiddenLengths: ["chin", "ear"],
        forbiddenShapes: ["blunt", "rounded"],
        volumeGuidelines: [
            "Add volume at crown (sky flow — upward V)",
            "Avoid volume at temples and cheeks",
            "Prefer straight or lightly waved styles",
            "Light tones at crown create height; dark at sides slim the face",
        ],
    },
    square: {
        // Goal: soften jaw angles — add curves — flow: sky (upward V)
        recommendedLengths: ["chin", "collarbone", "mid-back"],
        recommendedShapes: ["layered", "textured", "rounded", "asymmetric"],
        forbiddenLengths: ["ear"],
        forbiddenShapes: ["blunt", "angular"],
        volumeGuidelines: [
            "Add volume at crown to elongate (sky flow)",
            "Avoid blunt jaw-length cuts",
            "Side-swept fringe softens forehead corners",
            "Light tones at top, darker at jaw-line reduces squareness",
        ],
    },
    heart: {
        // Goal: balance wider forehead with fuller lower half — flow: earth (downward A)
        recommendedLengths: ["chin", "shoulder", "collarbone"],
        recommendedShapes: ["layered", "graduated", "asymmetric"],
        forbiddenLengths: ["pixie", "ear"],
        forbiddenShapes: ["angular"],
        volumeGuidelines: [
            "Add volume below chin to balance narrow jaw (earth flow — downward A)",
            "Avoid heavy volume at temples/crown",
            "Side-swept or curtain fringe reduces forehead width",
            "Dark at crown/temples, lighter at ends balances heart shape",
        ],
    },
    diamond: {
        // Goal: balance narrow forehead + narrow chin — flow: earth (outward A)
        recommendedLengths: ["chin", "shoulder", "collarbone"],
        recommendedShapes: ["layered", "textured", "rounded"],
        forbiddenLengths: ["waist"],
        forbiddenShapes: ["angular"],
        volumeGuidelines: [
            "Add volume at crown and jaw level (earth flow)",
            "Fringe widens forehead",
            "Avoid sleek styles that expose the narrowest points",
            "Light at fringe and ends; dark at temples reduces cheekbone width",
        ],
    },
    oval: {
        // Goal: versatile — most styles work — flow: balance
        recommendedLengths: [
            "pixie",
            "ear",
            "chin",
            "shoulder",
            "collarbone",
            "mid-back",
            "waist",
        ],
        recommendedShapes: [
            "blunt",
            "layered",
            "textured",
            "graduated",
            "asymmetric",
            "rounded",
            "angular",
        ],
        forbiddenLengths: [],
        forbiddenShapes: [],
        volumeGuidelines: [
            "All volume placements suit oval (balance flow)",
            "Only constraint: proportional balance with body",
            "Light/dark placement used artistically — no structural restrictions",
        ],
    },
    rectangular: {
        // Goal: add width, reduce perceived height — flow: sky (upward V with side volume)
        recommendedLengths: ["ear", "chin", "shoulder"],
        recommendedShapes: ["layered", "textured", "rounded", "asymmetric"],
        forbiddenLengths: ["waist"],
        forbiddenShapes: ["blunt"],
        volumeGuidelines: [
            "Add volume at sides (temples, cheeks) to break vertical line",
            "Fringe reduces face length",
            "Avoid sleek centre-parted styles that elongate",
            "Light tones at temples add width; fringe with slight volume at sides helps",
        ],
    },
};
/**
 * Applies neck-length modifier to the base face shape rules.
 * Short neck → avoid very short lengths that expose neckline.
 */
function applyNeckModifier(design, neckLength) {
    if (neckLength === "short") {
        return {
            ...design,
            forbiddenLengths: [
                ...new Set([...design.forbiddenLengths, "pixie", "ear"]),
            ],
            volumeGuidelines: [
                ...design.volumeGuidelines,
                "Short neck: avoid very short nape; prefer length at or below jaw",
            ],
        };
    }
    return design;
}
/**
 * Evaluates face morphology and returns a HairDesign with all recommendations.
 * Returns null when faceShape is missing or unrecognised.
 */
export function evaluateFaceMorphology(input) {
    const shape = input.faceShape?.toLowerCase();
    if (!shape || !(shape in FACE_RULES))
        return null;
    const base = FACE_RULES[shape];
    const modified = applyNeckModifier(base, input.neckLength);
    const flow = FACE_DIRECTIONAL_FLOW[shape];
    return {
        ...modified,
        rationale: buildRationale(shape, flow, input),
    };
}
function buildRationale(shape, flow, input) {
    const parts = [`Face shape: ${shape} (${flow} flow)`];
    if (input.neckLength)
        parts.push(`neck: ${input.neckLength}`);
    if (input.shoulders)
        parts.push(`shoulders: ${input.shoulders}`);
    return parts.join(", ");
}
//# sourceMappingURL=face-morphology-rules.js.map