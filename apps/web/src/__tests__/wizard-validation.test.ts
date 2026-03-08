/**
 * Consultation Wizard Validation Tests
 * Based purely on: HairCode™ Formal System Specifications v1.0.0
 * Spec §6 — Consultation Wizard Spec
 *
 * These are pure unit tests of the Zod validation schemas and the
 * conditions/normalisation logic described in the spec. They do NOT
 * mount React components; they test the validation rules directly so
 * that the logic is verifiable independent of the rendering layer.
 *
 * Where the spec defines a Zod schema literally, that schema is
 * reconstructed here from the spec text and tested in isolation.
 * Where the spec describes data-normalisation behaviour in
 * `/api/evaluate/route.ts`, helper functions mirroring that logic are
 * tested against the spec's stated behaviours.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// §6 Step 1 — Client Profile validation schema
// Spec §6, Step 1 — Validation Schema (Zod):
//
//   z.object({
//     firstName:             z.string().min(1, "Required"),
//     lastName:              z.string().min(1, "Required"),
//     dateOfBirth:           z.string().optional(),
//     genderIdentity:        z.string().optional(),
//     consentDataProcessing: z.boolean().refine((v) => v === true, "Consent required"),
//   })
// ---------------------------------------------------------------------------
const step1Schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().optional(),
  genderIdentity: z.string().optional(),
  consentDataProcessing: z
    .boolean()
    .refine((v) => v === true, "Consent required"),
});

// ---------------------------------------------------------------------------
// §6 Step 2 — Hair Assessment validation schema
// Spec §6, Step 2 — "texture is the only required field"
// ---------------------------------------------------------------------------
const step2Schema = z.object({
  texture: z.string().min(1, "Required"),
  density: z.string().optional(),
  porosity: z.string().optional(),
  elasticity: z.string().optional(),
  chemicalHistory: z.array(z.string()).optional(),
  damageIndex: z.number().optional(),
});

// ---------------------------------------------------------------------------
// §6 Step 3 — Scalp Assessment validation schema
// Spec §6, Step 3 — "biotype is required; error shown if not selected"
// ---------------------------------------------------------------------------
const step3Schema = z.object({
  biotype: z.string().min(1, "Required"),
  sebumProduction: z.string().optional(),
  sensitivityLevel: z.number().optional(),
  phLevel: z.number().optional(),
  // conditions: 0 checked → undefined | 1 checked → string | 2+ → string[]
  // The schema accepts any of these raw RHF output shapes
  conditions: z.union([z.string(), z.array(z.string())]).optional(),
});

// ---------------------------------------------------------------------------
// §6 Step 5 — Morphology & Visagism validation schema
// Spec §6, Step 5 — "faceShape and undertone are required"
// ---------------------------------------------------------------------------
const step5Schema = z.object({
  faceShape: z.string().min(1, "Required"),
  undertone: z.string().min(1, "Required"),
  contrastLevel: z.string().optional(),
});

// ---------------------------------------------------------------------------
// §6 /api/evaluate route — scalp.conditions normalisation helper
// Spec §6, Step 3:
//   "0 checked: undefined  → normalise to []"
//   "1 checked: string     → normalise to [string]"
//   "2+ checked: string[]  → pass through as-is"
// ---------------------------------------------------------------------------
function normaliseConditions(
  raw: undefined | string | string[],
): string[] {
  if (raw === undefined) return [];
  if (typeof raw === "string") return [raw];
  return raw;
}

// ---------------------------------------------------------------------------
// §6 /api/evaluate route — openLesions derivation
// Spec §6, Step 3:
//   "openLesions = conditionsArr.includes('open_lesions')"
// ---------------------------------------------------------------------------
function deriveOpenLesions(conditionsArr: string[]): boolean {
  return conditionsArr.includes("open_lesions");
}

// ===========================================================================
// Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// Step 1 Validation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 1 — Client Profile validation", () => {
  // Spec §6 Step 1 — firstName is required (min 1 char)
  it("submitting without firstName → validation error with message 'Required'", () => {
    const result = step1Schema.safeParse({
      firstName: "",
      lastName: "Dupont",
      consentDataProcessing: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const firstNameErrors = result.error.flatten().fieldErrors.firstName;
      expect(firstNameErrors).toBeDefined();
      expect(firstNameErrors).toContain("Required");
    }
  });

  // Spec §6 Step 1 — firstName omitted entirely
  it("firstName omitted entirely → validation error", () => {
    const result = step1Schema.safeParse({
      // firstName not present
      lastName: "Dupont",
      consentDataProcessing: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.firstName).toBeDefined();
    }
  });

  // Spec §6 Step 1 — lastName is required (min 1 char)
  it("submitting without lastName → validation error with message 'Required'", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "",
      consentDataProcessing: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const lastNameErrors = result.error.flatten().fieldErrors.lastName;
      expect(lastNameErrors).toBeDefined();
      expect(lastNameErrors).toContain("Required");
    }
  });

  // Spec §6 Step 1 — consentDataProcessing: false → validation error "Consent required"
  it("submitting without GDPR consent (false) → validation error 'Consent required'", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      consentDataProcessing: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const consentErrors =
        result.error.flatten().fieldErrors.consentDataProcessing;
      expect(consentErrors).toBeDefined();
      expect(consentErrors).toContain("Consent required");
    }
  });

  // Spec §6 Step 1 — consentDataProcessing omitted → validation error
  it("consentDataProcessing omitted → validation error", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      // consentDataProcessing not present
    });

    expect(result.success).toBe(false);
  });

  // Spec §6 Step 1 — happy path: all required fields present + consent true
  it("valid data with consentDataProcessing: true → passes validation", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      consentDataProcessing: true,
    });

    expect(result.success).toBe(true);
  });

  // Spec §6 Step 1 — optional fields (dateOfBirth, genderIdentity) may be absent
  it("optional fields absent → still passes validation", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      consentDataProcessing: true,
      // dateOfBirth and genderIdentity omitted — both optional
    });

    expect(result.success).toBe(true);
  });

  // Spec §6 Step 1 — optional fields present → passes validation
  it("optional fields present → passes validation", () => {
    const result = step1Schema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      dateOfBirth: "1985-04-12",
      genderIdentity: "female",
      consentDataProcessing: true,
    });

    expect(result.success).toBe(true);
  });

  // Spec §6 Step 1 — both firstName and GDPR missing → both errors reported
  it("both firstName and consentDataProcessing missing → errors for both fields", () => {
    const result = step1Schema.safeParse({
      firstName: "",
      lastName: "Dupont",
      consentDataProcessing: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.firstName).toBeDefined();
      expect(fieldErrors.consentDataProcessing).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Step 2 Validation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 2 — Hair Assessment validation", () => {
  // Spec §6 Step 2 — "texture is the only required field"
  it("submitting without texture → validation error", () => {
    const result = step2Schema.safeParse({
      // texture omitted
      density: "3",
      damageIndex: 5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.texture).toBeDefined();
    }
  });

  it("empty texture string → validation error", () => {
    const result = step2Schema.safeParse({
      texture: "",
      density: "3",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.texture).toContain("Required");
    }
  });

  // Spec §6 Step 2 — "All other fields are optional; the form advances even without them"
  it("only texture provided → passes validation (all others optional)", () => {
    const result = step2Schema.safeParse({
      texture: "straight",
    });

    expect(result.success).toBe(true);
  });

  // Spec §6 Step 2 — density is stored as string (range slider, no valueAsNumber)
  it("density stored as string '3' → valid", () => {
    const result = step2Schema.safeParse({
      texture: "wavy",
      density: "3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.density).toBe("string");
    }
  });

  // Spec §6 Step 2 — damageIndex stored as number (valueAsNumber: true)
  it("damageIndex stored as number 7 → valid", () => {
    const result = step2Schema.safeParse({
      texture: "curly",
      damageIndex: 7,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.damageIndex).toBe("number");
    }
  });

  it("all optional fields absent → passes validation", () => {
    const result = step2Schema.safeParse({ texture: "kinky" });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 3 Validation — scalp.conditions normalisation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 3 — Scalp conditions normalisation", () => {
  // Spec §6 Step 3 — "0 checked: undefined" → normalise to []
  it("conditions with 0 checkboxes (undefined) → normalised to empty array []", () => {
    const result = normaliseConditions(undefined);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  // Spec §6 Step 3 — "1 checked: string (single value)" → normalise to [string]
  it("conditions with 1 checkbox (single string) → normalised to array with one element", () => {
    const result = normaliseConditions("dandruff");
    expect(result).toEqual(["dandruff"]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  // Spec §6 Step 3 — "2+ checked: string[]" → pass through as-is
  it("conditions with 2+ checkboxes (string[]) → remains a string array", () => {
    const result = normaliseConditions(["dandruff", "seborrheic"]);
    expect(result).toEqual(["dandruff", "seborrheic"]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("conditions with 3 checkboxes → all three elements preserved", () => {
    const raw = ["dandruff", "seborrheic", "alopecia"];
    const result = normaliseConditions(raw);
    expect(result).toEqual(raw);
    expect(result).toHaveLength(3);
  });

  // The normalised output is always string[] regardless of input shape
  it("normalised result is always an array (never undefined or string)", () => {
    expect(Array.isArray(normaliseConditions(undefined))).toBe(true);
    expect(Array.isArray(normaliseConditions("psoriasis"))).toBe(true);
    expect(
      Array.isArray(normaliseConditions(["psoriasis", "folliculitis"])),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 3 Validation — openLesions derivation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 3 — scalp.openLesions derivation from conditions", () => {
  // Spec §6 Step 3 — "openLesions = conditionsArr.includes('open_lesions')"
  it("conditions includes 'open_lesions' → openLesions is true", () => {
    const conditions = normaliseConditions("open_lesions");
    expect(deriveOpenLesions(conditions)).toBe(true);
  });

  it("conditions array includes 'open_lesions' among others → openLesions is true", () => {
    const conditions = normaliseConditions(["dandruff", "open_lesions"]);
    expect(deriveOpenLesions(conditions)).toBe(true);
  });

  it("conditions does NOT include 'open_lesions' → openLesions is false", () => {
    const conditions = normaliseConditions(["dandruff", "seborrheic"]);
    expect(deriveOpenLesions(conditions)).toBe(false);
  });

  it("empty conditions array → openLesions is false", () => {
    const conditions = normaliseConditions(undefined);
    expect(deriveOpenLesions(conditions)).toBe(false);
  });

  it("single non-matching condition string → openLesions is false", () => {
    const conditions = normaliseConditions("dandruff");
    expect(deriveOpenLesions(conditions)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Step 3 Validation — biotype required
// ---------------------------------------------------------------------------
describe("Spec §6, Step 3 — Scalp Assessment validation", () => {
  // Spec §6 Step 3 — "biotype is required; error shown if not selected"
  it("submitting without biotype → validation error", () => {
    const result = step3Schema.safeParse({
      // biotype omitted
      phLevel: 5.2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.biotype).toBeDefined();
    }
  });

  it("empty biotype → validation error", () => {
    const result = step3Schema.safeParse({
      biotype: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.biotype).toContain("Required");
    }
  });

  // Spec §6 Step 3 — "All other fields are optional"
  it("only biotype provided → passes validation", () => {
    const result = step3Schema.safeParse({ biotype: "normal" });
    expect(result.success).toBe(true);
  });

  it("all fields provided → passes validation", () => {
    const result = step3Schema.safeParse({
      biotype: "oily",
      sebumProduction: "3",
      sensitivityLevel: 2,
      phLevel: 5.5,
      conditions: ["dandruff", "seborrheic"],
    });
    expect(result.success).toBe(true);
  });

  // Spec §6 Step 3 — sebumProduction stored as string (range slider, no valueAsNumber)
  it("sebumProduction stored as string '2' → valid", () => {
    const result = step3Schema.safeParse({
      biotype: "dry",
      sebumProduction: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.sebumProduction).toBe("string");
    }
  });

  // conditions: undefined, single string, or string[] are all valid raw shapes
  it("conditions as single string (1 checkbox) → valid in raw schema", () => {
    const result = step3Schema.safeParse({
      biotype: "sensitized",
      conditions: "dandruff",
    });
    expect(result.success).toBe(true);
  });

  it("conditions as string[] (2+ checkboxes) → valid in raw schema", () => {
    const result = step3Schema.safeParse({
      biotype: "combination",
      conditions: ["dandruff", "psoriasis"],
    });
    expect(result.success).toBe(true);
  });

  it("conditions absent (0 checkboxes) → valid in raw schema", () => {
    const result = step3Schema.safeParse({
      biotype: "normal",
      // conditions absent
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 4 Validation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 4 — Body Optimisation validation", () => {
  // Spec §6 Step 4 — "No required fields. Form always advances on submit."
  it("empty payload → passes validation (no required fields)", () => {
    // Step 4 has no required fields — any object including empty is valid
    const step4Schema = z
      .object({
        sleepQualityScore: z.number().optional(),
        stressIndex: z.number().optional(),
        activityLevel: z.string().optional(),
        dietType: z.string().optional(),
        hormonalEvents: z.array(z.string()).optional(),
      })
      .passthrough();

    const result = step4Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("all fields provided → valid", () => {
    const step4Schema = z.object({
      sleepQualityScore: z.number().optional(),
      stressIndex: z.number().optional(),
      activityLevel: z.string().optional(),
      dietType: z.string().optional(),
      hormonalEvents: z.array(z.string()).optional(),
    });

    const result = step4Schema.safeParse({
      sleepQualityScore: 7,
      stressIndex: 4,
      activityLevel: "moderate",
      dietType: "omnivore",
      hormonalEvents: ["menopause_transition"],
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 5 Validation
// ---------------------------------------------------------------------------
describe("Spec §6, Step 5 — Morphology & Visagism validation", () => {
  // Spec §6 Step 5 — faceShape is required
  it("submitting without faceShape → validation error", () => {
    const result = step5Schema.safeParse({
      // faceShape omitted
      undertone: "neutral",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.faceShape).toBeDefined();
    }
  });

  it("empty faceShape → validation error with message 'Required'", () => {
    const result = step5Schema.safeParse({
      faceShape: "",
      undertone: "neutral",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.faceShape).toContain("Required");
    }
  });

  // Spec §6 Step 5 — undertone is required
  it("submitting without undertone → validation error", () => {
    const result = step5Schema.safeParse({
      faceShape: "oval",
      // undertone omitted
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.undertone).toBeDefined();
    }
  });

  it("empty undertone → validation error", () => {
    const result = step5Schema.safeParse({
      faceShape: "oval",
      undertone: "",
    });

    expect(result.success).toBe(false);
  });

  // Spec §6 Step 5 — contrastLevel is optional
  it("faceShape + undertone without contrastLevel → passes validation", () => {
    const result = step5Schema.safeParse({
      faceShape: "oval",
      undertone: "warm",
      // contrastLevel omitted — optional
    });

    expect(result.success).toBe(true);
  });

  it("all three fields provided → passes validation", () => {
    const result = step5Schema.safeParse({
      faceShape: "heart",
      undertone: "cool",
      contrastLevel: "high",
    });

    expect(result.success).toBe(true);
  });

  it("both faceShape and undertone missing → errors for both", () => {
    const result = step5Schema.safeParse({
      faceShape: "",
      undertone: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.faceShape).toBeDefined();
      expect(fieldErrors.undertone).toBeDefined();
    }
  });

  // Spec §6 Step 5 — valid faceShape values per spec
  it.each([
    "oval",
    "round",
    "square",
    "heart",
    "diamond",
    "oblong",
    "triangle",
  ])("faceShape='%s' (valid value from spec) → passes validation", (shape) => {
    const result = step5Schema.safeParse({ faceShape: shape, undertone: "neutral" });
    expect(result.success).toBe(true);
  });

  // Spec §6 Step 5 — valid undertone values per spec
  it.each(["warm", "neutral", "cool"])(
    "undertone='%s' (valid value from spec) → passes validation",
    (tone) => {
      const result = step5Schema.safeParse({ faceShape: "oval", undertone: tone });
      expect(result.success).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// §6 /api/evaluate — Input transformation: symmetryScore always overridden to 65
// ---------------------------------------------------------------------------
describe("Spec §6, Step 6 — /api/evaluate input transformation", () => {
  // Spec §6: "morphology.symmetryScore overridden to 65 (hardcoded)"
  it("symmetryScore is always 65 regardless of what the form submits", () => {
    // The spec states the route.ts hardcodes symmetryScore to 65.
    // We test the transformation rule, not the route itself.
    function applySymmetryScoreOverride(
      morphology: Record<string, unknown> | undefined,
    ): Record<string, unknown> | undefined {
      if (!morphology) return undefined;
      return { ...morphology, symmetryScore: 65 };
    }

    // Form sends symmetryScore: 90 → overridden to 65
    const transformed = applySymmetryScoreOverride({ faceShape: "oval", undertone: "neutral", symmetryScore: 90 });
    expect(transformed?.symmetryScore).toBe(65);

    // Form sends no symmetryScore → added as 65
    const transformed2 = applySymmetryScoreOverride({ faceShape: "round", undertone: "warm" });
    expect(transformed2?.symmetryScore).toBe(65);

    // Missing morphology → still undefined
    const transformed3 = applySymmetryScoreOverride(undefined);
    expect(transformed3).toBeUndefined();
  });

  // Spec §6 Step 6 — "Missing hair → defaults applied"
  it("missing hair module → defaults are applied (damageIndex=3, texture='straight', etc.)", () => {
    // The spec defines these defaults applied by route.ts when hair is absent
    const DEFAULT_HAIR = {
      damageIndex: 3,
      density: 3,
      texture: "straight",
      porosity: "medium",
      elasticity: "good",
    };

    function applyHairDefaults(
      hair: Record<string, unknown> | undefined,
    ): Record<string, unknown> {
      return hair ?? DEFAULT_HAIR;
    }

    expect(applyHairDefaults(undefined)).toEqual(DEFAULT_HAIR);
    expect(applyHairDefaults({ texture: "wavy", damageIndex: 5 })).toEqual({
      texture: "wavy",
      damageIndex: 5,
    });
  });

  // Spec §6 Step 6 — "Missing scalp → defaults applied"
  it("missing scalp module → defaults are applied (biotype='normal', etc.)", () => {
    const DEFAULT_SCALP = {
      biotype: "normal",
      sebumProduction: 2,
      sensitivityLevel: 2,
      conditions: [],
    };

    function applyScalpDefaults(
      scalp: Record<string, unknown> | undefined,
    ): Record<string, unknown> {
      return scalp ?? DEFAULT_SCALP;
    }

    expect(applyScalpDefaults(undefined)).toEqual(DEFAULT_SCALP);
    expect(applyScalpDefaults({ biotype: "dry" })).toEqual({ biotype: "dry" });
  });

  // Spec §6 Step 6 — "Missing body → undefined (excluded from profile)"
  it("missing body module → remains undefined (excluded from profile)", () => {
    function applyBodyDefaults(
      body: Record<string, unknown> | undefined,
    ): Record<string, unknown> | undefined {
      return body ?? undefined;
    }

    expect(applyBodyDefaults(undefined)).toBeUndefined();
    expect(applyBodyDefaults({ stressIndex: 4 })).toEqual({ stressIndex: 4 });
  });

  // Spec §6 Step 6 — "Missing morphology → undefined (excluded from profile)"
  it("missing morphology module → remains undefined (excluded from profile)", () => {
    function applyMorphologyDefaults(
      morphology: Record<string, unknown> | undefined,
    ): Record<string, unknown> | undefined {
      return morphology ?? undefined;
    }

    expect(applyMorphologyDefaults(undefined)).toBeUndefined();
    expect(applyMorphologyDefaults({ faceShape: "oval", undertone: "warm" })).toEqual({
      faceShape: "oval",
      undertone: "warm",
    });
  });

  // Spec §6 Step 6 — density coercion: range slider returns string, route coerces with Number()
  it("hair.density string '3' coerces to number 3 via Number()", () => {
    expect(Number("3")).toBe(3);
    expect(Number("1")).toBe(1);
    expect(Number("5")).toBe(5);
    // Default when undefined: Number(undefined ?? 3) = 3
    expect(Number(undefined ?? 3)).toBe(3);
  });

  // Spec §6 Step 6 — sleepQualityScore and stressIndex coercion with fallback default 5
  it("body.sleepQualityScore undefined → coerces to 5 via Number(undefined ?? 5)", () => {
    // Spec: "sleepQualityScore: Number(body.body.sleepQualityScore ?? 5)"
    const coerced = Number(undefined ?? 5);
    expect(coerced).toBe(5);
  });

  it("body.stressIndex undefined → coerces to 5 via Number(undefined ?? 5)", () => {
    const coerced = Number(undefined ?? 5);
    expect(coerced).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// §6 /api/evaluate — Response shape
// ---------------------------------------------------------------------------
describe("Spec §6 — /api/evaluate response shape", () => {
  // Spec §6 Step 6 — phase is capitalised
  it("phase capitalisation: 'stabilization' → 'Stabilization'", () => {
    const capitalise = (s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1);

    expect(capitalise("stabilization")).toBe("Stabilization");
    expect(capitalise("transformation")).toBe("Transformation");
    expect(capitalise("integration")).toBe("Integration");
  });

  // Spec §6 — score is Math.round(adjustedScore)
  it("score is Math.round of adjustedScore", () => {
    expect(Math.round(34.2)).toBe(34);
    expect(Math.round(61.7)).toBe(62);
    expect(Math.round(0)).toBe(0);
    expect(Math.round(100)).toBe(100);
  });

  // Spec §6 — redFlags formatted as "<code>: <message>"
  it("red flag string format matches '<code>: <message>'", () => {
    const code = "RF_SCALP_007";
    const message =
      "Open scalp lesions detected — all chemical services are contraindicated until healed.";
    const formatted = `${code}: ${message}`;
    expect(formatted).toBe(
      "RF_SCALP_007: Open scalp lesions detected — all chemical services are contraindicated until healed.",
    );
  });
});
