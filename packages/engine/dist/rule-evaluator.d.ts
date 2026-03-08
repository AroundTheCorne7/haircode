import type { Rule, RuleAction, ClientProfile, ModuleScores } from "./types.js";
interface EvaluationContext {
    profile: ClientProfile;
    moduleScores: ModuleScores;
    compositeScore: number;
    activePhase?: string;
    redFlags: string[];
}
export interface RuleEvaluationResult {
    status: "OK" | "BLOCKED";
    appliedActions: RuleAction[];
    triggeredRuleIds: string[];
}
export declare function evaluateRules(rules: Rule[], ctx: EvaluationContext): RuleEvaluationResult;
export {};
//# sourceMappingURL=rule-evaluator.d.ts.map