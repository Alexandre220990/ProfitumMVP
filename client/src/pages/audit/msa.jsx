import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import HeaderClient from "@/components/HeaderClient";
import CharterDialog from "@/components/CharterDialog";
import ExpertSelection from "@/components/ExpertSelection";
import ScheduleMeeting from "@/components/ScheduleMeeting";
import DocumentUpload from "@/components/DocumentUpload";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
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
    return (<div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="max-w-6xl mx-auto p-6">
        <Progress value={(currentStep / processSteps.length) * 100} className="mb-6"/>
        <div className="flex items-center justify-between space-x-6 overflow-x-auto pb-4">
          {processSteps.map(({ id, title }) => (<div key={id} className="flex flex-col items-center">
              <div className={`w-16 h-16 flex items-center justify-center rounded-full text-white font-bold text-lg ${id < currentStep ? 'bg-green-500' : id === currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}>
                {id < currentStep ? <CheckCircle className="w-10 h-10"/> : id}
              </div>
              <p className="mt-2 text-md text-center w-32 truncate font-semibold">{title}</p>
            </div>))}
        </div>
        <div className="flex justify-center mt-6">
          {processSteps.map(({ id, component: Component, description }) => (id === currentStep && (<Card key={id} className="w-full p-8 text-center shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{processSteps[currentStep - 1].title}</h2>
                {description && <p className="text-gray-600 mt-2 text-lg">{description}</p>}
                {Component && id === 1 ? (<>
                    <div className="flex flex-col items-center space-y-4">
                      <Button onClick={() => setCharterOpen(true)} className="mt-4">
                        Ouvrir la charte
                      </Button>
                      {charterValidated && (<Button onClick={handleStepCompletion} className="mt-4 bg-green-500 text-white">
                          Valider la charte
                        </Button>)}
                    </div>
                    <Component open={charterOpen} onClose={() => {
                    setCharterOpen(false);
                    setCharterValidated(true);
                }}/>
                  </>) : (<Component onComplete={handleStepCompletion}/>)}
              </Card>)))}
        </div>
        <div className="flex justify-between mt-6">
          {currentStep > 1 && (<Button variant="ghost" onClick={handleStepBack} className="w-24 h-24 flex items-center justify-center">
              <ArrowLeftCircle className="w-20 h-20 text-blue-600"/>
            </Button>)}
          {currentStep < processSteps.length && (<Button variant="ghost" onClick={handleStepCompletion} className="w-16 h-16">
              <ArrowRightCircle className="w-16 h-16 text-blue-600"/>
            </Button>)}
        </div>
      </div>
    </div>);
}
