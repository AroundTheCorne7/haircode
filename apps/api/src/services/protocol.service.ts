import { db, protocols, clients } from "@haircode/db";
import { eq, and, desc } from "drizzle-orm";
import { evaluate, DEFAULT_RULES, DEFAULT_WEIGHTS } from "@haircode/engine";
import type { FieldNormalizer, RedFlag, ClientProfile } from "@haircode/engine";

/** Normalizers — kept consistent with apps/web/src/app/api/evaluate/route.ts */
const DEFAULT_NORMALIZERS: FieldNormalizer[] = [
  // ── HAIR ──────────────────────────────────────────────────────────────────
  {
    fieldPath: "hair.damageIndex",
    type: "INVERTED_LINEAR",
    inputMin: 0,
    inputMax: 10,
    outputMin: 0,
    outputMax: 100,
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
    // density field comes through as a string enum from the form
    type: "ENUM_MAP",
    map: { thin: 30, fine: 45, medium: 65, thick: 80, coarse: 70 },
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
    inputMin: 1,
    inputMax: 5,
    outputMin: 10,
    outputMax: 90,
  },
  {
    fieldPath: "scalp.phLevel",
    // Optimal pH ~4.5–5.5. Higher is worse.
    type: "INVERTED_LINEAR",
    inputMin: 3.5,
    inputMax: 7.5,
    outputMin: 10,
    outputMax: 90,
  },

  // ── BODY ──────────────────────────────────────────────────────────────────
  // Fields match wizard: sleepQualityScore, stressIndex, activityLevel, dietType
  {
    fieldPath: "body.sleepQualityScore",
    type: "RANGE_SCALE",
    inputMin: 1,
    inputMax: 10,
    outputMin: 5,
    outputMax: 100,
  },
  {
    fieldPath: "body.stressIndex",
    type: "INVERTED_LINEAR",
    inputMin: 1,
    inputMax: 10,
    outputMin: 5,
    outputMax: 100,
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
    inputMin: 0,
    inputMax: 100,
    outputMin: 0,
    outputMax: 100,
  },
  {
    fieldPath: "morphology.faceShape",
    type: "ENUM_MAP",
    map: {
      oval: 90,
      heart: 80,
      diamond: 78,
      round: 68,
      square: 68,
      oblong: 62,
      triangle: 62,
    },
  },
  {
    fieldPath: "morphology.undertone",
    type: "ENUM_MAP",
    map: { neutral: 85, warm: 72, cool: 72 },
  },
];

const DEFAULT_RED_FLAG_RULES: RedFlag[] = [
  {
    code: "RF_SCALP_007",
    severity: "BLOCK",
    message:
      "Open scalp lesions detected — all chemical services are contraindicated until healed.",
    penaltyFactor: 1.0,
    requiresAcknowledgment: true,
  },
  {
    code: "RF_SCALP_006",
    severity: "CRITICAL",
    message:
      "Seborrheic condition with elevated pH — rebalancing protocol required before transformation work.",
    penaltyFactor: 0.25,
    requiresAcknowledgment: true,
  },
  {
    code: "RF_HAIR_001",
    severity: "CRITICAL",
    message:
      "Severe structural damage (damage index 10/10) — emergency repair protocol initiated.",
    penaltyFactor: 0.3,
    requiresAcknowledgment: false,
  },
];

export interface GenerateProtocolInput {
  hair: Record<string, unknown>;
  scalp: Record<string, unknown>;
  body?: Record<string, unknown>;
  morphology?: Record<string, unknown>;
}

export async function listProtocolsForClient(
  tenantId: string,
  clientId: string,
) {
  return db
    .select()
    .from(protocols)
    .where(
      and(eq(protocols.tenantId, tenantId), eq(protocols.clientId, clientId)),
    )
    .orderBy(desc(protocols.createdAt));
}

export async function generateProtocol(
  tenantId: string,
  clientId: string,
  userId: string,
  input: GenerateProtocolInput,
) {
  // Verify client belongs to this tenant before proceeding
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
    .limit(1);

  if (!client) {
    const err = new Error("Client not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  // Derive openLesions from conditions array (same logic as evaluate/route.ts)
  const conditions = Array.isArray(input.scalp.conditions)
    ? (input.scalp.conditions as string[])
    : [];
  const scalpProfile: Record<string, unknown> = {
    ...input.scalp,
    openLesions: input.scalp.openLesions ?? conditions.includes("open_lesions"),
    sebumProduction: String(input.scalp.sebumProduction ?? "2"),
  };

  // Build the full ClientProfile for the engine
  const profile: ClientProfile = {
    clientId,
    hair: input.hair,
    scalp: scalpProfile,
    ...(input.body != null ? { body: input.body } : {}),
    ...(input.morphology != null ? { morphology: input.morphology } : {}),
  };

  // Run the engine with all required inputs — rules, weights, normalizers, and red flag rules
  const result = await evaluate({
    profile,
    rules: DEFAULT_RULES,
    weights: DEFAULT_WEIGHTS,
    normalizers: DEFAULT_NORMALIZERS,
    redFlagRules: DEFAULT_RED_FLAG_RULES,
  });

  // Persist a protocol record with the engine result embedded in objective field
  const [protocol] = await db
    .insert(protocols)
    .values({
      tenantId,
      clientId,
      createdBy: userId,
      name: `Protocol — ${new Date().toISOString().split("T")[0]}`,
      objective: `Phase: ${result.assignedPhase} | Score: ${isFinite(result.compositeScore) ? result.compositeScore.toFixed(1) : "N/A"}`,
      status: "draft",
    })
    .returning();

  if (!protocol) throw new Error("Failed to create protocol");

  return { protocol, result };
}
