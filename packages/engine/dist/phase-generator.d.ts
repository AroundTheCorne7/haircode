import type { PhaseType, RedFlag, PhaseOutput, CheckpointOutput } from "./types.js";
export declare function assignPhase(adjustedScore: number, redFlags: RedFlag[]): PhaseType;
export declare function generatePhases(phase: PhaseType, adjustedScore: number, redFlags: RedFlag[]): {
    phases: PhaseOutput[];
    checkpoints: CheckpointOutput[];
};
//# sourceMappingURL=phase-generator.d.ts.map