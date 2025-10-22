import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  optional: boolean;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          
          return (
            <React.Fragment key={step.number}>
              {/* Connecteur (ligne entre les étapes) */}
              {index > 0 && (
                <div className="flex-1 h-0.5 mx-1">
                  <div 
                    className={`h-full transition-colors duration-300 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
              
              {/* Étape */}
              <div className="flex flex-col items-center">
                {/* Cercle numéro (plus petit) */}
                <div
                  className={`
                    relative flex items-center justify-center
                    w-8 h-8 rounded-full border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-blue-600 border-blue-600' 
                      : isCurrent 
                        ? 'bg-white border-blue-600 ring-2 ring-blue-100' 
                        : 'bg-white border-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span
                      className={`
                        text-xs font-semibold
                        ${isCurrent ? 'text-blue-600' : 'text-gray-400'}
                      `}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                
                {/* Titre (plus compact) */}
                <div className="mt-1.5 text-center">
                  <div
                    className={`
                      text-xs font-medium whitespace-nowrap
                      ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                    `}
                  >
                    {step.title}
                  </div>
                  {step.optional && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      (opt.)
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

