"use client";

import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FACE_SHAPES = ["Oval", "Round", "Square", "Heart", "Diamond", "Oblong", "Triangle"];

export function Step5Morphology({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: data.morphology ?? {} });

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ morphology: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Morphology & Visagism</h2>
        <p className="text-sm text-gray-500 mt-1">Face shape and aesthetic classification</p>
      </div>

      {/* Camera capture placeholder */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📷</span>
        </div>
        <p className="text-sm font-medium text-gray-700">Face Scan</p>
        <p className="text-xs text-gray-400 mt-1">TrueDepth camera analysis (iPad only)</p>
        <button type="button" className="mt-3 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          Use Camera
        </button>
        <p className="text-xs text-gray-400 mt-3">Facial geometry processed on-device only. Not stored or transmitted.</p>
      </div>

      <div className="text-center text-sm text-gray-400">— or enter manually —</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Face Shape <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {FACE_SHAPES.map((shape) => (
            <label key={shape} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm">
              <input {...register("faceShape", { required: "Please select a face shape" })} type="radio" value={shape.toLowerCase()} className="text-brand" />
              {shape}
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).faceShape && (
          <p className="mt-1 text-xs text-red-500">{(errors as Record<string, { message?: string }>).faceShape?.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skin Undertone <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {["Warm", "Neutral", "Cool"].map((t) => (
            <label key={t} className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center">
              <input {...register("undertone", { required: "Please select a skin undertone" })} type="radio" value={t.toLowerCase()} className="text-brand" />
              {t}
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).undertone && (
          <p className="mt-1 text-xs text-red-500">{(errors as Record<string, { message?: string }>).undertone?.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visual Contrast Level</label>
        <div className="flex flex-wrap gap-3">
          {["Low", "Medium", "High"].map((c) => (
            <label key={c} className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center">
              <input {...register("contrastLevel")} type="radio" value={c.toLowerCase()} className="text-brand" />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button type="button" onClick={onBack} className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900">← Back</button>
        <button type="submit" className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90">
          Generate Protocol →
        </button>
      </div>
    </form>
  );
}
