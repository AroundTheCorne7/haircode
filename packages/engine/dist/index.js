import { randomUUID } from "crypto";
import { computeModuleScores, computeCompositeScore } from "./scorer.js";
import { evaluateRedFlags } from "./red-flag.js";
import { evaluateRules } from "./rule-evaluator.js";
import { assignPhase, generatePhases } from "./phase-generator.js";
import { runDesignEngine } from "./design-engine.js";
export * from "./types.js";
export { DEFAULT_RULES } from "./default-rules.js";
export { DEFAULT_WEIGHTS } from "./weights.js";
export async function evaluate(input) {
    const { profile, rules = [], weights, normalizers = [], redFlagRules = [], includeTrace, } = input;
    // Step 1: Compute module scores
    const moduleScores = computeModuleScores(profile, normalizers, weights);
    // Step 2: Compute composite score
    const compositeScore = computeCompositeScore(moduleScores, weights.modules);
    // Step 3: Evaluate red flags
    const { flags, totalPenalty, blocked } = evaluateRedFlags(profile, redFlagRules);
    if (blocked) {
        return {
            evaluationId: randomUUID(),
            compositeScore,
            adjustedScore: 0,
            moduleScores,
            assignedPhase: "stabilization",
            redFlags: flags,
            appliedActions: [],
            // Spec §5.9 Scenario A: frequency is {interval:0, unit:"weeks"} when blocked
            protocol: {
                phases: [],
                services: [],
                checkpoints: [],
                frequency: { interval: 0, unit: "weeks" },
            },
        };
    }
    // Step 4: Apply red flag penalty
    const adjustedScore = compositeScore * (1 - totalPenalty);
    // Step 5: Evaluate rules
    const ctx = {
        profile,
        moduleScores,
        compositeScore: adjustedScore,
        redFlags: flags.map((f) => f.code),
    };
    const ruleResult = evaluateRules(rules, ctx);
    // If a rule fired BLOCK_PROTOCOL, return a blocked result immediately
    if (ruleResult.status === "BLOCKED") {
        return {
            evaluationId: randomUUID(),
            compositeScore,
            adjustedScore,
            moduleScores,
            assignedPhase: "stabilization",
            redFlags: flags,
            appliedActions: ruleResult.appliedActions,
            protocol: { phases: [], services: [], checkpoints: [], frequency: null },
        };
    }
    // Step 6: Determine phase (from rules or score)
    const phaseAction = ruleResult.appliedActions.find((a) => a.type === "SET_PHASE");
    const assignedPhase = phaseAction?.value
        ? phaseAction.value
        : assignPhase(adjustedScore, flags);
    // Step 7: Generate phases and checkpoints
    const { phases, checkpoints } = generatePhases(assignedPhase, adjustedScore, flags);
    // Step 8: Extract services from rule actions
    const services = ruleResult.appliedActions
        .filter((a) => a.type === "ADD_SERVICE")
        .map((a) => ({
        name: String(a.value ?? "Unknown Service"),
        frequency: "As prescribed",
        priority: "recommended",
        phaseType: assignedPhase,
    }));
    // Step 9: Determine frequency
    const frequencyAction = ruleResult.appliedActions.find((a) => a.type === "SET_FREQUENCY");
    const frequency = frequencyAction?.value
        ? frequencyAction.value
        : { interval: 14, unit: "days" };
    // Step 10: Run Design Engine (6-layer methodology → TransformationBlueprint)
    const blueprintResult = runDesignEngine(profile, assignedPhase, adjustedScore, flags);
    const result = {
        evaluationId: randomUUID(),
        compositeScore,
        adjustedScore,
        moduleScores,
        assignedPhase,
        redFlags: flags,
        appliedActions: ruleResult.appliedActions,
        protocol: { phases, services, checkpoints, frequency },
        ...(blueprintResult != null ? { blueprint: blueprintResult } : {}),
    };
    if (includeTrace) {
        result.trace = {
            rulesEvaluated: rules.filter((r) => r.isActive).length,
            rulesFired: ruleResult.triggeredRuleIds.length,
            ruleDetails: ruleResult.triggeredRuleIds.map((id) => ({
                ruleId: id,
                fired: true,
                conditionResult: true,
            })),
        };
    }
    return result;
}
//# sourceMappingURL=index.js.map