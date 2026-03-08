import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step { label: string; }

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 sm:gap-1 mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isComplete && "bg-brand text-white",
                  isCurrent && "bg-brand text-white ring-4 ring-brand/20",
                  !isComplete && !isCurrent && "border-2 border-gray-200 text-gray-400"
                )}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={cn("text-[10px] font-medium hidden sm:inline", isCurrent ? "text-brand" : "text-gray-400")}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 mb-4 rounded-full transition-all", stepNum < currentStep ? "bg-brand" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
