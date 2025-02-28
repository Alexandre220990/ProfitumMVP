import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, ArrowLeft, ArrowRight, RefreshCcw,
  FileText, DollarSign, Clock, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoute } from "wouter";


export default function TICPEAudit() {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [match, params] = useRoute("/produits/:auditType/:userId");
  const auditType = "ticpe";
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}')[auditType];
    if (savedProgress) {
      setCurrentStep(savedProgress);
      setProgress((savedProgress - 1) * 25);
    }
  }, [auditType]);

  if (!match || !params?.auditType || !params?.userId) {
    return <div className="text-center text-red-500 text-xl">❌ Erreur : Audit non trouvé</div>;
  }

  const userId = params.userId;


  const handleStepChange = (newStep: number) => {
    if (newStep >= 1 && newStep <= 5) {
      setCurrentStep(newStep);
      setProgress((newStep - 1) * 25);

      // Update localStorage
      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = newStep;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));

      toast({
        title: `Navigation vers l'étape ${newStep}`,
        description: "Vous pouvez revenir aux étapes précédentes à tout moment",
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm("Êtes-vous sûr de vouloir réinitialiser ce dossier ? Toutes les données seront perdues.");
    if (confirmReset) {
      const storageKeys = [
        'signedCharters',
        'auditProgress',
        'selectedExperts',
        `${auditType}_datetime`,
        `${auditType}_documents`
      ];

      storageKeys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        delete data[auditType];
        localStorage.setItem(key, JSON.stringify(data));
      });

      setCurrentStep(1);
      setProgress(0);

      toast({
        title: "Dossier réinitialisé",
        description: "Le dossier a été remis à zéro avec succès",
      });

      setLocation('/dashboard/client');
    }
  };

  const steps = [
    {
      title: "Charte d'engagement",
      description: "Signez la charte pour commencer l'audit",
      icon: FileText,
    },
    {
      title: "Sélection de l'expert",
      description: "Choisissez votre expert TICPE",
      icon: Users,
    },
    {
      title: "Rendez-vous",
      description: "Planifiez votre premier rendez-vous",
      icon: Calendar,
    },
    {
      title: "Documents",
      description: "Téléchargez les documents requis",
      icon: FileText,
    },
    {
      title: "Finalisation",
      description: "Validation et rapport final",
      icon: DollarSign,
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Audit TICPE</h1>
              <Button
                variant="destructive"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="flex items-center gap-2"
              disabled={currentStep <= 1}
            >
              <ArrowLeft className="w-4 h-4" />
              Étape précédente
            </Button>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-2 bg-blue-500 rounded-full mb-4"
          />

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Étape actuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStep} / 5</div>
                <p className="text-gray-600">{steps[currentStep - 1]?.title}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Temps estimé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">30 min</div>
                <p className="text-gray-600">Pour compléter cette étape</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gain potentiel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">12 000 €</div>
                <p className="text-gray-600">Estimation préliminaire</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Steps */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Étapes de l'audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-6 rounded-lg border cursor-pointer transition-all",
                      stepNumber === currentStep && "bg-blue-50 border-blue-200",
                      stepNumber < currentStep && "bg-green-50 border-green-200",
                      stepNumber > currentStep && "bg-gray-50 border-gray-200"
                    )}
                    onClick={() => handleStepChange(stepNumber)}
                  >
                    <div className="flex items-center gap-4">
                      <step.icon className={cn(
                        "w-6 h-6",
                        stepNumber === currentStep && "text-blue-500",
                        stepNumber < currentStep && "text-green-500",
                        stepNumber > currentStep && "text-gray-400"
                      )} />
                      <div className="flex-grow">
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}