"use client";

import { useState } from "react";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type ArchetypeValue =
  | "natural"
  | "elegant"
  | "dramatic"
  | "classic"
  | "creative"
  | "sensual";

type ArchetypeData = NonNullable<ConsultationData["archetype"]>;

const ARCHETYPES: { value: ArchetypeValue; label: string; keywords: string }[] =
  [
    {
      value: "natural",
      label: "Natural",
      keywords: "Effortless · Organic · Relaxed · Authentic",
    },
    {
      value: "elegant",
      label: "Elegant",
      keywords: "Refined · Polished · Timeless · Sophisticated",
    },
    {
      value: "dramatic",
      label: "Dramatic",
      keywords: "Bold · Statement · Avant-garde · Striking",
    },
    {
      value: "classic",
      label: "Classic",
      keywords: "Timeless · Balanced · Structured · Conservative",
    },
    {
      value: "creative",
      label: "Creative",
      keywords: "Expressive · Unique · Experimental · Artistic",
    },
    {
      value: "sensual",
      label: "Sensual",
      keywords: "Lush · Romantic · Voluminous · Flowing",
    },
  ];

const MAINTENANCE: {
  value: "minimal" | "moderate" | "intensive";
  label: string;
  descriptor: string;
}[] = [
  {
    value: "minimal",
    label: "Minimal",
    descriptor: "Low upkeep, wash-and-go styles",
  },
  {
    value: "moderate",
    label: "Moderate",
    descriptor: "Regular trims and occasional colour",
  },
  {
    value: "intensive",
    label: "Intensive",
    descriptor: "Frequent salon visits, complex styles",
  },
];

export function Step5bArchetype({ data, onUpdate, onNext, onBack }: Props) {
  const [local, setLocal] = useState<ArchetypeData>(data.archetype ?? {});
  const [blendEnabled, setBlendEnabled] = useState(
    data.archetype?.secondaryArchetype !== undefined,
  );

  const primaryWeight = local.primaryWeight ?? 100;
  const secondaryWeight = 100 - primaryWeight;

  const update = (next: ArchetypeData) => {
    setLocal(next);
  };

  const handlePrimaryChange = (value: ArchetypeValue) => {
    const next: ArchetypeData = {
      ...local,
      primaryArchetype: value,
      primaryWeight: blendEnabled ? (local.primaryWeight ?? 70) : 100,
    };
    if (blendEnabled) {
      if (next.secondaryArchetype === value) {
        delete next.secondaryArchetype;
        delete next.secondaryWeight;
      } else {
        next.secondaryWeight = 100 - (next.primaryWeight ?? 70);
      }
    } else {
      delete next.secondaryArchetype;
      delete next.secondaryWeight;
    }
    update(next);
  };

  const handleBlendToggle = (enabled: boolean) => {
    setBlendEnabled(enabled);
    if (enabled) {
      update({
        ...local,
        primaryWeight: 70,
        secondaryWeight: 30,
      });
    } else {
      const next: ArchetypeData = { ...local, primaryWeight: 100 };
      delete next.secondaryArchetype;
      delete next.secondaryWeight;
      update(next);
    }
  };

  const handleSecondaryChange = (value: ArchetypeValue) => {
    update({
      ...local,
      secondaryArchetype: value,
      secondaryWeight: 100 - (local.primaryWeight ?? 70),
    });
  };

  const handlePrimaryWeightChange = (weight: number) => {
    update({
      ...local,
      primaryWeight: weight,
      secondaryWeight: 100 - weight,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ archetype: local });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Archetype Identity
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Aesthetic personality and style direction
        </p>
      </div>

      {/* Primary Archetype */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Archetype
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ARCHETYPES.map(({ value, label, keywords }) => {
            const isSelected = local.primaryArchetype === value;
            return (
              <label
                key={value}
                className={`flex flex-col gap-1 px-3 py-3 border rounded-lg cursor-pointer transition-colors hover:border-brand ${
                  isSelected ? "border-brand bg-brand/5" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="primaryArchetype"
                  value={value}
                  checked={isSelected}
                  onChange={() => handlePrimaryChange(value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>
                <span className="text-xs text-gray-500">{keywords}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Blend Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={blendEnabled}
            onChange={(e) => handleBlendToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium text-gray-700">
            Blend with a secondary archetype
          </span>
        </label>
      </div>

      {blendEnabled && (
        <>
          {/* Secondary Archetype */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Archetype
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ARCHETYPES.map(({ value, label, keywords }) => {
                const isDisabled = value === local.primaryArchetype;
                const isSelected = local.secondaryArchetype === value;
                return (
                  <label
                    key={value}
                    className={`flex flex-col gap-1 px-3 py-3 border rounded-lg transition-colors ${
                      isDisabled
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : `cursor-pointer hover:border-brand ${
                            isSelected
                              ? "border-brand bg-brand/5"
                              : "border-gray-200"
                          }`
                    }`}
                  >
                    <input
                      type="radio"
                      name="secondaryArchetype"
                      value={value}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleSecondaryChange(value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {label}
                    </span>
                    <span className="text-xs text-gray-500">{keywords}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Blend Weights Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blend —{" "}
              <span className="text-gray-500 font-normal">
                Primary:{" "}
                <span className="text-brand font-semibold">
                  {primaryWeight}%
                </span>
                {" | "}
                Secondary:{" "}
                <span className="text-brand font-semibold">
                  {secondaryWeight}%
                </span>
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-10 text-right">51%</span>
              <input
                type="range"
                min={51}
                max={90}
                step={1}
                value={
                  primaryWeight < 51
                    ? 51
                    : primaryWeight > 90
                      ? 90
                      : primaryWeight
                }
                onChange={(e) =>
                  handlePrimaryWeightChange(Number(e.target.value))
                }
                className="flex-1 accent-brand"
              />
              <span className="text-xs text-gray-400 w-10">90%</span>
            </div>
          </div>
        </>
      )}

      {/* Maintenance Commitment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maintenance Commitment
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MAINTENANCE.map(({ value, label, descriptor }) => (
            <label
              key={value}
              className={`flex items-start gap-2 px-3 py-3 border rounded-lg cursor-pointer transition-colors hover:border-brand ${
                local.maintenanceCommitment === value
                  ? "border-brand bg-brand/5"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="maintenanceCommitment"
                value={value}
                checked={local.maintenanceCommitment === value}
                onChange={() =>
                  update({ ...local, maintenanceCommitment: value })
                }
                className="text-brand mt-0.5 shrink-0"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>
                <span className="text-xs text-gray-500">{descriptor}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
