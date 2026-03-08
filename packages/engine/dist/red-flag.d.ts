import type { ClientProfile, RedFlag } from "./types.js";
export declare function evaluateRedFlags(profile: ClientProfile, redFlagRules: RedFlag[]): {
    flags: RedFlag[];
    totalPenalty: number;
    blocked: boolean;
};
//# sourceMappingURL=red-flag.d.ts.map