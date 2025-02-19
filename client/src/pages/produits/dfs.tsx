import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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

// Generate available time slots (9h-17h, 30min intervals)
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

const documentsList: DocumentItem[] = [
  { id: "payslips", label: "Bulletins de salaire (des trois dernières années)", uploadedFiles: [] },
  { id: "contracts", label: "Contrats de travail des salariés concernés", uploadedFiles: [] },
  { id: "conventions", label: "Conventions collectives applicables", uploadedFiles: [] },
  { id: "attestations", label: "Attestation de l'activité réelle des salariés", uploadedFiles: [] },
  { id: "expenses", label: "Justificatifs de frais professionnels remboursés", uploadedFiles: [] },
  { id: "dsn", label: "Déclarations sociales nominatives (DSN)", uploadedFiles: [] },
  { id: "register", label: "Registre unique du personnel", uploadedFiles: [] },
  { id: "urssaf", label: "Historique des cotisations URSSAF", uploadedFiles: [] },
  { id: "travel", label: "Justificatifs de déplacements professionnels (notes de frais, ordres de mission)", uploadedFiles: [] },
  { id: "other", label: "Autre document", uploadedFiles: [] },
];

const experts = [
  {
    id: 1,
    name: "Sophie Martin",
    company: "DFS Consulting",
    speciality: "Expert Fiscalité Saisonnière",
    experience: "15 ans d'expertise",
    compensation: 30,
  },
  {
    id: 2,
    name: "EY Seasonal",
    company: "Ernst & Young",
    speciality: "Audit & Conseil DFS",
    experience: "Leader mondial du conseil",
    compensation: 35,
  },
  {
    id: 3,
    name: "Pierre Dubois",
    company: "SeasonOptim",
    speciality: "Optimisation DFS",
    experience: "Spécialiste travail saisonnier",
    compensation: 28,
  },
  {
    id: 4,
    name: "FiscaSeason",
    company: "FiscaSeason SARL",
    speciality: "Conseil en Fiscalité Saisonnière",
    experience: "Cabinet spécialisé secteur saisonnier",
    compensation: 32,
  }
];

const StepIndicator = ({ status, number }: { status: StepStatus; number: number }) => {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        status === "completed" && "bg-green-100 text-green-600",
        status === "current" && "bg-orange-100 text-orange-600",
        status === "upcoming" && "bg-gray-100 text-gray-600"
      )}
    >
      {status === "completed" ? (
        <Check className="w-4 h-4" />
      ) : (
        <span className="font-semibold">{number}</span>
      )}
    </div>
  );
};

export default function DFSAudit() {
  const [currentStep, setCurrentStep] = useState(1);
  const [location] = useLocation();
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
  const [confirmationMessage, setConfirmationMessage] = useState<string>();
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>(documentsList);

  useEffect(() => {
    const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
    setIsCharterSigned(!!signedCharters[auditType]);

    const progress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
    if (!progress[auditType]) {
      progress[auditType] = 1;
      localStorage.setItem('auditProgress', JSON.stringify(progress));
    }
    setCurrentStep(progress[auditType]);

    // Load selected expert from localStorage
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
  }, [auditType]);

  const handleCharterSign = () => {
    if (isCharterSigned) {
      const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
      signedCharters[auditType] = true;
      localStorage.setItem('signedCharters', JSON.stringify(signedCharters));

      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = 2;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
      setCurrentStep(2);

      toast({
        title: "Succès",
        description: "La charte a été signée avec succès",
      });
      setShowCharterDialog(false);
    }
  };

  const handleCompensationValidation = () => {
    if (acceptedCompensation) {
      setShowCompensationDialog(false);
      setExpertContactSuccess(true);

      // Update progress to step 3 (RDV)
      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = 3;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
      setCurrentStep(3);
    }
  };

  const handleScheduleMeeting = () => {
    if (selectedDate && selectedTime) {
      // Update progress to step 4 (Documents)
      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = 4;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
      setCurrentStep(4);

      const formattedDateTime = `RDV pris le ${format(selectedDate, 'dd/MM/yyyy')} à ${selectedTime}`;
      setConfirmedDateTime(formattedDateTime);
      setConfirmationMessage(formattedDateTime);
      setShowCalendarDialog(false);
      toast({
        title: "RDV confirmé",
        description: formattedDateTime,
      });
    }
  };

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (stepNumber < currentStep) {
      return "completed";
    }
    if (stepNumber === currentStep) {
      return "current";
    }
    return "upcoming";
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

    // If at least one document is uploaded, update the audit progress to final step
    if (updatedDocs.some(doc => doc.uploadedFiles.length > 0)) {
      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = 5;  // Move to final step
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
      setCurrentStep(5);
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


  const steps = [
    {
      title: "Signer la charte contractuelle",
      description: "Étape nécessaire pour débuter l'audit",
      content: !isCharterSigned && currentStep === 1 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setShowCharterDialog(true)}
        >
          Lire et signer la charte
        </Button>
      ),
      action: isCharterSigned ? {
        label: "Télécharger la charte signée",
        href: `/audit/${auditType}/sign-charter`,
        icon: Download
      } : undefined
    },
    {
      title: "Validation de l'expert",
      description: "Examen du dossier par un expert",
      action: !selectedExpert ? {
        label: "Choisir un expert",
        href: `/audit/${auditType}/expert/1`,
        icon: Circle
      } : undefined,
      content: selectedExpert && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedExpert.name}</p>
              <p className="text-sm text-gray-600">{selectedExpert.speciality}</p>
            </div>
            {!expertContactSuccess && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowCompensationDialog(true)}
              >
                <Mail className="w-4 h-4" />
                Contact
              </Button>
            )}
          </div>
          {expertContactSuccess && (
            <p className="text-green-600 text-sm mt-2">
              Félicitation, votre dossier a bien été envoyé.
            </p>
          )}
        </div>
      )
    },
    {
      title: "Prise de RDV",
      description: "Sélectionner un créneau dans l'agenda de l'expert",
      content: expertContactSuccess && (
        <div className="mt-4">
          {confirmedDateTime ? (
            <p className="text-green-600 text-sm">{confirmationMessage}</p>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCalendarDialog(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Choisir un créneau
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Documents à joindre",
      description: "Fournir les documents requis",
      content: currentStep >= 4 && (
        <div className="mt-4 space-y-3">
          {uploadedDocuments.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm flex-grow",
                  doc.uploadedFiles.length > 0 && "text-green-600"
                )}>
                  {doc.label}
                </span>
                <FileUpload
                  documentId={doc.id}
                  onUploadComplete={(files) => handleDocumentUpload(doc.id, files)}
                />
              </div>
              {doc.uploadedFiles.length > 0 && (
                <div className="ml-4 text-xs text-green-600">
                  {doc.uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        {file.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteDocument(doc.id, file.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Résultat de l'audit",
      description: "Rapport final et recommandations",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Audit <strong>DFS</strong></h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Finalisation du dossier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const status = getStepStatus(stepNumber);
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <StepIndicator status={status} number={stepNumber} />
                      <div className="flex-grow">
                        <h3
                          className={cn(
                            "font-semibold",
                            status === "completed" && "text-green-600",
                            status === "current" && "text-orange-600",
                            status === "upcoming" && "text-gray-900"
                          )}
                        >
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        {step.content && (status === "current" || status === "completed") && step.content}
                        {step.action && (status === "current" || status === "completed") && (
                          <Link href={step.action.href}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 flex items-center gap-2"
                            >
                              <step.action.icon className="w-4 h-4" />
                              {step.action.label}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experts conseillés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/audit/${auditType}/expert/${expert.id}`}
                    onClick={() => {
                      // Save selected expert to localStorage
                      const savedExperts = JSON.parse(localStorage.getItem('selectedExperts') || '{}');
                      savedExperts[auditType] = expert;
                      localStorage.setItem('selectedExperts', JSON.stringify(savedExperts));
                      setSelectedExpert(expert);
                    }}
                  >
                    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <h3 className="font-semibold text-lg">
                        {expert.company ? `${expert.name} - ${expert.company}` : expert.name}
                      </h3>
                      <p className="text-blue-600">{expert.speciality}</p>
                      <p className="text-sm text-gray-600">{expert.experience}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Link href="/">
            <Button variant="outline">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>

      <CharterDialog
        open={showCharterDialog}
        onOpenChange={setShowCharterDialog}
        onAccept={handleCharterSign}
        auditType={auditType}
        isCharterSigned={isCharterSigned}
        setIsCharterSigned={setIsCharterSigned}
      />

      <Dialog open={showCompensationDialog} onOpenChange={setShowCompensationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conditions de rémunération</DialogTitle>
            <DialogDescription>
              Veuillez prendre connaissance des conditions de rémunération de l'expert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Honoraires de l'expert</h3>
              <p className="text-sm text-gray-600 mb-4">
                La rémunération de l'expert est fixée à {selectedExpert?.compensation}% des économies réalisées sur les trois premières années.
                Ce pourcentage comprend :
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>L'analyse complète de votre dossier</li>
                <li>Le suivi personnalisé de votre audit</li>
                <li>La mise en place des optimisations</li>
                <li>L'accompagnement dans les démarches administratives</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedCompensation}
                onCheckedChange={(checked) => setAcceptedCompensation(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J'accepte les conditions de l'expert
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCompensationValidation}
              disabled={!acceptedCompensation}
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-[700px] top-[50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle>Sélectionner un créneau</DialogTitle>
            <DialogDescription className="mb-4">
              Choisissez une date et un horaire pour votre rendez-vous avec l'expert
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={fr}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  className="rounded-md border"
                  showOutsideDays={false}
                  ISOWeek={true}
                />
              </div>

              {selectedDate && (
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-3">Horaires disponibles</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2">
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
                </div>
              )}
            </div>

            <div className="flex justify-end items-center pt-4 border-t">
              <Button
                onClick={handleScheduleMeeting}
                disabled={!selectedDate || !selectedTime}
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}