import { describe, it, expect } from "vitest";
import { evaluateRedFlags } from "../red-flag.js";
import type { RedFlag } from "../types.js";

const RED_FLAG_RULES: RedFlag[] = [
  { severity: "BLOCK", code: "RF_SCALP_007", message: "Open lesions — chemical services blocked.", penaltyFactor: 1, requiresAcknowledgment: true },
  { severity: "WARNING", code: "RF_SCALP_006", message: "Seborrhoeic + high pH.", penaltyFactor: 0.2, requiresAcknowledgment: false },
  { severity: "BLOCK", code: "RF_BODY_002", message: "Chemotherapy — contraindicated.", penaltyFactor: 1, requiresAcknowledgment: true },
  { severity: "CRITICAL", code: "RF_HAIR_001", message: "Damage index 10 — intensive repair.", penaltyFactor: 0.5, requiresAcknowledgment: true },
];

describe("evaluateRedFlags", () => {
  it("blocks on open lesions", () => {
    const { flags, blocked } = evaluateRedFlags(
      { clientId: "test", scalp: { openLesions: true } } as any,
      RED_FLAG_RULES
    );
    expect(blocked).toBe(true);
    expect(flags.find((f) => f.code === "RF_SCALP_007")).toBeDefined();
  });

  it("flags damage index 10 as critical", () => {
    const { flags } = evaluateRedFlags(
      { clientId: "test", hair: { damageIndex: 10 }, scalp: {} } as any,
      RED_FLAG_RULES
    );
    expect(flags.find((f) => f.code === "RF_HAIR_001")).toBeDefined();
  });

  it("returns no flags for a healthy profile", () => {
    const { flags, blocked } = evaluateRedFlags(
      { clientId: "test", scalp: { openLesions: false }, hair: { damageIndex: 2 }, body: {} } as any,
      RED_FLAG_RULES
    );
    expect(blocked).toBe(false);
    expect(flags).toHaveLength(0);
  });

  it("blocks on chemotherapy medication", () => {
    const { blocked } = evaluateRedFlags(
      { clientId: "test", body: { medication: ["chemotherapy"] }, scalp: {}, hair: {} } as any,
      RED_FLAG_RULES
    );
    expect(blocked).toBe(true);
  });
});
