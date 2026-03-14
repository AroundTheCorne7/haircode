"use client";

import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COLOR_SEASONS = [
  {
    value: "spring",
    label: "Spring",
    subtitle: "Warm & light — golden, peachy, bright tones",
  },
  {
    value: "summer",
    label: "Summer",
    subtitle: "Cool & light — ash, dusty rose, soft tones",
  },
  {
    value: "autumn",
    label: "Autumn",
    subtitle: "Warm & deep — copper, auburn, muted tones",
  },
  {
    value: "winter",
    label: "Winter",
    subtitle: "Cool & deep — bold contrast, vivid tones",
  },
] as const;

const NATURAL_HAIR_COLORS = [
  "ash blonde",
  "golden blonde",
  "light brown",
  "medium brown",
  "dark brown",
  "black",
  "red",
  "grey",
  "white",
] as const;

export function Step3bColorIdentity({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: data.color ?? {},
  });

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ color: values as NonNullable<ConsultationData["color"]> });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Colour Identity</h2>
        <p className="text-sm text-gray-500 mt-1">
          Seasonal colour analysis and contrast profile
        </p>
      </div>

      {data.color?.colorSeason && (
        <div className="bg-brand/5 border border-brand/10 rounded-lg p-3 flex items-start gap-2">
          <span className="text-brand text-sm mt-0.5">&#10003;</span>
          <div>
            <p className="text-sm font-medium text-gray-800">
              Pre-filled from face scan &mdash;{" "}
              <span className="capitalize">{data.color.colorSeason}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and adjust below if needed, or add your natural hair colour
              and eye colour
            </p>
          </div>
        </div>
      )}

      {/* Colour Season */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Colour Season
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COLOR_SEASONS.map(({ value, label, subtitle }) => (
            <label
              key={value}
              className="flex items-start gap-3 px-3 py-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input
                {...register("colorSeason")}
                type="radio"
                value={value}
                className="text-brand mt-0.5 shrink-0"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Contrast Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contrast Score
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16">Very Low</span>
          <input
            {...register("contrastScore", { valueAsNumber: true })}
            type="range"
            min={1}
            max={5}
            step={1}
            className="flex-1 accent-brand"
          />
          <span className="text-xs text-gray-400 w-12">Extreme</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 — Very Low</span>
          <span>2 — Low</span>
          <span>3 — Medium</span>
          <span>4 — High</span>
          <span>5 — Extreme</span>
        </div>
      </div>

      {/* Undertone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Undertone
        </label>
        <div className="flex flex-wrap gap-3">
          {(["Warm", "Neutral", "Cool"] as const).map((t) => (
            <label
              key={t}
              className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center"
            >
              <input
                {...register("undertone")}
                type="radio"
                value={t.toLowerCase()}
                className="text-brand"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* Natural Hair Colour */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Natural Hair Colour
        </label>
        <select
          {...register("naturalHairColor")}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
        >
          <option value="">Select a colour…</option>
          {NATURAL_HAIR_COLORS.map((color) => (
            <option key={color} value={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Eye Colour */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Eye Colour{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          {...register("eyeColor")}
          type="text"
          placeholder="e.g. hazel, blue-green, dark brown"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
        />
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
