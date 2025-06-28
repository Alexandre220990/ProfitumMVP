import React, { useState, useEffect } from 'react';
import { usePreferences } from '@/hooks/use-preferences';

interface TutorialStep {
    title: string;
    content: string;
    target: string;
}

interface TutorialGuideProps {
    tutorialKey: string;
    steps: TutorialStep[];
    onComplete?: () => void;
}

export function TutorialGuide({ tutorialKey, steps, onComplete }: TutorialGuideProps) {
    const { preferences, setTutorialCompleted } = usePreferences();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isTutorialCompleted = preferences?.tutorial_completed?.[tutorialKey];
        if (!isTutorialCompleted) {
            setIsVisible(true);
        }
    }, [preferences, tutorialKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        await setTutorialCompleted(tutorialKey);
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = async () => {
        await setTutorialCompleted(tutorialKey);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const currentTutorial = steps[currentStep];

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
            <h3 className="text-lg font-semibold mb-2">{currentTutorial.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{currentTutorial.content}</p>
            
            <div className="flex justify-between items-center">
                <div>
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrevious}
                            className="text-blue-600 dark:text-blue-400 mr-4"
                        >
                            Précédent
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    </button>
                </div>
                
                <button
                    onClick={handleSkip}
                    className="text-gray-500 dark:text-gray-400"
                >
                    Passer le tutoriel
                </button>
            </div>
            
            <div className="mt-2 flex justify-center">
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 w-2 rounded-full mx-1 ${
                            index === currentStep
                                ? 'bg-blue-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
} 