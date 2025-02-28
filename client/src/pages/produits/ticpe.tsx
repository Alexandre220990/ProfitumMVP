import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import ExpertSelection from "@/components/ExpertSelection";
import ScheduleMeeting from "@/components/ScheduleMeeting";
import DocumentUpload from "@/components/DocumentUpload";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, ArrowLeftCircle, FileSearch, DollarSign, TrendingUp, FolderOpen } from "lucide-react";

interface ProcessStep {
  id: number;
  title: string;
  description?: string;
  component?: React.ComponentType<any>;
}

const processSteps: ProcessStep[] = [
  { id: 1, title: "Sélectionner un expert", component: ExpertSelection },
  { id: 2, title: "Choisir un créneau", component: ScheduleMeeting },
  { id: 3, title: "Joindre les documents", component: DocumentUpload },
  { id: 4, title: "Attente du retour de l’expert", description: "Votre dossier est en cours d’analyse." },
  { id: 5, title: "Réception des résultats", description: "Téléchargez votre rapport." },
  { id: 6, title: "Acceptation de la mission", description: "Finalisez et validez votre audit." }
];

export default function AuditProcess() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { toast } = useToast();

  // ✅ Récupération des paramètres d'URL
  const [match, params] = useRoute("/produits/:auditType/:userId");

  if (!match || !params?.auditType || !params?.userId) {
    return <div className="text-center text-red-500 text-xl">❌ Erreur : Audit non trouvé</div>;
  }

  const auditType = params.auditType;
  const userId = params.userId;

  // ✅ Gestion du stockage et récupération de la progression
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

  // ✅ Fonction pour compléter une étape
  const handleStepCompletion = (stepId: number) => {
    if (stepId === currentStep) {
      setCurrentStep(stepId + 1);
      const auditProgress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
      auditProgress[auditType] = stepId + 1;
      localStorage.setItem("auditProgress", JSON.stringify(auditProgress));
      toast({ title: "Succès", description: `Étape ${stepId} complétée.` });
    }
  };

  // ✅ Fonction pour revenir à l'étape précédente
  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      const auditProgress = JSON.parse(localStorage.getItem("auditProgress") || "{}");
      auditProgress[auditType] = currentStep - 1;
      localStorage.setItem("auditProgress", JSON.stringify(auditProgress));
    }
  };

  // ✅ Gestion correcte des composants d’étape
  const renderStepComponent = (id: number) => {
    const step = processSteps.find((step) => step.id === id);
    if (!step?.component) return null;

    const Component = step.component;
    return <Component onComplete={() => handleStepCompletion(id)} />;
  };

  // 🔹 Calcul des KPI fictifs
  const kpiData = {
    etapeActuelle: currentStep,
    etapesTotal: processSteps.length,
    gainsEstimes: 12000,
    tempsRestant: (processSteps.length - currentStep) * 3, // 3 jours par étape en moyenne
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <HeaderClient />
      <div className="max-w-4xl mx-auto px-6 py-24"> {/* 🔹 Espacement corrigé */}

        {/* 🔙 Bouton Retour */}
        <div className="flex justify-start mb-4">
          <Button variant="outline" asChild>
            <a href={`/dashboard/${userId}`} className="flex items-center">
              <ArrowLeftCircle className="mr-2 h-5 w-5" />
              Retour au tableau de bord
            </a>
          </Button>
        </div>

        {/* 📊 TITRE PREMIUM */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md text-white text-center">
          <h1 className="text-4xl font-bold">📑 Suivi de l'Audit {auditType.toUpperCase()}</h1>
          <p className="text-lg opacity-80 mt-2">Étape {kpiData.etapeActuelle} sur {kpiData.etapesTotal}</p>
        </div>

        {/* 🔥 SECTION KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <FolderOpen className="h-10 w-10 text-blue-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.etapeActuelle} / {kpiData.etapesTotal}</h3>
            <p className="text-gray-600">Étape en cours</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <DollarSign className="h-10 w-10 text-green-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.gainsEstimes.toLocaleString()} €</h3>
            <p className="text-gray-600">Gains estimés</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <TrendingUp className="h-10 w-10 text-indigo-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.tempsRestant} jours</h3>
            <p className="text-gray-600">Temps restant estimé</p>
          </div>
        </div>

        {/* 📜 SUIVI DU PROCESSUS */}
        <Card className="shadow-xl rounded-lg mt-8">
          <CardHeader>
            <CardTitle>📜 Étapes de l'Audit</CardTitle>
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
                  <h3 className="font-semibold text-lg flex items-center">
                    {title} {id < currentStep && <BadgeCheck className="ml-2 text-green-500" />}
                  </h3>
                  {description && <p className="text-gray-600">{description}</p>}
                  {id === currentStep && renderStepComponent(id)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
