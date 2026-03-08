import { db, protocols, clients } from "@haircode/db";
import { eq, and, desc } from "drizzle-orm";
import { evaluate, DEFAULT_RULES, DEFAULT_WEIGHTS } from "@haircode/engine";
/** Normalizers — kept consistent with apps/web/src/app/api/evaluate/route.ts */
const DEFAULT_NORMALIZERS = [
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
        // Route schema uses "sensitivity" (0–10 numeric), not "sensitivityLevel"
        fieldPath: "scalp.sensitivity",
        type: "INVERTED_LINEAR",
        inputMin: 0, inputMax: 10, outputMin: 10, outputMax: 90,
    },
    {
        fieldPath: "scalp.phLevel",
        // Optimal pH ~4.5–5.5. Higher is worse.
        type: "INVERTED_LINEAR",
        inputMin: 3.5, inputMax: 7.5, outputMin: 10, outputMax: 90,
    },
    // ── BODY ──────────────────────────────────────────────────────────────────
    // Fields match route schema: hormonalIndex, nutritionalScore, stressIndex, hydrationPct
    {
        fieldPath: "body.hormonalIndex",
        type: "INVERTED_LINEAR",
        inputMin: 0, inputMax: 10, outputMin: 5, outputMax: 95,
    },
    {
        fieldPath: "body.nutritionalScore",
        type: "RANGE_SCALE",
        inputMin: 0, inputMax: 10, outputMin: 10, outputMax: 100,
    },
    {
        fieldPath: "body.stressIndex",
        type: "INVERTED_LINEAR",
        inputMin: 0, inputMax: 10, outputMin: 5, outputMax: 100,
    },
    {
        fieldPath: "body.hydrationPct",
        type: "RANGE_SCALE",
        inputMin: 0, inputMax: 100, outputMin: 0, outputMax: 100,
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
const DEFAULT_RED_FLAG_RULES = [
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
export async function listProtocolsForClient(tenantId, clientId) {
    return db
        .select()
        .from(protocols)
        .where(and(eq(protocols.tenantId, tenantId), eq(protocols.clientId, clientId)))
        .orderBy(desc(protocols.createdAt));
}
export async function generateProtocol(tenantId, clientId, userId, input) {
    // Verify client belongs to this tenant before proceeding
    const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
        .limit(1);
    if (!client) {
        const err = new Error("Client not found");
        err.statusCode = 404;
        throw err;
    }
    // Build the full ClientProfile for the engine
    const profile = {
        clientId,
        hair: input.hair,
        scalp: input.scalp,
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
    if (!protocol)
        throw new Error("Failed to create protocol");
    return { protocol, result };
}
//# sourceMappingURL=protocol.service.js.map