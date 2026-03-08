import type { Rule, ConditionNode, RuleAction, ClientProfile, ModuleScores } from "./types.js";

interface EvaluationContext {
  profile: ClientProfile;
  moduleScores: ModuleScores;
  compositeScore: number;
  activePhase?: string;
  redFlags: string[];
}

function resolveField(fieldPath: string, ctx: EvaluationContext): unknown {
  if (fieldPath === "composite_score") return ctx.compositeScore;
  if (fieldPath === "active_phase") return ctx.activePhase;

  const parts = fieldPath.split(".");
  const [module, ...rest] = parts;

  if (module === "scores") {
    return ctx.moduleScores[rest[0] as keyof typeof ctx.moduleScores];
  }

  const moduleData = ctx.profile[module as keyof ClientProfile];
  if (!moduleData || typeof moduleData !== "object") return undefined;

  return rest.reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, moduleData);
}

function applyOperator(operator: string, fieldValue: unknown, value: unknown, valueB?: unknown): boolean {
  switch (operator) {
    case "EQUALS": return fieldValue === value;
    case "NOT_EQUALS": return fieldValue !== value;
    case "GREATER_THAN": return typeof fieldValue === "number" && typeof value === "number" && fieldValue > value;
    case "LESS_THAN": return typeof fieldValue === "number" && typeof value === "number" && fieldValue < value;
    case "GREATER_THAN_OR_EQUAL": return typeof fieldValue === "number" && typeof value === "number" && fieldValue >= value;
    case "LESS_THAN_OR_EQUAL": return typeof fieldValue === "number" && typeof value === "number" && fieldValue <= value;
    case "BETWEEN":
      return typeof fieldValue === "number" && typeof value === "number" && typeof valueB === "number"
        && fieldValue >= value && fieldValue <= valueB;
    case "CONTAINS":
      if (Array.isArray(fieldValue)) return fieldValue.includes(value);
      if (typeof fieldValue === "string" && typeof value === "string") return fieldValue.includes(value);
      return false;
    case "IN":
      return Array.isArray(value) && value.includes(fieldValue);
    case "NOT_IN":
      return Array.isArray(value) && !value.includes(fieldValue);
    case "IS_NULL": return fieldValue === null || fieldValue === undefined;
    case "IS_NOT_NULL": return fieldValue !== null && fieldValue !== undefined;
    default: return false;
  }
}

function evaluateCondition(node: ConditionNode, ctx: EvaluationContext): boolean {
  if (node.type === "LEAF") {
    if (!node.field || !node.operator) return false;
    const fieldValue = resolveField(node.field, ctx);
    return applyOperator(node.operator, fieldValue, node.value, node.valueB);
  }
  if (node.type === "AND") {
    return (node.children ?? []).every((child) => evaluateCondition(child, ctx));
  }
  if (node.type === "OR") {
    return (node.children ?? []).some((child) => evaluateCondition(child, ctx));
  }
  if (node.type === "NOT") {
    const child = node.children?.[0];
    return child ? !evaluateCondition(child, ctx) : false;
  }
  return false;
}

export interface RuleEvaluationResult {
  status: "OK" | "BLOCKED";
  appliedActions: RuleAction[];
  triggeredRuleIds: string[];
}

export function evaluateRules(
  rules: Rule[],
  ctx: EvaluationContext
): RuleEvaluationResult {
  const sorted = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  const appliedActions: RuleAction[] = [];
  const triggeredRuleIds: string[] = [];

  for (const rule of sorted) {
    if (evaluateCondition(rule.condition, ctx)) {
      triggeredRuleIds.push(rule.id);
      for (const action of rule.actions) {
        appliedActions.push({ ...action, ...({ _sourceRuleId: rule.id } as object) });
      }

      if (appliedActions.some((a) => a.type === "BLOCK_PROTOCOL")) {
        return { status: "BLOCKED", appliedActions, triggeredRuleIds };
      }
    }
  }

  return { status: "OK", appliedActions, triggeredRuleIds };
}
