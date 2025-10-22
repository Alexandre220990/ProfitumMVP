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
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          
          return (
            <React.Fragment key={step.number}>
              {/* Connecteur (ligne entre les étapes) */}
              {index > 0 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div 
                    className={`h-full transition-colors duration-300 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
              
              {/* Étape */}
              <div className="flex flex-col items-center">
                {/* Cercle numéro */}
                <div
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-blue-600 border-blue-600' 
                      : isCurrent 
                        ? 'bg-white border-blue-600 ring-4 ring-blue-100' 
                        : 'bg-white border-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`
                        text-sm font-semibold
                        ${isCurrent ? 'text-blue-600' : 'text-gray-400'}
                      `}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                
                {/* Titre */}
                <div className="mt-2 text-center">
                  <div
                    className={`
                      text-sm font-medium whitespace-nowrap
                      ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                    `}
                  >
                    {step.title}
                  </div>
                  {step.optional && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      (optionnel)
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

