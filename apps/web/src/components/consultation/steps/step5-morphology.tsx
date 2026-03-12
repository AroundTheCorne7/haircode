"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";
import { FaceScanModal, type DetectedFeatures } from "../FaceScanModal";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FACE_SHAPES = [
  "Oval",
  "Round",
  "Square",
  "Heart",
  "Diamond",
  "Rectangular",
];
const NECK_LENGTHS = ["Short", "Medium", "Long"];
const SHOULDER_WIDTHS = ["Narrow", "Balanced", "Wide"];
const BODY_TYPES = ["Hourglass", "Rectangle", "Triangle", "Inverted Triangle"];

export function Step5Morphology({ data, onUpdate, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: data.morphology ?? {} });
  const [showScan, setShowScan] = useState(false);
  const [scanned, setScanned] = useState<DetectedFeatures | null>(null);

  const selectedShape = watch("faceShape") as string | undefined;

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ morphology: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {showScan && (
        <FaceScanModal
          onDetected={(features) => {
            setValue("faceShape", features.faceShape, { shouldValidate: true });
            setValue("undertone", features.undertone, { shouldValidate: true });
            setValue("contrastLevel", features.contrastLevel);
            setScanned(features);
            setShowScan(false);
          }}
          onClose={() => setShowScan(false)}
        />
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Morphology & Visagism
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Face shape and aesthetic classification
        </p>
      </div>

      {/* Camera capture */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-6 text-center">
        {scanned ? (
          <>
            <div className="flex justify-center gap-6 mb-3">
              {[
                { label: "Shape", value: scanned.faceShape },
                { label: "Undertone", value: scanned.undertone },
                { label: "Contrast", value: scanned.contrastLevel },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {value}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Fields auto-filled — adjust below if needed
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-sm font-medium text-gray-700">Face Scan</p>
            <p className="text-xs text-gray-400 mt-1">
              Auto-detects shape · undertone · contrast
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowScan(true)}
          className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {scanned ? "Re-scan" : "Use Camera"}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Processed on-device only · not stored or transmitted.
        </p>
      </div>

      <div className="text-center text-sm text-gray-400">
        — or select manually —
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Face Shape <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {FACE_SHAPES.map((shape) => (
            <label
              key={shape}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm"
            >
              <input
                {...register("faceShape", {
                  required: "Please select a face shape",
                })}
                type="radio"
                value={shape.toLowerCase()}
                className="text-brand"
              />
              {shape}
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).faceShape && (
          <p className="mt-1 text-xs text-red-500">
            {
              (errors as Record<string, { message?: string }>).faceShape
                ?.message
            }
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skin Undertone <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {["Warm", "Neutral", "Cool"].map((t) => (
            <label
              key={t}
              className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center"
            >
              <input
                {...register("undertone", {
                  required: "Please select a skin undertone",
                })}
                type="radio"
                value={t.toLowerCase()}
                className="text-brand"
              />
              {t}
            </label>
          ))}
        </div>
        {(errors as Record<string, { message?: string }>).undertone && (
          <p className="mt-1 text-xs text-red-500">
            {
              (errors as Record<string, { message?: string }>).undertone
                ?.message
            }
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visual Contrast Score
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
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0">
          <span>1 — Very Low</span>
          <span>2 — Low</span>
          <span>3 — Medium</span>
          <span>4 — High</span>
          <span>5 — Extreme</span>
        </div>
        {/* Keep contrastLevel for backward compatibility — hidden, derived from contrastScore */}
        <input {...register("contrastLevel")} type="hidden" />
      </div>

      {/* Neck Length */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neck Length
        </label>
        <div className="flex flex-wrap gap-3">
          {NECK_LENGTHS.map((n) => (
            <label
              key={n}
              className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center"
            >
              <input
                {...register("neckLength")}
                type="radio"
                value={n.toLowerCase()}
                className="text-brand"
              />
              {n}
            </label>
          ))}
        </div>
      </div>

      {/* Shoulder Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shoulder Width
        </label>
        <div className="flex flex-wrap gap-3">
          {SHOULDER_WIDTHS.map((s) => (
            <label
              key={s}
              className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm justify-center"
            >
              <input
                {...register("shoulderWidth")}
                type="radio"
                value={s.toLowerCase()}
                className="text-brand"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* Body Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Body Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BODY_TYPES.map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/5 text-sm"
            >
              <input
                {...register("bodyType")}
                type="radio"
                value={b.toLowerCase().replace(" ", "_")}
                className="text-brand"
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90"
        >
          Generate Protocol →
        </button>
      </div>
    </form>
  );
}
