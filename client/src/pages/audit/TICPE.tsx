import { useState, useEffect, useCallback } from "react";
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

interface ProcessStep {
  id: number;
  title: string;
  description?: string;
  component?: React.ComponentType<{ onComplete: () => void }>;
}

const processSteps: ProcessStep[] = [
  { id: 1, title: "Signer la charte Profitum", component: CharterDialog },
  { id: 2, title: "Sélectionner un expert", component: ExpertSelection },
  { id: 3, title: "Choisir un créneau", component: ScheduleMeeting },
  { id: 4, title: "Joindre les documents", component: DocumentUpload },
  { id: 5, title: "Attente du retour de l'expert", description: "Votre dossier est en cours d'analyse." },
  { id: 6, title: "Réception des résultats", description: "Téléchargez votre rapport." },
  { id: 7, title: "Acceptation de la mission", description: "Finalisez et validez votre audit." }
];

export default function AuditProcess() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [charterOpen, setCharterOpen] = useState<boolean>(false);
  const [charterValidated, setCharterValidated] = useState<boolean>(false);
  const [expertOpen, setExpertOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const location = useLocation();
  const auditType = location.split("/").pop() || "";

  // Fonction pour récupérer la progression depuis localStorage
  const getProgress = useCallback(() => {
    const progress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
    const currentProgress = progress[auditType] || 1;
    return currentProgress;
  }, [auditType]);

  useEffect(() => {
    setCurrentStep(getProgress());
  }, [auditType, getProgress]);

  // Fonction pour compléter une étape
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

  // Fonction pour revenir à l'étape précédente
  const handleStepBack = () => {
    if (currentStep > 1) {
      const updatedStep = currentStep - 1;
      setCurrentStep(updatedStep);
      const auditProgress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
      auditProgress[auditType] = updatedStep;
      localStorage.setItem("auditProgress", JSON.stringify(auditProgress));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-right mb-4">
          <Button variant="outline" asChild>
            <a href="/">Retour au tableau de bord</a>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Suivi de votre dossier d'audit</h1>
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
                  {id === currentStep && (
                    <div className="flex justify-start mb-4">
                      <Button variant="outline" onClick={handleStepBack} disabled={currentStep === 1}>
                        Retour à l'étape précédente
                      </Button>
                    </div>
                  )}
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
                        onClose={() => {
                          setCharterOpen(false);
                          setCharterValidated(true);
                        }}
                      />
                    </>
                  )}
                  {id === 2 && currentStep === 2 && (
                    <>
                      <Button onClick={() => setExpertOpen(true)}>Sélectionner un expert</Button>
                      <ExpertSelection 
                        open={expertOpen} 
                        onClose={() => {
                          setExpertOpen(false);
                          handleStepCompletion(id);
                        }}
                        auditType={auditType}
                      />
                    </>
                  )}
                  {id === currentStep && Component && id !== 2 && (
                    <Component onComplete={() => handleStepCompletion(id)} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
