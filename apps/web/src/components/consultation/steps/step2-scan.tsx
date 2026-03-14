"use client";

import { useState } from "react";
import type { ConsultationData } from "../wizard";
import { FaceScanModal, type DetectedFeatures } from "../FaceScanModal";

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type ColorSeason = "spring" | "summer" | "autumn" | "winter";
type ContrastScore = 1 | 2 | 3 | 4 | 5;

/** Derives the 4-season color type from undertone + contrast */
function deriveColorSeason(
  undertone: "warm" | "neutral" | "cool",
  contrast: "low" | "medium" | "high",
): ColorSeason {
  if (undertone === "warm") {
    return contrast === "high" ? "autumn" : "spring";
  }
  if (undertone === "cool") {
    return contrast === "high" ? "winter" : "summer";
  }
  // neutral undertone — use contrast to decide
  return contrast === "high" ? "winter" : "summer";
}

/** Maps the 3-level contrast to a 1-5 score */
function deriveContrastScore(
  contrast: "low" | "medium" | "high",
): ContrastScore {
  if (contrast === "low") return 2;
  if (contrast === "medium") return 3;
  return 4;
}

export function Step2Scan({ data, onUpdate, onNext, onBack }: Props) {
  const [showScan, setShowScan] = useState(false);
  const [scanned, setScanned] = useState<DetectedFeatures | null>(null);

  const handleDetected = (features: DetectedFeatures) => {
    setScanned(features);
    setShowScan(false);

    const colorSeason = deriveColorSeason(
      features.undertone,
      features.contrastLevel,
    );
    const contrastScore = deriveContrastScore(features.contrastLevel);

    // Auto-fill morphology (faceShape, undertone) and color (season, contrast)
    onUpdate({
      morphology: {
        ...(data.morphology ?? {}),
        faceShape:
          features.faceShape === "oblong" ? "rectangular" : features.faceShape,
        undertone: features.undertone,
        contrastScore,
      },
      color: {
        ...(data.color ?? {}),
        colorSeason,
        contrastScore,
        undertone: features.undertone,
      },
    });
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      {showScan && (
        <FaceScanModal
          onDetected={handleDetected}
          onClose={() => setShowScan(false)}
        />
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900">Face Scan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Take a photo to auto-detect face shape, skin undertone, and colour
          season
        </p>
      </div>

      {/* Scan area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center">
        {scanned ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Face Shape", value: scanned.faceShape },
                { label: "Undertone", value: scanned.undertone },
                { label: "Contrast", value: scanned.contrastLevel },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Derived season */}
            <div className="bg-brand/5 border border-brand/10 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">
                Auto-detected Colour Season
              </p>
              <p className="text-lg font-semibold text-brand capitalize">
                {deriveColorSeason(scanned.undertone, scanned.contrastLevel)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on {scanned.undertone} undertone + {scanned.contrastLevel}{" "}
                contrast
              </p>
            </div>

            <p className="text-xs text-gray-400">
              You can adjust these values in the next steps if needed
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📷</span>
            </div>
            <p className="text-sm font-medium text-gray-700">
              Auto-detect with camera
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Detects face shape, skin undertone, and visual contrast in one
              scan. Determines your colour season automatically.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => setShowScan(true)}
          className="mt-4 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          {scanned ? "Re-scan" : "Use Camera"}
        </button>
        <p className="text-xs text-gray-400 mt-3">
          Processed on-device only &middot; not stored or transmitted
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back
        </button>
        <div className="flex gap-2">
          {!scanned && (
            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
            >
              Skip &mdash; enter manually
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
