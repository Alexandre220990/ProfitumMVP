import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSignature,
  Check,
  UserCog,
  Calendar,
  Upload,
  Trash2,
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CharterDialog from "@/components/CharterDialog";
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
import HeaderClient from "@/components/HeaderClient";

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

// Liste des experts DFS
const dfsExperts: Expert[] = [
  {
    id: 1,
    name: "Sophie Martin",
    company: "DFS Consulting",
    speciality: "Expert Fiscalité Saisonnière",
    experience: "15 ans d'expertise",
    compensation: 30,
    description: "Spécialiste des audits DFS pour les entreprises de taille moyenne"
  },
  {
    id: 2,
    name: "Pierre Dubois",
    company: "SeasonOptim",
    speciality: "Optimisation DFS",
    experience: "12 ans d'expérience",
    compensation: 28,
    description: "Expert en optimisation fiscale pour le secteur saisonnier"
  }
];

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

  // États pour la charte
  const [isCharterSigned, setIsCharterSigned] = useState(false);
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [acceptedCGU, setAcceptedCGU] = useState(false);

  // États pour l'expert
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [tempSelectedExpert, setTempSelectedExpert] = useState<Expert | null>(null);

  // États pour le RDV
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [confirmedDateTime, setConfirmedDateTime] = useState<string>();

  // États pour les documents
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>(documentsList);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
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

    const savedDateTime = localStorage.getItem(`${auditType}_datetime`);
    if (savedDateTime) {
      setConfirmedDateTime(savedDateTime);
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

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);

      // Update progress in localStorage
      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = newStep;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));

      // Update progress bar
      setProgress((newStep - 1) * 25);

      toast({
        title: "Retour à l'étape précédente",
        description: `Vous êtes revenu à l'étape ${newStep}`,
      });
    }
  };

  const handleCharterSign = () => {
    if (acceptedCGU) {
      const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
      signedCharters[auditType] = true;
      localStorage.setItem('signedCharters', JSON.stringify(signedCharters));
      setIsCharterSigned(true);
      updateProgress(2);
      setShowCharterDialog(false);
      toast({
        title: "La charte est validée avec succès !",
        description: "Vous pouvez maintenant passer à l'étape suivante",
      });
    }
  };

  const handleExpertSelect = () => {
    if (tempSelectedExpert) {
      setSelectedExpert(tempSelectedExpert);
      const savedExperts = JSON.parse(localStorage.getItem('selectedExperts') || '{}');
      savedExperts[auditType] = tempSelectedExpert;
      localStorage.setItem('selectedExperts', JSON.stringify(savedExperts));
      updateProgress(3);
      setShowExpertDialog(false);
      toast({
        title: "Expert sélectionné",
        description: `Vous avez choisi ${tempSelectedExpert.name} comme expert`,
      });
    }
  };

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

  const handleDownloadCharter = () => {
    // Simuler le téléchargement de la charte
    toast({
      title: "Téléchargement de la charte",
      description: "La charte signée a été téléchargée",
    });
  };

  const steps = [
    {
      title: "Signature de la charte",
      description: "Signature de la charte contractuelle",
      icon: FileSignature,
      action: !isCharterSigned ? () => setShowCharterDialog(true) : handleDownloadCharter,
      actionLabel: isCharterSigned ? "Télécharger la charte" : "Signer la charte",
      actionIcon: isCharterSigned ? Download : undefined,
      status: isCharterSigned ? "completed" : currentStep === 1 ? "current" : "upcoming"
    },
    {
      title: "Sélection de l'expert",
      description: "Choix et validation de l'expert",
      icon: UserCog,
      action: currentStep === 2 ? () => setShowExpertDialog(true) : undefined,
      actionLabel: "Choisir un expert",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "upcoming"
    },
    {
      title: "Prise de rendez-vous",
      description: confirmedDateTime ? `RDV prévu le ${confirmedDateTime}` : "Planification du rendez-vous",
      icon: Calendar,
      action: currentStep === 3 ? () => setShowCalendarDialog(true) : undefined,
      actionLabel: "Prendre rendez-vous",
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
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Audit DFS</h1>
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
              <CardTitle>Étapes du processus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        stepNumber === currentStep && "bg-blue-50 border-blue-200",
                        stepNumber < currentStep && "bg-green-50 border-green-200",
                        stepNumber > currentStep && "bg-gray-50 border-gray-200"
                      )}
                      onClick={() => {
                        if (stepNumber <= Math.max(currentStep, 5)) {
                          setCurrentStep(stepNumber);
                          setProgress((stepNumber - 1) * 25);
                        }
                      }}
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
                        {step.action && (stepNumber === currentStep || (stepNumber === 1 && isCharterSigned)) && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              step.action();
                            }}
                            variant={stepNumber === currentStep ? "default" : "outline"}
                            className="flex items-center gap-2"
                          >
                            {step.actionIcon && <step.actionIcon className="w-4 h-4" />}
                            {step.actionLabel}
                          </Button>
                        )}
                      </div>
                      {stepNumber === 2 && selectedExpert && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-medium">{selectedExpert.name}</h4>
                          <p className="text-sm text-gray-600">{selectedExpert.company}</p>
                          <p className="text-sm text-gray-600">{selectedExpert.speciality}</p>
                        </div>
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

        {/* Dialogue de signature de la charte */}
        <Dialog open={showCharterDialog} onOpenChange={setShowCharterDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Charte Contractuelle DFS</DialogTitle>
              <DialogDescription>
                Veuillez lire attentivement la charte avant de la signer
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-md my-4">
              {/* Contenu de la charte */}
              <h3 className="text-lg font-semibold mb-4">Charte de l'Audit DFS</h3>
              <p className="mb-4">
                Cette charte définit les engagements mutuels entre le client et l'expert...
                [Contenu de la charte]
              </p>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="cgu"
                checked={acceptedCGU}
                onCheckedChange={(checked) => setAcceptedCGU(checked as boolean)}
              />
              <label
                htmlFor="cgu"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J'accepte les conditions générales d'utilisation
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCharterDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCharterSign} disabled={!acceptedCGU}>
                Signer la charte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue de sélection d'expert */}
        <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Sélection de l'expert DFS</DialogTitle>
              <DialogDescription>
                Choisissez un expert spécialisé en DFS pour votre audit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {dfsExperts.map((expert) => (
                <div
                  key={expert.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    tempSelectedExpert?.id === expert.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-400"
                  )}
                  onClick={() => setTempSelectedExpert(expert)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{expert.name}</h4>
                      <p className="text-sm text-gray-600">{expert.company}</p>
                      <p className="text-sm text-blue-600">{expert.speciality}</p>
                      <p className="text-sm text-gray-500">{expert.experience}</p>
                      <p className="text-sm mt-2">{expert.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/expert/${expert.id}`);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExpertDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleExpertSelect}
                disabled={!tempSelectedExpert}
              >
                Valider cet expert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue de prise de rendez-vous */}
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
                    const formattedDateTime = `${formattedDate} à ${selectedTime}`;
                    setConfirmedDateTime(formattedDateTime);
                    localStorage.setItem(`${auditType}_datetime`, formattedDateTime);
                    updateProgress(4);
                    setShowCalendarDialog(false);
                    toast({
                      title: "Rendez-vous confirmé",
                      description: `Votre rendez-vous est programmé pour le ${formattedDateTime}`,
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
    </div>
  );
}