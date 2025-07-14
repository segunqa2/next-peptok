import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  className,
}: ProgressStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.completed || index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                    {
                      "bg-primary border-primary text-primary-foreground":
                        isCompleted,
                      "bg-primary/10 border-primary text-primary": isCurrent,
                      "bg-muted border-muted-foreground/30 text-muted-foreground":
                        !isCompleted && !isCurrent,
                    },
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="mt-2 text-center max-w-[120px]">
                  <div
                    className={cn("text-sm font-medium transition-colors", {
                      "text-primary": isCompleted || isCurrent,
                      "text-muted-foreground": !isCompleted && !isCurrent,
                    })}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 h-px mx-4 mt-[-40px]">
                  <div
                    className={cn("h-px w-full transition-colors", {
                      "bg-primary": isCompleted,
                      "bg-muted-foreground/30": !isCompleted,
                    })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
