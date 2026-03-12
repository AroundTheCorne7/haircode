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

import type {
  HairDesign,
  ColorStrategy,
  TechnicalRoadmap,
  TreatmentProtocol,
  ArchetypeBlend,
  ConflictRecord,
  TransformationBlueprintOutput,
  PhaseType,
  RedFlag,
} from "./types.js";
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
export function resolveLayers(
  decisions: LayerDecisions,
): TransformationBlueprintOutput {
  const conflicts: ConflictRecord[] = [];

  // ── Hair Design: start from face morphology (L1), refine with body (L3) ────
  const hairDesign = buildHairDesign(
    decisions.faceMorphology,
    decisions.bodyMorphology,
    decisions.archetypeStyle,
    conflicts,
  );

  // ── Color Strategy: from color identity (L4); red flags can add contraindications
  const colorStrategy = decisions.colorStrategy ?? buildDefaultColorStrategy();
  const colorWithFlags = applyRedFlagToColor(
    colorStrategy,
    decisions.redFlags,
    conflicts,
  );

  // ── Technical Roadmap: derived from phase + score ─────────────────────────
  const technicalRoadmap = buildTechnicalRoadmap(
    decisions.assignedPhase,
    decisions.analysisScore,
    decisions.redFlags,
  );

  // ── Treatment Protocol: from red flags + hair structure ───────────────────
  const treatmentProtocol = buildTreatmentProtocol(
    decisions.redFlags,
    decisions.analysisScore,
  );

  return {
    hairDesign,
    colorStrategy: colorWithFlags,
    technicalRoadmap,
    treatmentProtocol,
    archetypeBlend: decisions.archetypeBlend,
    conflictResolution: conflicts,
  };
}

// ─── Hair Design Merger ────────────────────────────────────────────────────────

function buildHairDesign(
  face: HairDesign | null,
  body: BodyStyleModifiers | null,
  archetype: ArchetypeStyleProfile | null,
  conflicts: ConflictRecord[],
): HairDesign {
  // Start with face morphology (L1) — the authoritative base
  const base: HairDesign = face ?? {
    recommendedLengths: ["shoulder", "collarbone", "mid-back"],
    recommendedShapes: ["layered", "textured"],
    forbiddenLengths: [],
    forbiddenShapes: [],
    volumeGuidelines: [
      "No specific face morphology data — general guidelines applied",
    ],
    rationale: "Default: no face shape data provided",
  };

  let recommendedLengths = [...base.recommendedLengths];
  let forbiddenLengths = [...base.forbiddenLengths];
  let volumeGuidelines = [...base.volumeGuidelines];

  // ── Layer 3: Body morphology refines lengths ────────────────────────────────
  if (body) {
    // Remove body-forbidden lengths from recommendations (L3 is lower than L1, so only
    // enforce body rules if they don't conflict with L1 recommendations)
    for (const fl of body.forbiddenLengths) {
      if (recommendedLengths.includes(fl)) {
        // L1 recommends, L3 forbids → L1 wins, but record the conflict
        conflicts.push({
          field: `length:${fl}`,
          winningLayer: "face_morphology",
          losingLayer: "body_morphology",
          resolution: `Face shape recommendation for "${fl}" kept despite body morphology concern`,
        });
      } else {
        forbiddenLengths = [...new Set([...forbiddenLengths, fl])];
      }
    }
    // Add body volume guidance
    volumeGuidelines = [...volumeGuidelines, ...body.volumeBias];
  }

  // ── Layer 5: Archetype preferences (lowest priority for structure) ─────────
  if (archetype) {
    // Archetype-preferred lengths that are not forbidden by L1 or L3 get boosted
    const safeArchetypeLengths = archetype.preferredLengths.filter(
      (l) => !forbiddenLengths.includes(l),
    );
    // Move archetype-preferred lengths to front if not already in L1 recommendations
    for (const al of safeArchetypeLengths) {
      if (!recommendedLengths.includes(al)) {
        recommendedLengths.push(al);
      }
    }

    // Archetype-avoided lengths: add to forbidden only if not L1-recommended
    for (const al of archetype.avoidLengths) {
      if (!recommendedLengths.includes(al)) {
        forbiddenLengths = [...new Set([...forbiddenLengths, al])];
      } else {
        conflicts.push({
          field: `length:${al}`,
          winningLayer: "face_morphology",
          losingLayer: "archetype_identity",
          resolution: `Face morphology recommendation kept; archetype avoidance overridden`,
        });
      }
    }
  }

  return {
    ...base,
    recommendedLengths,
    forbiddenLengths: [...new Set(forbiddenLengths)],
    volumeGuidelines: [...new Set(volumeGuidelines)],
  };
}

// ─── Color Strategy ────────────────────────────────────────────────────────────

function applyRedFlagToColor(
  strategy: ColorStrategy,
  redFlags: RedFlag[],
  conflicts: ConflictRecord[],
): ColorStrategy {
  const additionalContraindications: string[] = [];

  for (const flag of redFlags) {
    if (flag.severity === "BLOCK") {
      additionalContraindications.push(
        `BLOCK (${flag.code}): All chemical services contraindicated — ${flag.message}`,
      );
      conflicts.push({
        field: "color_services",
        winningLayer: "scalp_condition",
        losingLayer: "color_identity",
        resolution: `Scalp block (${flag.code}) overrides all color recommendations`,
      });
    } else if (flag.severity === "CRITICAL") {
      additionalContraindications.push(
        `CRITICAL (${flag.code}): Chemical services require caution — ${flag.message}`,
      );
    }
  }

  return {
    ...strategy,
    contraindications: [
      ...strategy.contraindications,
      ...additionalContraindications,
    ],
  };
}

function buildDefaultColorStrategy(): ColorStrategy {
  return {
    season: "summer",
    contrastScore: 3,
    recommendedTechniques: ["consultation required — no color data provided"],
    avoidTechniques: [],
    recommendedTones: [],
    avoidTones: [],
    contraindications: [
      "Color season not assessed — perform full color consultation before proceeding",
    ],
  };
}

// ─── Technical Roadmap Builder ─────────────────────────────────────────────────

const PHASE_ROADMAPS: Record<
  PhaseType,
  { totalWeeks: number; visitFrequency: number; phaseNames: string[] }
> = {
  stabilization: {
    totalWeeks: 8,
    visitFrequency: 2,
    phaseNames: ["Assessment & Stabilisation"],
  },
  transformation: {
    totalWeeks: 16,
    visitFrequency: 3,
    phaseNames: ["Preparation", "Active Transformation"],
  },
  integration: {
    totalWeeks: 24,
    visitFrequency: 4,
    phaseNames: ["Preparation", "Transformation", "Refinement & Integration"],
  },
};

function buildTechnicalRoadmap(
  phase: PhaseType,
  score: number,
  redFlags: RedFlag[],
): TechnicalRoadmap {
  const config = PHASE_ROADMAPS[phase];
  const hasBlock = redFlags.some((f) => f.severity === "BLOCK");

  if (hasBlock) {
    return {
      phases: [
        {
          name: "Scalp Recovery",
          durationWeeks: 4,
          services: ["Scalp treatment (non-chemical)", "Assessment only"],
          checkpoints: ["Resolve open lesions before any chemical service"],
        },
      ],
      totalDurationWeeks: 4,
      visitFrequencyWeeks: 2,
    };
  }

  const phases = config.phaseNames.map((name, i) => ({
    name,
    durationWeeks: Math.round(config.totalWeeks / config.phaseNames.length),
    services: getPhaseServices(phase, i),
    checkpoints: getPhaseCheckpoints(phase, i, score),
  }));

  return {
    phases,
    totalDurationWeeks: config.totalWeeks,
    visitFrequencyWeeks: config.visitFrequency,
  };
}

function getPhaseServices(phase: PhaseType, phaseIndex: number): string[] {
  const services: Record<PhaseType, string[][]> = {
    stabilization: [
      ["Scalp analysis", "Protein treatment", "pH balancing treatment"],
    ],
    transformation: [
      ["Deep conditioning", "Bond repair treatment", "Scalp prep"],
      ["Color service", "Cut & shape", "Bond treatment"],
    ],
    integration: [
      ["Full hair analysis", "Pre-treatment protocol"],
      ["Primary color service", "Major cut"],
      ["Refinement color", "Styling consultation", "Maintenance plan"],
    ],
  };

  return services[phase][phaseIndex] ?? services[phase][0] ?? [];
}

function getPhaseCheckpoints(
  phase: PhaseType,
  phaseIndex: number,
  score: number,
): string[] {
  if (phase === "stabilization") {
    return [
      "Moisture levels stabilised",
      "Damage index reduced",
      "Scalp condition improved",
    ];
  }
  if (phaseIndex === 0) {
    return [
      "Hair structure assessed",
      "Pre-treatment complete",
      "Client ready for chemical service",
    ];
  }
  return [
    "Color result on target",
    "Integrity maintained",
    score >= 66 ? "Integration phase eligible" : "Reassess in 4 weeks",
  ];
}

// ─── Treatment Protocol Builder ───────────────────────────────────────────────

function buildTreatmentProtocol(
  redFlags: RedFlag[],
  score: number,
): TreatmentProtocol {
  const homecare: string[] = [
    "Sulfate-free shampoo",
    "Weekly deep conditioning mask",
    "Heat protection before styling",
    "UV protection spray",
  ];

  const inSalon: string[] = [
    "Olaplex / bond-building treatment (each visit)",
    "pH balancing rinse",
    "Scalp microbiome check (every 3 months)",
  ];

  const contraindications: string[] = [];

  // Add score-based homecare
  if (score <= 40) {
    homecare.push(
      "Daily scalp oil (non-comedogenic)",
      "Protein treatment every 2 weeks",
    );
    inSalon.push("Intensive repair treatment (every visit)");
  }

  // Add red-flag contraindications
  for (const flag of redFlags) {
    if (flag.severity === "BLOCK") {
      contraindications.push(
        `No chemical services: ${flag.message} (${flag.code})`,
      );
    } else if (flag.severity === "CRITICAL") {
      contraindications.push(
        `Caution required: ${flag.message} (${flag.code})`,
      );
    }
  }

  return { homecare, inSalon, contraindications };
}
