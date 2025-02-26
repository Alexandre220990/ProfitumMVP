import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, Check, Circle, UserCog, Calendar, Mail, Download, Upload, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CharterDialog from "@/components/CharterDialog";
import DocumentUpload from "@/components/DocumentUpload";
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
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

type StepStatus = "completed" | "current" | "upcoming";

type Expert = {
  id: number;
  name: string;
  company?: string;
  speciality: string;
  experience: string;
  compensation: number;
};

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "payslips", label: "Bulletins de salaire (des trois dernières années)", uploadedFiles: [] },
  { id: "contracts", label: "Contrats de travail des salariés concernés", uploadedFiles: [] },
  { id: "conventions", label: "Conventions collectives applicables", uploadedFiles: [] },
  { id: "attestations", label: "Attestation de l'activité réelle des salariés", uploadedFiles: [] },
  { id: "expenses", label: "Justificatifs de frais professionnels remboursés", uploadedFiles: [] },
  { id: "dsn", label: "Déclarations sociales nominatives (DSN)", uploadedFiles: [] },
  { id: "register", label: "Registre unique du personnel", uploadedFiles: [] },
  { id: "urssaf", label: "Historique des cotisations URSSAF", uploadedFiles: [] },
  { id: "travel", label: "Justificatifs de déplacements professionnels", uploadedFiles: [] },
  { id: "other", label: "Autre document", uploadedFiles: [] },
];

const getTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const StepIndicator = ({ step, currentStep }: { step: number; currentStep: number }) => {
  const status: StepStatus = step < currentStep ? "completed" : step === currentStep ? "current" : "upcoming";

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2",
          status === "completed" && "bg-green-100 border-green-500 text-green-600",
          status === "current" && "bg-blue-100 border-blue-500 text-blue-600",
          status === "upcoming" && "bg-gray-100 border-gray-300 text-gray-400"
        )}
      >
        {status === "completed" ? (
          <Check className="w-5 h-5" />
        ) : (
          <span className="font-semibold">{step}</span>
        )}
      </div>
      {step < 5 && (
        <div
          className={cn(
            "h-1 w-full mx-2",
            status === "completed" ? "bg-green-500" : "bg-gray-200"
          )}
        />
      )}
    </div>
  );
};

export default function DFSAudit() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auditType = "dfs";
  const [isCharterSigned, setIsCharterSigned] = useState(false);
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showCompensationDialog, setShowCompensationDialog] = useState(false);
  const [acceptedCompensation, setAcceptedCompensation] = useState(false);
  const [expertContactSuccess, setExpertContactSuccess] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [confirmedDateTime, setConfirmedDateTime] = useState<string>();
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>(documentsList);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculer le pourcentage de progression
    setProgress((currentStep - 1) * 25);

    const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
    setIsCharterSigned(!!signedCharters[auditType]);

    const savedProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
    if (savedProgress[auditType]) {
      setCurrentStep(savedProgress[auditType]);
    }

    const savedExperts = JSON.parse(localStorage.getItem('selectedExperts') || '{}');
    if (savedExperts[auditType]) {
      setSelectedExpert(savedExperts[auditType]);
    }

    const savedDocuments = JSON.parse(localStorage.getItem(`${auditType}_documents`) || '{}');
    if (Object.keys(savedDocuments).length > 0) {
      setUploadedDocuments(prevDocs =>
        prevDocs.map(doc => ({
          ...doc,
          uploadedFiles: savedDocuments[doc.id] ? savedDocuments[doc.id].map(f => ({ id: f.id, name: f.name })) : []
        }))
      );
    }
  }, [auditType, currentStep]);

  const handleDocumentUpload = (docId: string, files: {id: number; name: string}[]) => {
    const updatedDocs = uploadedDocuments.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          uploadedFiles: [...d.uploadedFiles, ...files]
        };
      }
      return d;
    });
    setUploadedDocuments(updatedDocs);

    localStorage.setItem(`${auditType}_documents`, JSON.stringify(
      updatedDocs.reduce((acc, d) => ({
        ...acc,
        [d.id]: d.uploadedFiles
      }), {})
    ));

    if (updatedDocs.some(doc => doc.uploadedFiles.length > 0)) {
      updateProgress(5);
    }
  };

  const handleDeleteDocument = (docId: string, fileId: number) => {
    const updatedDocs = uploadedDocuments.map(doc => ({
      ...doc,
      uploadedFiles: doc.uploadedFiles.filter(file => file.id !== fileId)
    }));

    setUploadedDocuments(updatedDocs);
    localStorage.setItem(`${auditType}_documents`, JSON.stringify(
      updatedDocs.reduce((acc, d) => ({
        ...acc,
        [d.id]: d.uploadedFiles
      }), {})
    ));
  };

  const updateProgress = (step: number) => {
    const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
    auditProgress[auditType] = step;
    localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
    setCurrentStep(step);
  };

  const steps = [
    {
      title: "Signature de la charte",
      description: "Signature de la charte contractuelle",
      icon: FileSignature,
      action: !isCharterSigned ? () => setShowCharterDialog(true) : undefined,
      status: isCharterSigned ? "completed" : currentStep === 1 ? "current" : "upcoming"
    },
    {
      title: "Sélection de l'expert",
      description: "Choix et validation de l'expert",
      icon: UserCog,
      action: currentStep === 2 ? () => setLocation("/experts") : undefined,
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "upcoming"
    },
    {
      title: "Prise de rendez-vous",
      description: "Planification du rendez-vous",
      icon: Calendar,
      action: currentStep === 3 ? () => setShowCalendarDialog(true) : undefined,
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "upcoming"
    },
    {
      title: "Documents",
      description: "Téléversement des documents",
      icon: Upload,
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "upcoming"
    },
    {
      title: "Finalisation",
      description: "Rapport et recommandations",
      icon: Check,
      status: currentStep === 5 ? "completed" : "upcoming"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Audit DFS</h1>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <StepIndicator key={index} step={index + 1} currentStep={currentStep} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Étape en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      stepNumber === currentStep && "bg-blue-50 border-blue-200",
                      stepNumber < currentStep && "bg-green-50 border-green-200",
                      stepNumber > currentStep && "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <step.icon className={cn(
                        "w-6 h-6",
                        stepNumber === currentStep && "text-blue-500",
                        stepNumber < currentStep && "text-green-500",
                        stepNumber > currentStep && "text-gray-400"
                      )} />
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    {step.action && stepNumber === currentStep && (
                      <Button
                        onClick={step.action}
                        className="mt-4"
                        variant={stepNumber === currentStep ? "default" : "outline"}
                      >
                        {stepNumber === 1 ? "Signer la charte" :
                         stepNumber === 2 ? "Choisir un expert" :
                         stepNumber === 3 ? "Prendre rendez-vous" :
                         "Continuer"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents requis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedDocuments.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm",
                          doc.uploadedFiles.length > 0 && "text-green-600"
                        )}>
                          {doc.label}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentUpload(doc.id, [{ id: Date.now(), name: "Document test.pdf" }])}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Téléverser
                        </Button>
                      </div>
                      {doc.uploadedFiles.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {doc.uploadedFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                <span>{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id, file.id)}
                                className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport d'audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Génération du rapport en cours...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CharterDialog
        open={showCharterDialog}
        onOpenChange={setShowCharterDialog}
        onAccept={() => {
          setIsCharterSigned(true);
          updateProgress(2);
          setShowCharterDialog(false);
          toast({
            title: "Charte signée",
            description: "Vous pouvez maintenant passer à l'étape suivante",
          });
        }}
        auditType={auditType}
        isCharterSigned={isCharterSigned}
        setIsCharterSigned={setIsCharterSigned}
      />

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Planifier un rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez une date et un horaire pour votre rendez-vous
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              locale={fr}
            />
            {selectedDate && (
              <div className="grid grid-cols-4 gap-2">
                {getTimeSlots().map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedDate && selectedTime) {
                  const formattedDate = format(selectedDate, 'dd/MM/yyyy');
                  setConfirmedDateTime(`${formattedDate} à ${selectedTime}`);
                  updateProgress(4);
                  setShowCalendarDialog(false);
                  toast({
                    title: "Rendez-vous confirmé",
                    description: `Votre rendez-vous est programmé pour le ${formattedDate} à ${selectedTime}`,
                  });
                }
              }}
              disabled={!selectedDate || !selectedTime}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}