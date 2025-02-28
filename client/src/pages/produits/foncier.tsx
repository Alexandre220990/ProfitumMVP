import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import {
  FileSignature,
  Check,
  UserCog,
  Calendar,
  Upload,
  Trash2,
  ArrowLeft,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";

type StepStatus = "completed" | "current" | "upcoming";

type Expert = {
  id: number;
  name: string;
  company: string;
  speciality: string;
  experience: string;
  compensation: number;
  description: string;
};

const foncierExperts: Expert[] = [
  {
    id: 1,
    name: "Charlotte Moreau",
    company: "Foncier Expertise",
    speciality: "Expert Immobilier",
    experience: "15 ans d'expertise",
    compensation: 30,
    description: "Spécialiste en optimisation fiscale immobilière et foncière"
  },
  {
    id: 2,
    name: "Thomas Dubois",
    company: "Patrimoine Conseil",
    speciality: "Consultant Foncier",
    experience: "12 ans d'expérience",
    compensation: 28,
    description: "Expert en gestion patrimoniale et immobilière"
  }
];

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "titres", label: "Titres de propriété", uploadedFiles: [] },
  { id: "baux", label: "Baux et contrats de location", uploadedFiles: [] },
  { id: "taxes", label: "Avis d'imposition foncière", uploadedFiles: [] },
  { id: "plans", label: "Plans et documents cadastraux", uploadedFiles: [] },
  { id: "diagnostics", label: "Diagnostics immobiliers", uploadedFiles: [] },
];

const processSteps = [
  { id: 1, title: "Signer la charte Profitum", component: <></> }, // Placeholder, needs actual component
  { id: 2, title: "Sélectionner un expert", component: <></> }, // Placeholder, needs actual component for expert selection using foncierExperts
  { id: 3, title: "Choisir un créneau", component: <></> }, // Placeholder, needs scheduling component
  { id: 4, title: "Joindre les documents", component: <></> }, // Placeholder, needs document upload component using documentsList
  { id: 5, title: "Attente du retour de l’expert", description: "Votre dossier est en cours d’analyse." },
  { id: 6, title: "Réception des résultats", description: "Téléchargez votre rapport." },
  { id: 7, title: "Acceptation de la mission", description: "Finalisez et validez votre audit." }
];

export default function AuditProcess() {
  const [currentStep, setCurrentStep] = useState(1);
  const [location] = useLocation();
  const { toast } = useToast();
  const auditType = "foncier"; // Fixed to "foncier"

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
              {id === currentStep && Component && Component} {/*Render Component */}
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