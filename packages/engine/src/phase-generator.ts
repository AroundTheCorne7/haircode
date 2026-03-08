import type { PhaseType, RedFlag, PhaseOutput, CheckpointOutput } from "./types.js";

const PHASE_THRESHOLDS = {
  stabilization: { max: 40 },
  transformation: { min: 41, max: 65 },
  integration: { min: 66 },
};

const PHASE_DURATIONS: Record<PhaseType, { minWeeks: number; maxWeeks: number; checkpointIntervalWeeks: number }> = {
  stabilization: { minWeeks: 4, maxWeeks: 12, checkpointIntervalWeeks: 2 },
  transformation: { minWeeks: 6, maxWeeks: 16, checkpointIntervalWeeks: 3 },
  integration: { minWeeks: 8, maxWeeks: 52, checkpointIntervalWeeks: 4 },
};

export function assignPhase(adjustedScore: number, redFlags: RedFlag[]): PhaseType {
  const hasCritical = redFlags.some((f) => f.severity === "CRITICAL" || f.severity === "BLOCK");

  if (hasCritical) return "stabilization";
  if (adjustedScore <= PHASE_THRESHOLDS.stabilization.max) return "stabilization";
  if (adjustedScore <= PHASE_THRESHOLDS.transformation.max) return "transformation";
  return "integration";
}

export function generatePhases(
  phase: PhaseType,
  adjustedScore: number,
  redFlags: RedFlag[]
): { phases: PhaseOutput[]; checkpoints: CheckpointOutput[] } {
  // Guard: if phase is not a recognised key (e.g. from a bad rule value), fall back to stabilization
  const safePhase: PhaseType = (phase in PHASE_DURATIONS) ? phase : "stabilization";
  const config = PHASE_DURATIONS[safePhase];
  const scoreFactor = 1 - adjustedScore / 100;
  const flagExtension = redFlags.reduce((acc, f) => {
    if (f.severity === "CRITICAL") return acc + 3;
    if (f.severity === "WARNING") return acc + 1;
    return acc;
  }, 0);

  const rawWeeks = config.minWeeks + scoreFactor * (config.maxWeeks - config.minWeeks);
  const totalWeeks = Math.min(Math.round(rawWeeks) + flagExtension, config.maxWeeks);

  const phaseNames: Record<PhaseType, string> = {
    stabilization: "Stabilization Phase",
    transformation: "Transformation Phase",
    integration: "Integration Phase",
  };

  const phases: PhaseOutput[] = [
    { phaseType: safePhase, name: phaseNames[safePhase], estimatedWeeks: totalWeeks, order: 1 },
  ];

  const checkpoints: CheckpointOutput[] = [];
  for (let week = config.checkpointIntervalWeeks; week <= totalWeeks; week += config.checkpointIntervalWeeks) {
    checkpoints.push({
      week,
      criteria: [`Re-assess all module scores at week ${week}`, "Evaluate phase transition readiness"],
    });
  }

  return { phases, checkpoints };
}
