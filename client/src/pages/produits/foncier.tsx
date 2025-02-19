import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import CharterDialog from "@/components/CharterDialog";
import ExpertSelection from "@/components/ExpertSelection";
import ScheduleMeeting from "@/components/ScheduleMeeting";
import DocumentUpload from "@/components/DocumentUpload";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";

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
  const [location] = useLocation();
  const { toast } = useToast();
  const auditType = location.split("/").pop();

  useEffect(() => {
    const progress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
    if (!progress[auditType]) {
      progress[auditType] = 1;
      localStorage.setItem("auditProgress", JSON.stringify(progress));
    }
    setCurrentStep(progress[auditType]);
  }, [auditType]);

  const handleStepCompletion = () => {
    const updatedStep = currentStep + 1;
    setCurrentStep(updatedStep);
    const auditProgress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
    auditProgress[auditType] = updatedStep;
    localStorage.setItem("auditProgress", JSON.stringify(auditProgress));
    toast({ title: "Succès", description: `Étape ${currentStep} complétée.` });
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="max-w-4xl mx-auto p-6">
        <Progress value={(currentStep / processSteps.length) * 100} className="mb-6" />
        <div className="relative space-y-6">
          {processSteps.map(({ id, title, component: Component, description }) => (
            <Card key={id} className={`relative p-6 transition-all ${id === currentStep ? 'border-blue-500 bg-blue-50 shadow-md' : id < currentStep ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                {id < currentStep ? <CheckCircle className="text-green-500 w-6 h-6" /> : id > currentStep ? <Lock className="text-gray-400 w-6 h-6" /> : null}
              </div>
              {description && <p className="text-gray-600 mt-2">{description}</p>}
              {id === currentStep && Component && <Component onComplete={handleStepCompletion} />}
            </Card>
          ))}
        </div>
        <div className="fixed bottom-6 right-6 flex gap-4">
          {currentStep > 1 && (
            <Button variant="ghost" onClick={handleStepBack}>
              <ArrowLeftCircle className="w-8 h-8 text-blue-600" />
            </Button>
          )}
          {currentStep < processSteps.length && (
            <Button variant="ghost" onClick={handleStepCompletion}>
              <ArrowRightCircle className="w-8 h-8 text-blue-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
