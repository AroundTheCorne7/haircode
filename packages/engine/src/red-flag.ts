import type { ClientProfile, RedFlag } from "./types.js";

export function evaluateRedFlags(
  profile: ClientProfile,
  redFlagRules: RedFlag[]
): { flags: RedFlag[]; totalPenalty: number; blocked: boolean } {
  const flags: RedFlag[] = [];
  let totalPenalty = 0;
  let blocked = false;

  // Scalp red flag checks
  const scalp = profile.scalp ?? {};

  if ((scalp as Record<string, unknown>)["openLesions"] === true) {
    const flag = redFlagRules.find((r) => r.code === "RF_SCALP_007");
    if (flag) { flags.push(flag); blocked = true; }
  }

  const scalpConditions = (scalp as Record<string, unknown>)["conditions"];
  if (Array.isArray(scalpConditions) && scalpConditions.includes("seborrheic")) {
    const phLevel = (scalp as Record<string, unknown>)["phLevel"];
    if (typeof phLevel === "number" && phLevel > 6.0) {
      const flag = redFlagRules.find((r) => r.code === "RF_SCALP_006");
      if (flag) {
        flags.push(flag);
        // Spec §5.6: penalty = max of individual penalties, NOT additive
        totalPenalty = Math.max(totalPenalty, flag.penaltyFactor);
      }
    }
  }

  // Body red flags
  const body = profile.body ?? {};
  const medications = (body as Record<string, unknown>)["medication"];
  if (Array.isArray(medications) && medications.includes("chemotherapy")) {
    const flag = redFlagRules.find((r) => r.code === "RF_BODY_002");
    if (flag) { flags.push(flag); blocked = true; }
  }

  // Hair red flags
  const hair = profile.hair ?? {};
  const damageIndex = (hair as Record<string, unknown>)["damageIndex"];
  if (typeof damageIndex === "number" && damageIndex >= 10) {
    const flag = redFlagRules.find((r) => r.code === "RF_HAIR_001");
    if (flag) {
      flags.push(flag);
      // Spec §5.6: penalty = max of individual penalties, NOT additive
      totalPenalty = Math.max(totalPenalty, flag.penaltyFactor);
    }
  }

  return { flags, totalPenalty, blocked };
}
