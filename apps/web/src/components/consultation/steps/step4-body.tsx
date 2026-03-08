"use client";

import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Body({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: data.body ?? {} });

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ body: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Body Optimization</h2>
        <p className="text-sm text-gray-500 mt-1">Lifestyle signals and hormonal markers</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10">Poor</span>
          <input {...register("sleepQualityScore", { valueAsNumber: true })} type="range" min={1} max={10} className="flex-1 accent-brand" />
          <span className="text-xs text-gray-400 w-16">Excellent</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level (1–10)</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10">Low</span>
          <input {...register("stressIndex", { valueAsNumber: true })} type="range" min={1} max={10} className="flex-1 accent-brand" />
          <span className="text-xs text-gray-400 w-10">High</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Physical Activity Level</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {["Sedentary", "Light", "Moderate", "Active", "Athlete"].map((a) => (
            <label key={a} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm">
              <input {...register("activityLevel")} type="radio" value={a.toLowerCase()} className="text-brand" />
              {a}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
        <select {...register("dietType")} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">Select...</option>
          <option value="omnivore">Omnivore</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="keto">Keto / Low-carb</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hormonal Events (last 12 months)</label>
        <div className="space-y-2">
          {["Post-partum", "Menopause transition", "Thyroid changes", "Significant medication change", "Significant weight change (±10kg)"].map((item) => (
            <label key={item} className="flex items-center gap-3 py-1 cursor-pointer">
              <input {...register("hormonalEvents")} type="checkbox" value={item.toLowerCase().replace(/\s+/g, "_")} className="h-4 w-4 rounded border-gray-300 text-brand" />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button type="button" onClick={onBack} className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900">← Back</button>
        <button type="submit" className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90">Continue →</button>
      </div>
    </form>
  );
}
