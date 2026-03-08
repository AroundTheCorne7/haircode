function resolveField(fieldPath, ctx) {
    if (fieldPath === "composite_score")
        return ctx.compositeScore;
    if (fieldPath === "active_phase")
        return ctx.activePhase;
    const parts = fieldPath.split(".");
    const [module, ...rest] = parts;
    if (module === "scores") {
        return ctx.moduleScores[rest[0]];
    }
    const moduleData = ctx.profile[module];
    if (!moduleData || typeof moduleData !== "object")
        return undefined;
    return rest.reduce((acc, key) => {
        if (acc !== null && typeof acc === "object") {
            return acc[key];
        }
        return undefined;
    }, moduleData);
}
function applyOperator(operator, fieldValue, value, valueB) {
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
            if (Array.isArray(fieldValue))
                return fieldValue.includes(value);
            if (typeof fieldValue === "string" && typeof value === "string")
                return fieldValue.includes(value);
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
function evaluateCondition(node, ctx) {
    if (node.type === "LEAF") {
        if (!node.field || !node.operator)
            return false;
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
export function evaluateRules(rules, ctx) {
    const sorted = [...rules]
        .filter((r) => r.isActive)
        .sort((a, b) => b.priority - a.priority);
    const appliedActions = [];
    const triggeredRuleIds = [];
    for (const rule of sorted) {
        if (evaluateCondition(rule.condition, ctx)) {
            triggeredRuleIds.push(rule.id);
            for (const action of rule.actions) {
                appliedActions.push({ ...action, ...{ _sourceRuleId: rule.id } });
            }
            if (appliedActions.some((a) => a.type === "BLOCK_PROTOCOL")) {
                return { status: "BLOCKED", appliedActions, triggeredRuleIds };
            }
        }
    }
    return { status: "OK", appliedActions, triggeredRuleIds };
}
//# sourceMappingURL=rule-evaluator.js.map