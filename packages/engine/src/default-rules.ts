import type { Rule } from "./types.js";

export const DEFAULT_RULES: Rule[] = [
  {
    id: "rule-001",
    name: "Block on open lesions",
    moduleScope: "scalp",
    isActive: true,
    priority: 100,
    weight: 1,
    conflictStrategy: "override",
    condition: {
      type: "LEAF",
      field: "scalp.openLesions",
      operator: "EQUALS",
      value: true,
    },
    actions: [
      { type: "BLOCK_PROTOCOL", value: "Open scalp lesions — chemical services contraindicated." },
      { type: "TRIGGER_ALERT", target: "OPEN_LESIONS", value: "BLOCK" },
    ],
  },
  {
    id: "rule-002",
    name: "Critical alert on severe damage",
    moduleScope: "hair",
    isActive: true,
    priority: 90,
    weight: 1,
    conflictStrategy: "override",
    condition: {
      type: "LEAF",
      field: "hair.damageIndex",
      operator: "GREATER_THAN_OR_EQUAL",
      value: 9,
    },
    actions: [
      { type: "TRIGGER_ALERT", target: "SEVERE_DAMAGE", value: "CRITICAL" },
      { type: "SET_PHASE", value: "stabilization" },
    ],
  },
  {
    id: "rule-003",
    name: "Warning on seborrheic scalp + elevated pH",
    moduleScope: "scalp",
    isActive: true,
    priority: 80,
    weight: 0.8,
    conflictStrategy: "merge",
    condition: {
      type: "AND",
      children: [
        // Spec §5.7: condition value is UPPERCASE — "seborrheic" (lowercase) must NOT match
        { type: "LEAF", field: "scalp.biotype", operator: "EQUALS", value: "SEBORRHEIC" },
        { type: "LEAF", field: "scalp.phLevel", operator: "GREATER_THAN", value: 5.5 },
      ],
    },
    actions: [
      { type: "TRIGGER_ALERT", target: "SEBORRHEIC_HIGH_PH", value: "WARNING" },
    ],
  },
  {
    id: "rule-004",
    name: "Penalise high porosity",
    moduleScope: "hair",
    isActive: true,
    priority: 70,
    weight: 0.6,
    conflictStrategy: "merge",
    condition: {
      type: "LEAF",
      field: "hair.porosity",
      // Spec §5.7: condition value is UPPERCASE — "high" (lowercase) must NOT match
      operator: "EQUALS",
      value: "HIGH",
    },
    actions: [
      { type: "ADJUST_SCORE", target: "hair", value: -5, modifier: "ADD" },
    ],
  },
  {
    id: "rule-005",
    name: "Boost score for excellent body health",
    moduleScope: "body",
    isActive: false, // disabled: references phantom fields nutritionalScore not collected by the form
    priority: 60,
    weight: 0.5,
    conflictStrategy: "merge",
    condition: {
      type: "AND",
      children: [
        { type: "LEAF", field: "body.nutritionalScore", operator: "GREATER_THAN_OR_EQUAL", value: 8 },
        { type: "LEAF", field: "body.stressIndex", operator: "LESS_THAN_OR_EQUAL", value: 3 },
      ],
    },
    actions: [
      { type: "ADJUST_SCORE", target: "body", value: 8, modifier: "ADD" },
    ],
  },
  {
    id: "rule-006",
    name: "Warning on high stress + hormonal disruption",
    moduleScope: "body",
    isActive: false, // disabled: references phantom field hormonalIndex not collected by the form
    priority: 75,
    weight: 0.7,
    conflictStrategy: "merge",
    condition: {
      type: "AND",
      children: [
        { type: "LEAF", field: "body.stressIndex", operator: "GREATER_THAN_OR_EQUAL", value: 8 },
        { type: "LEAF", field: "body.hormonalIndex", operator: "GREATER_THAN_OR_EQUAL", value: 7 },
      ],
    },
    actions: [
      { type: "TRIGGER_ALERT", target: "HIGH_STRESS_HORMONAL", value: "WARNING" },
    ],
  },
];
