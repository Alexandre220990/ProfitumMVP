import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import CharterDialog from "@/components/CharterDialog";
import ExpertSelection from "@/components/ExpertSelection";
import ScheduleMeeting from "@/components/ScheduleMeeting";
import DocumentUpload from "@/components/DocumentUpload";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck } from "lucide-react";

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

  // Récupération correcte des paramètres de l'URL
  const [match, params] = useRoute("/:auditType/:userId");

  if (!match || !params?.auditType || !params?.userId) {
    return <div className="text-center text-red-500 text-xl">❌ Erreur : Audit non trouvé</div>;
  }

  const auditType = params.auditType;
  const userId = params.userId;

  // Gestion de la progression dans localStorage
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

  // Fonction pour valider une étape
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

  // Fonction pour afficher dynamiquement les composants d'étape
          const renderStepComponent = (id: number) => {
            const step = processSteps.find((step) => step.id === id);
            if (!step?.component) return null;

            const Component = step.component;

            // Si c'est CharterDialog, ajouter `onScrollEnd`
            if (Component === CharterDialog) {
              return (
                <Component
                  open={id === currentStep}
                  onClose={() => setCurrentStep(currentStep - 1)}
                  onScrollEnd={() => setCharterValidated(true)}
                  auditType={auditType}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mt-16 mb-10 flex justify-center items-center space-x-4">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <BadgeCheck className="h-8 w-8 mr-2 text-white" /> 
            Suivi de votre Audit {auditType.toUpperCase()}
          </span>
        </h1>        <Progress value={(currentStep / processSteps.length) * 100} className="mb-6" />
        <Card>
          <CardHeader>
            <CardTitle>Suivi du processus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {processSteps.map(({ id, title, description }) => (
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
                        onClose={() => setCharterOpen(false)}
                        onScrollEnd={() => setCharterValidated(true)}
                        auditType={auditType}
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
          <Link href={`/dashboard/${userId}`}>
            <Button variant="outline">
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
