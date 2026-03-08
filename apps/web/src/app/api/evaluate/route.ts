import { NextRequest, NextResponse } from "next/server";
import { evaluate, DEFAULT_RULES, DEFAULT_WEIGHTS } from "@haircode/engine";
import type { FieldNormalizer, RedFlag, ClientProfile, PhaseType } from "@haircode/engine";
import { verifyJWT } from "@/lib/auth";

/** Normalizers that map consultation form values → 0-100 engine scores */
const NORMALIZERS: FieldNormalizer[] = [
  // ── HAIR ──────────────────────────────────────────────────────────────────
  {
    fieldPath: "hair.damageIndex",
    type: "INVERTED_LINEAR",
    inputMin: 0, inputMax: 10, outputMin: 0, outputMax: 100,
  },
  {
    fieldPath: "hair.texture",
    type: "ENUM_MAP",
    map: { straight: 80, wavy: 75, curly: 70, coily: 60, kinky: 55 },
  },
  {
    fieldPath: "hair.porosity",
    type: "ENUM_MAP",
    map: { low: 85, medium: 70, high: 35, highly_damaged: 15 },
  },
  {
    fieldPath: "hair.elasticity",
    type: "ENUM_MAP",
    map: { excellent: 90, good: 70, moderate: 45, poor: 15 },
  },
  {
    fieldPath: "hair.density",
    type: "RANGE_SCALE",
    inputMin: 1, inputMax: 5, outputMin: 30, outputMax: 90,
  },

  // ── SCALP ─────────────────────────────────────────────────────────────────
  {
    fieldPath: "scalp.biotype",
    type: "ENUM_MAP",
    map: { dry: 50, normal: 90, oily: 55, combination: 65, sensitized: 40 },
  },
  {
    fieldPath: "scalp.sebumProduction",
    // 1=dry, 2=normal, 3=elevated, 4=very oily — range input returns string keys
    type: "ENUM_MAP",
    map: { "1": 55, "2": 90, "3": 55, "4": 25 },
  },
  {
    fieldPath: "scalp.sensitivityLevel",
    type: "INVERTED_LINEAR",
    inputMin: 1, inputMax: 5, outputMin: 10, outputMax: 90,
  },
  {
    fieldPath: "scalp.phLevel",
    // Optimal pH ~4.5–5.5. Higher is worse.
    type: "INVERTED_LINEAR",
    inputMin: 3.5, inputMax: 7.5, outputMin: 10, outputMax: 90,
  },

  // ── BODY ──────────────────────────────────────────────────────────────────
  {
    fieldPath: "body.sleepQualityScore",
    type: "RANGE_SCALE",
    inputMin: 1, inputMax: 10, outputMin: 5, outputMax: 100,
  },
  {
    fieldPath: "body.stressIndex",
    type: "INVERTED_LINEAR",
    inputMin: 1, inputMax: 10, outputMin: 5, outputMax: 100,
  },
  {
    fieldPath: "body.activityLevel",
    type: "ENUM_MAP",
    map: { sedentary: 30, light: 55, moderate: 75, active: 85, athlete: 70 },
  },
  {
    fieldPath: "body.dietType",
    type: "ENUM_MAP",
    map: { omnivore: 70, vegetarian: 75, vegan: 65, keto: 65, other: 60 },
  },

  // ── MORPHOLOGY ────────────────────────────────────────────────────────────
  {
    fieldPath: "morphology.symmetryScore",
    type: "RANGE_SCALE",
    inputMin: 0, inputMax: 100, outputMin: 0, outputMax: 100,
  },
  {
    fieldPath: "morphology.faceShape",
    type: "ENUM_MAP",
    map: { oval: 90, heart: 80, diamond: 78, round: 68, square: 68, oblong: 62, triangle: 62 },
  },
  {
    fieldPath: "morphology.undertone",
    type: "ENUM_MAP",
    map: { neutral: 85, warm: 72, cool: 72 },
  },
];

const RED_FLAG_RULES: RedFlag[] = [
  {
    code: "RF_SCALP_007",
    severity: "BLOCK",
    message: "Open scalp lesions detected — all chemical services are contraindicated until healed.",
    penaltyFactor: 1.0,
    requiresAcknowledgment: true,
  },
  {
    code: "RF_SCALP_006",
    severity: "CRITICAL",
    message: "Seborrheic condition with elevated pH — rebalancing protocol required before transformation work.",
    penaltyFactor: 0.25,
    requiresAcknowledgment: true,
  },
  {
    code: "RF_HAIR_001",
    severity: "CRITICAL",
    message: "Severe structural damage (damage index 10/10) — emergency repair protocol initiated.",
    penaltyFactor: 0.30,
    requiresAcknowledgment: false,
  },
];

/** Phase-appropriate base services */
const PHASE_SERVICES: Record<PhaseType, string[]> = {
  stabilization: [
    "Emergency Scalp Detox Protocol — every session",
    "pH Rebalancing Therapy — every session",
    "Reconstructive Repair Treatment — every 10 days",
    "Gentle Moisture Infusion — every 14 days",
  ],
  transformation: [
    "Scalp Rebalancing Treatment — every session",
    "Deep Moisture Treatment — every 14 days",
    "Protein-Moisture Balance — every 14 days",
    "Keratin Reconstruction Booster — sessions 2 & 4",
  ],
  integration: [
    "Maintenance Hydration Treatment — every 21 days",
    "Scalp Health Maintenance — every session",
    "Colour Protection & Gloss Service — every 28 days",
    "Preventive Strengthening Mask — monthly",
  ],
};

/** Conditional services based on client profile */
function conditionalServices(profile: ClientProfile): string[] {
  const extras: string[] = [];
  const hair = profile.hair ?? {};
  const scalp = profile.scalp ?? {};
  const body = profile.body ?? {};

  const damageIndex = Number(hair["damageIndex"] ?? 0);
  const porosity = String(hair["porosity"] ?? "");
  const conditions = Array.isArray(scalp["conditions"]) ? (scalp["conditions"] as string[]) : [];
  const stressIndex = Number(body["stressIndex"] ?? 0);
  const chemHistory = Array.isArray(hair["chemicalHistory"]) ? (hair["chemicalHistory"] as string[]) : [];

  if (damageIndex >= 7) extras.push("Keratin Reconstruction Booster — sessions 2 & 4");
  if (porosity === "high" || porosity === "highly_damaged") extras.push("Porosity Sealing Treatment — every session");
  if (conditions.includes("seborrheic")) extras.push("Anti-Seborrheic Scalp Treatment — every 10 days");
  if (conditions.includes("dandruff")) extras.push("Anti-Dandruff Therapy — every session");
  if (conditions.includes("alopecia")) extras.push("Trichology Stimulation Protocol — every session");
  if (stressIndex >= 7) extras.push("Stress-Recovery Scalp Ritual — monthly");
  if (chemHistory.some((h) => h.includes("bleach") || h.includes("lightening"))) {
    extras.push("Bleach-Recovery Bond Building Treatment — every session");
  }

  return extras;
}

export async function POST(req: NextRequest) {
  // Verify JWT — accept token from Authorization header or hc_token cookie
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("hc_token")?.value;
  const token = authHeader?.replace("Bearer ", "").trim() ?? cookieToken;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = await verifyJWT(token);
    if (!payload?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      hair?: Record<string, unknown>;
      scalp?: Record<string, unknown>;
      body?: Record<string, unknown>;
      morphology?: Record<string, unknown>;
    };

    // Normalise scalp.openLesions from conditions array
    const conditions = body.scalp?.conditions;
    const conditionsArr: string[] = Array.isArray(conditions)
      ? (conditions as string[])
      : typeof conditions === "string" && conditions.length > 0
        ? [conditions]
        : [];

    const hairProfile: Record<string, unknown> = body.hair
      ? { ...body.hair, damageIndex: Number(body.hair.damageIndex ?? 0), density: Number(body.hair.density ?? 3) }
      : { damageIndex: 3, density: 3, texture: "straight", porosity: "medium", elasticity: "good" };

    const scalpProfile: Record<string, unknown> = body.scalp
      ? {
          ...body.scalp,
          conditions: conditionsArr,
          openLesions: conditionsArr.includes("open_lesions"),
          // phLevel and sensitivityLevel use INVERTED_LINEAR → must be numbers
          ...(body.scalp.phLevel != null ? { phLevel: Number(body.scalp.phLevel) } : {}),
          // sebumProduction uses ENUM_MAP with string keys ("1","2","3","4") → keep as string (CRIT-02)
          ...(body.scalp.sebumProduction != null ? { sebumProduction: String(body.scalp.sebumProduction) } : {}),
          ...(body.scalp.sensitivityLevel != null ? { sensitivityLevel: Number(body.scalp.sensitivityLevel) } : {}),
        }
      : { biotype: "normal", sebumProduction: "2", sensitivityLevel: 2, conditions: [] };

    const bodyProfile: Record<string, unknown> | undefined = body.body
      ? { ...body.body, sleepQualityScore: Number(body.body.sleepQualityScore ?? 5), stressIndex: Number(body.body.stressIndex ?? 5) }
      : undefined;

    // HIGH-06: Use the actual symmetryScore from submitted data; fall back to 65 only if not provided
    const morphologyProfile: Record<string, unknown> | undefined = body.morphology
      ? { ...body.morphology, symmetryScore: body.morphology.symmetryScore ?? 65 }
      : undefined;

    const profile: ClientProfile = {
      clientId: "consultation",
      hair: hairProfile,
      scalp: scalpProfile,
      ...(bodyProfile != null ? { body: bodyProfile } : {}),
      ...(morphologyProfile != null ? { morphology: morphologyProfile } : {}),
    };

    const result = await evaluate({
      profile,
      rules: DEFAULT_RULES,
      weights: DEFAULT_WEIGHTS,
      normalizers: NORMALIZERS,
      redFlagRules: RED_FLAG_RULES,
      includeTrace: true,
    });

    // Build human-readable services: base phase services + conditional extras
    const baseServices = PHASE_SERVICES[result.assignedPhase];
    const extras = conditionalServices(profile);
    // Deduplicate by prefix
    const allServices = [...new Set([...baseServices, ...extras])];

    // Build human-readable checkpoints
    const checkpoints = result.protocol.checkpoints.map(
      (cp) => `Week ${cp.week} — ${cp.criteria.join(", ")}`
    );

    return NextResponse.json({
      phase: result.assignedPhase.charAt(0).toUpperCase() + result.assignedPhase.slice(1),
      score: Math.round(result.adjustedScore),
      compositeScore: Math.round(result.compositeScore),
      moduleScores: {
        hair: Math.round(result.moduleScores.hair),
        scalp: Math.round(result.moduleScores.scalp),
        body: Math.round(result.moduleScores.body),
        morphology: Math.round(result.moduleScores.morphology),
      },
      redFlags: result.redFlags.map((f) => `${f.code}: ${f.message}`),
      isBlocked: result.redFlags.some((f) => f.severity === "BLOCK"),
      services: allServices,
      checkpoints: checkpoints.length > 0
        ? checkpoints
        : ["Week 3 — Scalp re-assessment", "Week 6 — Full module re-score", "Week 12 — Phase transition evaluation"],
      frequency: result.protocol.frequency,
      trace: result.trace,
    });
  } catch (err) {
    console.error("[evaluate route]", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
