"use client";

import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Scalp({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: data.scalp ?? {} });

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ scalp: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Scalp Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">Sebum, sensitivity, and condition mapping</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scalp Biotype <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {["Dry", "Normal", "Oily", "Combination", "Sensitized"].map((b) => (
            <label key={b} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm">
              <input {...register("biotype", { required: "Please select a scalp biotype" })} type="radio" value={b.toLowerCase()} className="text-brand" />
              {b}
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).biotype && (
          <p className="mt-1 text-xs text-red-500">{(errors as Record<string, { message?: string }>).biotype?.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sebum Production</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10">Dry</span>
          <input {...register("sebumProduction")} type="range" min={1} max={4} step={1} className="flex-1 accent-brand" />
          <span className="text-xs text-gray-400 w-10">Very Oily</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sensitivity Level (1–5)</label>
        <input {...register("sensitivityLevel", { valueAsNumber: true })} type="range" min={1} max={5} step={1} className="w-full accent-brand" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 — Not sensitive</span>
          <span>5 — Extremely sensitive</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">pH Level (if measured)</label>
        <input {...register("phLevel", { valueAsNumber: true })} type="number" step="0.1" min="3.5" max="7.5" placeholder="e.g. 5.2" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Condition Flags</label>
        <div className="space-y-2">
          {[
            { value: "dandruff", label: "Dandruff / Pityriasis" },
            { value: "seborrheic", label: "Seborrheic condition" },
            { value: "psoriasis", label: "Psoriasis indicators" },
            { value: "open_lesions", label: "Open lesions / active infection" },
            { value: "alopecia", label: "Alopecia pattern" },
            { value: "folliculitis", label: "Folliculitis signs" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
              <input {...register("conditions")} type="checkbox" value={item.value} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <span className="text-sm text-gray-700">{item.label}</span>
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
