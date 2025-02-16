import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import CharterDialog from "@/components/CharterDialog";
import ExpertSelection from "@/components/ExpertSelection";
import ScheduleMeeting from "@/components/ScheduleMeeting";
import DocumentUpload from "@/components/DocumentUpload";
import { Progress } from "@/components/ui/progress";

const processSteps = [
  { id: 1, title: "Signer la charte Profitum", component: CharterDialog },
  { id: 2, title: "Sélectionner un expert", component: ExpertSelection },
  { id: 3, title: "Choisir un créneau", component: ScheduleMeeting },
  { id: 4, title: "Joindre les documents", component: DocumentUpload },
  { id: 5, title: "Attente du retour de l’expert", description: "Votre dossier est en cours d’analyse." },
  { id: 6, title: "Réception des résultats", description: "Téléchargez votre rapport." },
  { id: 7, title: "Acceptation de la mission", description: "Finalisez et validez votre audit." }
];

export default function AuditProcess() {
  const [currentStep, setCurrentStep] = useState(1);
  const [charterOpen, setCharterOpen] = useState(false);
  const [charterValidated, setCharterValidated] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const auditType = location.split("/").pop();

  const getProgress = useCallback(() => {
    const progress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
    if (!progress[auditType]) {
      progress[auditType] = 1;
      localStorage.setItem("auditProgress", JSON.stringify(progress));
    }
    return progress[auditType];
  }, [auditType]);

  useEffect(() => {
    setCurrentStep(getProgress());
  }, [auditType, getProgress]);

  const handleStepCompletion = (stepId: number) => {
    if (stepId === currentStep) {
      const updatedStep = stepId + 1;
      setCurrentStep(updatedStep);
      const auditProgress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
      auditProgress[auditType] = updatedStep;
      localStorage.setItem("auditProgress", JSON.stringify(auditProgress));
      toast({ title: "Succès", description: `Étape ${stepId} complétée.` });
    }
  };

  const renderStepComponent = (id: number) => {
    const { component: Component } = processSteps.find(step => step.id === id) || {};
    if (Component) {
      return <Component onComplete={() => handleStepCompletion(id)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Suivi de votre dossier d’audit</h1>
        <Progress value={(currentStep / processSteps.length) * 100} className="mb-6" />
        <Card>
          <CardHeader>
            <CardTitle>Suivi du processus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {processSteps.map(({ id, title, component: Component, description }) => (
                <div
                  key={id}
                  className={`p-4 border-2 rounded-lg transition-all transform hover:scale-105 ${
                    id === currentStep
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : id < currentStep
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <h3 className="font-semibold text-lg">{title}</h3>
                  {description && <p className="text-gray-600">{description}</p>}
                  {id === 1 && currentStep === 1 && (
                    <>
                      <div className="flex gap-4">
                        <Button onClick={() => setCharterOpen(true)}>Ouvrir la charte</Button>
                        <Button 
                          onClick={() => handleStepCompletion(id)}
                          disabled={!charterValidated}
                        >
                          Valider la charte
                        </Button>
                      </div>
                      <CharterDialog 
                        open={charterOpen} 
                        onScrollEnd={() => setCharterValidated(true)} 
                        onClose={() => setCharterOpen(false)}
                      />
                    </>
                  )}
                  {id === currentStep && renderStepComponent(id)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 text-center">
          <Button variant="outline" href="/">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
