"use client";

import { useForm } from "react-hook-form";
import type { ConsultationData } from "../wizard";

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
    formState: { errors },
  } = useForm({ defaultValues: data.morphology ?? {} });

  const hasScanData = Boolean(data.morphology?.faceShape);

  const onSubmit = (values: Record<string, unknown>) => {
    onUpdate({ morphology: values });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Morphology & Visagism
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Face shape, body proportions and structural classification
        </p>
      </div>

      {hasScanData && (
        <div className="bg-brand/5 border border-brand/10 rounded-lg p-3 flex items-start gap-2">
          <span className="text-brand text-sm mt-0.5">&#10003;</span>
          <div>
            <p className="text-sm font-medium text-gray-800">
              Face shape pre-filled from scan
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Adjust below if needed, then fill in neck length, shoulders, and
              body type
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Face Shape <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
          &larr; Back
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90"
        >
          Continue &rarr;
        </button>
      </div>
    </form>
  );
}
