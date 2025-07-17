import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePreferences } from "@/hooks/use-preferences";
import type { TutorialType } from "@/types/preferences";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";

interface TutorialStep {
  title: string;
  content: string;
  target: string;
}

interface TutorialGuideProps {
  tutorialKey: TutorialType;
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = React.memo(({ 
  tutorialKey, 
  steps, 
  onComplete, 
  onSkip,
  className = '' 
}) => {
  const { preferences, setTutorialCompleted } = usePreferences();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Vérifier si le tutoriel est déjà complété
  const isTutorialCompleted = useMemo(() => {
    return preferences?.tutorial_completed?.[tutorialKey]?.completed || false;
  }, [preferences, tutorialKey]);

  // Afficher le tutoriel si pas encore complété
  useEffect(() => {
    if (!isTutorialCompleted) {
      setIsVisible(true);
    }
  }, [isTutorialCompleted]);

  // Gestionnaire pour passer à l'étape suivante
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  // Gestionnaire pour revenir à l'étape précédente
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Gestionnaire pour compléter le tutoriel
  const handleComplete = useCallback(async () => {
    try {
      await setTutorialCompleted(tutorialKey);
      setIsVisible(false);
      onComplete?.();
    } catch (error) {
      console.error('Erreur lors de la completion du tutoriel:', error);
    }
  }, [setTutorialCompleted, tutorialKey, onComplete]);

  // Gestionnaire pour passer le tutoriel
  const handleSkip = useCallback(async () => {
    try {
      await setTutorialCompleted(tutorialKey);
      setIsVisible(false);
      onSkip?.();
    } catch (error) {
      console.error('Erreur lors du skip du tutoriel:', error);
    }
  }, [setTutorialCompleted, tutorialKey, onSkip]);

  // Calculs optimisés
  const progressPercentage = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);
  const isLastStep = useMemo(() => currentStep === steps.length - 1, [currentStep, steps.length]);
  const canGoNext = useMemo(() => currentStep < steps.length - 1, [currentStep, steps.length]);

  if (!isVisible) return null;

  const currentTutorial = steps[currentStep];

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md z-50 ${className}`}>
      {/* En-tête avec titre et bouton de fermeture */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {currentTutorial.title}
        </h3>
        <button
          onClick={handleSkip}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Fermer le tutoriel"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Contenu du tutoriel */}
      <div className="mb-6">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {currentTutorial.content}
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>Étape {currentStep + 1} sur {steps.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Indicateurs d'étapes */}
      <div className="flex justify-center mb-4">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full mx-1 transition-all duration-200 ${
              index === currentStep
                ? 'bg-blue-600 scale-125'
                : index < currentStep
                ? 'bg-green-500'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Précédent</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Passer
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canGoNext && !isLastStep}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLastStep ? (
              <>
                <Play className="w-4 h-4" />
                <span>Terminer</span>
              </>
            ) : (
              <>
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Indicateur de cible */}
      {currentTutorial.target && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Cible: {currentTutorial.target}
          </p>
        </div>
      )}
    </div>
  );
});

TutorialGuide.displayName = 'TutorialGuide'; 