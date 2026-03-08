export type ModuleType = "hair" | "scalp" | "body" | "morphology";
export type PhaseType = "stabilization" | "transformation" | "integration";
export type RedFlagSeverity = "INFO" | "WARNING" | "CRITICAL" | "BLOCK";
export type Operator = "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN_OR_EQUAL" | "BETWEEN" | "CONTAINS" | "NOT_CONTAINS" | "IN" | "NOT_IN" | "IS_NULL" | "IS_NOT_NULL";
export interface FieldNormalizer {
    fieldPath: string;
    type: "ENUM_MAP" | "RANGE_SCALE" | "BOOLEAN_SCORE" | "INVERTED_LINEAR";
    map?: Record<string, number>;
    inputMin?: number;
    inputMax?: number;
    optimalMin?: number;
    optimalMax?: number;
    outputMin?: number;
    outputMax?: number;
}
export interface WeightConfig {
    modules: Record<ModuleType, number>;
    fields: Record<ModuleType, Record<string, number>>;
}
export interface ConditionNode {
    type: "AND" | "OR" | "NOT" | "LEAF";
    field?: string;
    operator?: Operator;
    value?: unknown;
    valueB?: unknown;
    children?: ConditionNode[];
}
export interface RuleAction {
    type: "SET_PHASE" | "ADJUST_SCORE" | "ADD_SERVICE" | "REMOVE_SERVICE" | "SET_FREQUENCY" | "TRIGGER_ALERT" | "SET_CHECKPOINT" | "BLOCK_PROTOCOL";
    target?: string;
    value?: unknown;
    modifier?: "SET" | "ADD" | "MULTIPLY";
}
export interface Rule {
    id: string;
    name: string;
    moduleScope: ModuleType | "global" | "composite";
    isActive: boolean;
    priority: number;
    weight: number;
    condition: ConditionNode;
    actions: RuleAction[];
    conflictStrategy: "override" | "merge" | "highest_priority";
}
export interface RedFlag {
    code: string;
    severity: RedFlagSeverity;
    message: string;
    penaltyFactor: number;
    requiresAcknowledgment: boolean;
}
export interface ClientProfile {
    clientId: string;
    hair?: Record<string, unknown>;
    scalp?: Record<string, unknown>;
    body?: Record<string, unknown>;
    morphology?: Record<string, unknown>;
}
export interface EvaluationInput {
    profile: ClientProfile;
    rules: Rule[];
    weights: WeightConfig;
    normalizers: FieldNormalizer[];
    redFlagRules: RedFlag[];
    includeTrace?: boolean;
}
export interface ModuleScores {
    hair: number;
    scalp: number;
    body: number;
    morphology: number;
}
export interface EvaluationResult {
    evaluationId: string;
    compositeScore: number;
    adjustedScore: number;
    moduleScores: ModuleScores;
    assignedPhase: PhaseType;
    redFlags: RedFlag[];
    appliedActions: RuleAction[];
    protocol: ProtocolOutput;
    trace?: EvaluationTrace;
}
export interface ProtocolOutput {
    phases: PhaseOutput[];
    services: ServiceOutput[];
    checkpoints: CheckpointOutput[];
    frequency: {
        interval: number;
        unit: "days" | "weeks";
    } | null;
}
export interface PhaseOutput {
    phaseType: PhaseType;
    name: string;
    estimatedWeeks: number;
    order: number;
}
export interface ServiceOutput {
    name: string;
    frequency: string;
    priority: "mandatory" | "recommended" | "optional";
    phaseType: PhaseType;
}
export interface CheckpointOutput {
    week: number;
    criteria: string[];
}
export interface EvaluationTrace {
    rulesEvaluated: number;
    rulesFired: number;
    ruleDetails: Array<{
        ruleId: string;
        fired: boolean;
        conditionResult: boolean;
    }>;
}
//# sourceMappingURL=types.d.ts.map