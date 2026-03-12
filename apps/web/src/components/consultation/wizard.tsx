"use client";

import { useState } from "react";
import { StepIndicator } from "./step-indicator";
import { Step1Profile } from "./steps/step1-profile";
import { Step2Hair } from "./steps/step2-hair";
import { Step3Scalp } from "./steps/step3-scalp";
import { Step3bColorIdentity } from "./steps/step3b-color-identity";
import { Step4Body } from "./steps/step4-body";
import { Step5Morphology } from "./steps/step5-morphology";
import { Step5bArchetype } from "./steps/step5b-archetype";
import { Step6Protocol } from "./steps/step6-protocol";

export type ConsultationData = {
  clientId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  genderIdentity?: string;
  hair?: Record<string, unknown>;
  scalp?: Record<string, unknown>;
  color?: {
    colorSeason?: "spring" | "summer" | "autumn" | "winter";
    contrastScore?: 1 | 2 | 3 | 4 | 5;
    undertone?: "warm" | "neutral" | "cool";
    naturalHairColor?: string;
    eyeColor?: string;
  };
  body?: Record<string, unknown>;
  morphology?: Record<string, unknown>;
  archetype?: {
    primaryArchetype?:
      | "natural"
      | "elegant"
      | "dramatic"
      | "classic"
      | "creative"
      | "sensual";
    primaryWeight?: number;
    secondaryArchetype?:
      | "natural"
      | "elegant"
      | "dramatic"
      | "classic"
      | "creative"
      | "sensual";
    secondaryWeight?: number;
    maintenanceCommitment?: "minimal" | "moderate" | "intensive";
  };
};

const STEPS = [
  { label: "Profile" },
  { label: "Hair" },
  { label: "Scalp" },
  { label: "Color" },
  { label: "Body" },
  { label: "Morph" },
  { label: "Archetype" },
  { label: "Results" },
];

export function ConsultationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ConsultationData>({});

  const updateData = (partial: Partial<ConsultationData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, 8));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <button
          onClick={() => window.history.back()}
          className="p-2 -m-2 text-sm text-gray-500 hover:text-gray-900 min-h-[44px] flex items-center"
        >
          ✕ Cancel
        </button>
        <h1 className="text-sm font-medium text-gray-700">New Consultation</h1>
        <button
          className="text-sm text-brand font-medium"
          onClick={() => {
            localStorage.setItem("hc_draft_consultation", JSON.stringify(data));
            alert("Draft saved.");
          }}
        >
          Save Draft
        </button>
      </div>

      {/* Step Indicator */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-2xl mx-auto w-full">
        {currentStep === 1 && (
          <Step1Profile data={data} onUpdate={updateData} onNext={next} />
        )}
        {currentStep === 2 && (
          <Step2Hair
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 3 && (
          <Step3Scalp
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 4 && (
          <Step3bColorIdentity
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 5 && (
          <Step4Body
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 6 && (
          <Step5Morphology
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 7 && (
          <Step5bArchetype
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 8 && <Step6Protocol data={data} onBack={back} />}
      </div>
    </div>
  );
}
