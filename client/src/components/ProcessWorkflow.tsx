import React, { useCallback, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Circle, FileSignature, CheckSquare, ArrowRight, CheckCircle, Users, FileText } from "lucide-react";

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

interface ProcessWorkflowProps {
  currentStep: number;
  steps: ProcessStep[];
  onStepAction?: (stepId: number) => void;
  className?: string;
}

// Optimisation : Composant Step optimisé avec React.memo
const WorkflowStep = React.memo(({
  step,
  index,
  totalSteps,
  onStepAction
}: {
  step: ProcessStep;
  index: number;
  totalSteps: number;
  onStepAction?: (stepId: number) => void;
}) => {
  // Optimisation : Icône de l'étape avec useMemo
  const stepIcon = useMemo(() => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Circle className="w-5 h-5 text-blue-500 fill-current" />;
      case 'error':
        return <Circle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  }, [step.status]);

  // Optimisation : Badge de l'étape avec useMemo
  const stepBadge = useMemo(() => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  }, [step.status]);

  // Optimisation : Gestion de l'action avec useCallback
  const handleAction = useCallback(() => {
    onStepAction?.(step.id);
  }, [step.id, onStepAction]);

  return (
    <Card 
      className={`transition-all duration-200 ${
        step.status === 'active' 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : step.status === 'completed'
          ? 'bg-green-50'
          : 'bg-gray-50'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {stepIcon}
              <span className="text-sm font-medium text-gray-600">
                {step.id}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {step.icon}
                <div>
                  <h4 className="font-medium text-gray-800">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {stepBadge}
            
            {step.action && step.status === 'active' && (
              <Button 
                size="sm" 
                onClick={handleAction}
                className="flex items-center space-x-1"
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Barre de progression entre les étapes */}
        {index < totalSteps - 1 && (
          <div className="mt-4 ml-6">
            <div className="w-px h-6 bg-gray-300 mx-auto"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

WorkflowStep.displayName = 'WorkflowStep';

export default function ProcessWorkflow({ currentStep, steps, onStepAction, className = "" }: ProcessWorkflowProps) {
  // Optimisation : Progression calculée avec useMemo
  const progressPercentage = useMemo(() => {
    return Math.round((currentStep / steps.length) * 100);
  }, [currentStep, steps.length]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Progression de votre dossier
        </h3>
        <p className="text-sm text-gray-600">
          Étape {currentStep} sur {steps.length}
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <WorkflowStep
            key={step.id}
            step={step}
            index={index}
            totalSteps={steps.length}
            onStepAction={onStepAction}
          />
        ))}
      </div>

      {/* Indicateur de progression globale */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progression globale</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Composant pour créer facilement les étapes du processus produit
export function createProductSteps(
  currentStep: number,
  charteSigned: boolean,
  expertAssigned: boolean,
  dossierCompleted: boolean,
  dossierFinalized: boolean,
  onSignCharte?: () => void,
  onSelectExpert?: () => void,
  onCompleteDossier?: () => void,
  onViewDossier?: () => void
): ProcessStep[] {
  return [
    {
      id: 0,
      title: "Simulation validée",
      description: "Votre produit est éligible",
      status: currentStep >= 0 ? 'completed' : 'pending',
      icon: <CheckCircle className="w-5 h-5" />,
      actionLabel: "Terminé"
    },
    {
      id: 1,
      title: "Signature de la charte",
      description: "Accepter les conditions d'engagement",
      status: currentStep < 1 ? 'pending' : charteSigned ? 'completed' : 'active',
      icon: <FileSignature className="w-5 h-5" />,
      action: currentStep === 1 && !charteSigned ? onSignCharte : undefined,
      actionLabel: "Signer la charte"
    },
    {
      id: 2,
      title: "Sélection d'expert",
      description: "Choisir un expert qualifié",
      status: currentStep < 2 ? 'pending' : expertAssigned ? 'completed' : 'active',
      icon: <Users className="w-5 h-5" />,
      action: currentStep === 2 && charteSigned && !expertAssigned ? onSelectExpert : undefined,
      actionLabel: "Sélectionner un expert"
    },
    {
      id: 3,
      title: "Complétion du dossier",
      description: "Remplir les informations nécessaires",
      status: currentStep < 3 ? 'pending' : dossierCompleted ? 'completed' : 'active',
      icon: <FileText className="w-5 h-5" />,
      action: currentStep === 3 && expertAssigned && !dossierCompleted ? onCompleteDossier : undefined,
      actionLabel: "Compléter le dossier"
    },
    {
      id: 4,
      title: "Validation administrative",
      description: "Vérification et approbation",
      status: currentStep < 4 ? 'pending' : dossierFinalized ? 'completed' : 'active',
      icon: <CheckSquare className="w-5 h-5" />,
      action: currentStep === 4 && dossierCompleted ? onViewDossier : undefined,
      actionLabel: "En attente"
    },
    {
      id: 5,
      title: "Dossier finalisé",
      description: "Mission accomplie",
      status: currentStep === 5 ? 'completed' : 'pending',
      icon: <CheckCircle className="w-5 h-5" />,
      actionLabel: "Terminé"
    }
  ];
} 