"use client";

import { useForm, Controller } from "react-hook-form";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TEXTURES = ["Straight", "Wavy", "Curly", "Coily", "Kinky"];
const POROSITY = ["Low", "Medium", "High", "Highly Damaged"];
const ELASTICITY = ["Excellent", "Good", "Moderate", "Poor"];

export function Step2Hair({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: data.hair ?? {},
  });

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ hair: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Hair Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">Structure, condition, and history</p>
      </div>

      {/* Texture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hair Texture <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TEXTURES.map((t) => (
            <label key={t} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input {...register("texture", { required: "Please select a hair texture" })} type="radio" value={t.toLowerCase()} className="text-brand" />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).texture && (
          <p className="mt-1 text-xs text-red-500">{(errors as Record<string, { message?: string }>).texture?.message}</p>
        )}
      </div>

      {/* Density Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Density</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-8">Low</span>
          <input {...register("density")} type="range" min={1} max={5} step={1} className="flex-1 accent-brand" />
          <span className="text-xs text-gray-400 w-8">High</span>
        </div>
      </div>

      {/* Porosity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Porosity Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {POROSITY.map((p) => (
            <label key={p} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input {...register("porosity")} type="radio" value={p.toLowerCase().replace(" ", "_")} className="text-brand" />
              <span className="text-sm">{p}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Elasticity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Elasticity (wet stretch test)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ELASTICITY.map((e) => (
            <label key={e} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input {...register("elasticity")} type="radio" value={e.toLowerCase()} className="text-brand" />
              <span className="text-sm">{e}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chemical History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chemical &amp; Thermal History</label>
        <div className="space-y-2">
          {["Colour-treated (permanent)", "Colour-treated (semi/demi)", "Bleach / Lightening", "Relaxer / Keratin", "Thermal damage (regular heat)"].map((item) => (
            <label key={item} className="flex items-center gap-3 py-2 cursor-pointer">
              <input {...register("chemicalHistory")} type="checkbox" value={item.toLowerCase().replace(/[^a-z]+/g, "_")} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Damage Index */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Overall Damage Index (0–10)</label>
        <input {...register("damageIndex", { valueAsNumber: true })} type="range" min={0} max={10} step={1} className="w-full accent-brand" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 — Virgin</span>
          <span>10 — Severely damaged</span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button type="button" onClick={onBack} className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">← Back</button>
        <button type="submit" className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">Continue →</button>
      </div>
    </form>
  );
}
